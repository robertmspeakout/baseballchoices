import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";
import { join } from "path";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Load schools data once
let schoolsData: any[] | null = null;
function getSchools(): any[] {
  if (!schoolsData) {
    const filePath = join(process.cwd(), "src/data/schools.json");
    schoolsData = JSON.parse(readFileSync(filePath, "utf-8"));
  }
  return schoolsData!;
}

// Build a compact summary of all schools for Claude's context
function buildSchoolsSummary(): string {
  const schools = getSchools();
  const rows = schools.map((s) => {
    const parts = [
      `ID:${s.id}`,
      s.name,
      `${s.city},${s.state}`,
      s.division,
      s.conference,
      s.public_private,
      s.tuition ? `$${s.tuition}` : "tuition:N/A",
      s.enrollment ? `${s.enrollment} students` : "",
      s.acceptance_rate ? `${s.acceptance_rate}% accept` : "",
      s.graduation_rate ? `${s.graduation_rate}% grad` : "",
      s.current_ranking ? `Ranked #${s.current_ranking}` : "",
      s.cws_appearances ? `${s.cws_appearances} CWS` : "",
      s.ncaa_regionals ? `${s.ncaa_regionals} regionals` : "",
      s.mlb_draft_picks ? `${s.mlb_draft_picks} draft picks` : "",
      s.high_academic ? "High-Academic" : "",
      s.head_coach_name ? `Coach: ${s.head_coach_name}` : "",
      s.last_season_record ? `Record: ${s.last_season_record}` : "",
      s.scholarship_limit ? `${s.scholarship_limit} scholarships` : "",
      s.roster_size ? `Roster: ${s.roster_size}` : "",
    ].filter(Boolean);
    return parts.join(" | ");
  });
  return rows.join("\n");
}

// Cache the summary so we only build it once
let cachedSummary: string | null = null;
function getSchoolsSummary(): string {
  if (!cachedSummary) {
    cachedSummary = buildSchoolsSummary();
  }
  return cachedSummary;
}

const SYSTEM_PROMPT = `You are the ExtraBase AI Scout — a friendly, knowledgeable college baseball recruiting assistant. You help high school baseball players find the right college baseball programs for them.

You have access to a database of college baseball programs. Here is the complete database:

<schools_database>
{SCHOOLS_DATA}
</schools_database>

## Your Job

1. **Understand what the player is looking for.** Ask clarifying questions if their description is vague. Good questions include:
   - What division(s) are you interested in? (D1, D2, D3, JUCO)
   - What part of the country do you want to play in?
   - How important are academics to you?
   - What's your budget for tuition?
   - Do you want a big school or a smaller campus?
   - How competitive of a program are you looking for?
   - Is getting drafted into the MLB important to you?
   - What position do you play?

2. **Recommend programs** that match what they describe. When recommending schools:
   - Recommend 5-10 programs at a time (not too many, not too few)
   - Explain WHY each school is a good fit for what they described
   - Mention specific data points (tuition, enrollment, record, draft picks, conference, ranking, etc.)
   - If a school has a current ranking, mention it
   - Mention the head coach name if available

3. **Be conversational and encouraging.** These are high school kids making a big life decision. Be supportive, honest, and helpful. Use a tone that's knowledgeable but not stiff.

4. **Use the player's profile info** if provided. If you know their GPA, test scores, location, etc., factor that into your recommendations (e.g., don't recommend a school with a 10% acceptance rate to a 2.5 GPA student unless they ask).

## Rules
- Only recommend schools from the database provided. Never make up schools or data.
- When you reference a school, include its database ID in this exact format: [SCHOOL_ID:123] (replacing 123 with the actual ID). This lets us link to the school's detail page. Put this right after the school name.
- If the player asks about something outside college baseball recruiting, politely redirect them.
- Keep responses concise. Don't write essays — bullet points and short paragraphs work best.
- If a player's criteria are very narrow and few schools match, tell them that and suggest broadening their search.
- Don't ask too many questions at once. 1-3 questions per message is ideal.`;

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI matching is not configured. Please add your ANTHROPIC_API_KEY to environment variables." },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { messages, playerProfile } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages are required" }, { status: 400 });
    }

    // Build system prompt with school data injected
    const systemPrompt = SYSTEM_PROMPT.replace("{SCHOOLS_DATA}", getSchoolsSummary());

    // Add player context if available
    let playerContext = "";
    if (playerProfile) {
      const parts: string[] = [];
      if (playerProfile.playerName) parts.push(`Name: ${playerProfile.playerName}`);
      if (playerProfile.gradYear) parts.push(`Grad Year: ${playerProfile.gradYear}`);
      if (playerProfile.primaryPosition) parts.push(`Position: ${playerProfile.primaryPosition}`);
      if (playerProfile.secondaryPosition) parts.push(`Secondary Position: ${playerProfile.secondaryPosition}`);
      if (playerProfile.city && playerProfile.state) parts.push(`Location: ${playerProfile.city}, ${playerProfile.state}`);
      if (playerProfile.zipCode) parts.push(`Zip: ${playerProfile.zipCode}`);
      if (playerProfile.highSchool) parts.push(`High School: ${playerProfile.highSchool}`);
      if (playerProfile.travelBall) parts.push(`Travel Ball: ${playerProfile.travelBall}`);
      if (playerProfile.gpa) parts.push(`GPA: ${playerProfile.gpa} (${playerProfile.gpaType || "unspecified"})`);
      if (playerProfile.satScore) parts.push(`SAT: ${playerProfile.satScore}`);
      if (playerProfile.actScore) parts.push(`ACT: ${playerProfile.actScore}`);
      if (parts.length > 0) {
        playerContext = `\n\nThe player you're talking to has the following profile:\n${parts.join("\n")}`;
      }
    }

    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: systemPrompt + playerContext,
      messages: messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
    });

    // Extract text from response
    const text = response.content
      .filter((block: any) => block.type === "text")
      .map((block: any) => block.text)
      .join("");

    // Parse [SCHOOL_ID:xxx] markers and look up school card data
    const schoolIdMatches = [...text.matchAll(/\[SCHOOL_ID:(\d+)\]/g)];
    const seenIds = new Set<number>();
    const schoolCards: any[] = [];
    const allSchools = getSchools();

    for (const match of schoolIdMatches) {
      const id = parseInt(match[1], 10);
      if (seenIds.has(id)) continue;
      seenIds.add(id);
      const school = allSchools.find((s) => s.id === id);
      if (school) {
        schoolCards.push({
          id: school.id,
          name: school.name,
          mascot: school.mascot || "",
          city: school.city,
          state: school.state,
          division: school.division,
          conference: school.conference,
          logo_url: school.logo_url || null,
          primary_color: school.primary_color || null,
        });
      }
    }

    return NextResponse.json({
      reply: text,
      schools: schoolCards,
      usage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
      },
    });
  } catch (err: any) {
    console.error("AI Match error:", err);

    if (err?.status === 401) {
      return NextResponse.json(
        { error: "Invalid API key. Please check your ANTHROPIC_API_KEY." },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Something went wrong with the AI. Please try again." },
      { status: 500 }
    );
  }
}
