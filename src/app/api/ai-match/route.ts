import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";
import { join } from "path";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Rate limiter: 20 messages per 30 days per user
const aiLimiter = rateLimit({
  name: "ai-match",
  max: 20,
  windowMs: 30 * 24 * 60 * 60 * 1000,
});

// Load schools data once
let schoolsData: any[] | null = null;
function getSchools(): any[] {
  if (!schoolsData) {
    const filePath = join(process.cwd(), "src/data/schools.json");
    schoolsData = JSON.parse(readFileSync(filePath, "utf-8"));
  }
  return schoolsData!;
}

// Build a SLIM summary — only the fields the AI needs to make recommendations
function buildSchoolsSummary(schools: any[]): string {
  const rows = schools.map((s) => {
    const parts = [
      `ID:${s.id}`,
      s.name,
      `${s.city},${s.state}`,
      s.division,
      s.conference,
      s.public_private,
      s.tuition ? `$${s.tuition}` : "",
      s.enrollment ? `${s.enrollment}students` : "",
      s.current_ranking ? `#${s.current_ranking}` : "",
      s.mlb_draft_picks ? `${s.mlb_draft_picks}drafted` : "",
      s.last_season_record || "",
      s.cws_appearances ? `${s.cws_appearances}CWS` : "",
      s.ncaa_regionals ? `${s.ncaa_regionals}regionals` : "",
      s.high_academic ? "StrongAcademics" : "",
      s.roster_size ? `roster:${s.roster_size}` : "",
      s.scholarship_limit ? `scholarships:${s.scholarship_limit}` : "",
      s.head_coach_name ? `Coach:${s.head_coach_name}` : "",
    ].filter(Boolean);
    return parts.join("|");
  });
  return rows.join("\n");
}

// Pre-filter schools based on keywords in the conversation
function preFilterSchools(messages: any[]): any[] {
  const allSchools = getSchools();
  const allText = messages.map((m: any) => m.content).join(" ").toLowerCase();

  // Extract division mentions
  const divisions: string[] = [];
  if (/\bd1\b|division\s*i\b|division\s*1\b|d-?1\b/i.test(allText)) divisions.push("D1");
  if (/\bd2\b|division\s*ii\b|division\s*2\b|d-?2\b/i.test(allText)) divisions.push("D2");
  if (/\bd3\b|division\s*iii\b|division\s*3\b|d-?3\b/i.test(allText)) divisions.push("D3");
  if (/\bjuco\b|junior\s*college\b|community\s*college\b/i.test(allText)) divisions.push("JUCO");

  // Extract region/state mentions
  const stateAbbrevs = allSchools.map(s => s.state).filter((v: string, i: number, a: string[]) => a.indexOf(v) === i);
  const mentionedStates: string[] = [];
  const stateNames: Record<string, string> = {
    AL: "alabama", AK: "alaska", AZ: "arizona", AR: "arkansas", CA: "california",
    CO: "colorado", CT: "connecticut", FL: "florida", GA: "georgia", IL: "illinois",
    IN: "indiana", IA: "iowa", KS: "kansas", KY: "kentucky", LA: "louisiana",
    MD: "maryland", MA: "massachusetts", MI: "michigan", MN: "minnesota", MS: "mississippi",
    MO: "missouri", NC: "north carolina", NJ: "new jersey", NY: "new york", OH: "ohio",
    OK: "oklahoma", OR: "oregon", PA: "pennsylvania", SC: "south carolina", TN: "tennessee",
    TX: "texas", VA: "virginia", WA: "washington", WI: "wisconsin",
  };
  for (const abbr of stateAbbrevs) {
    const fullName = stateNames[abbr];
    if (fullName && allText.includes(fullName)) mentionedStates.push(abbr);
  }

  // Region keywords — must match REGIONS from playerProfile.ts (case-insensitive)
  const regionStates: Record<string, string[]> = {
    // Exact matches for intake form REGIONS
    "northeast": ["ME", "NH", "VT", "MA", "RI", "CT", "NY", "NJ", "PA"],
    "mid-atlantic": ["DE", "MD", "VA", "WV", "NC", "SC"],
    "southeast": ["GA", "FL", "AL", "MS", "TN", "KY"],
    "midwest": ["OH", "MI", "IN", "IL", "WI", "MN", "IA", "MO"],
    "great plains": ["ND", "SD", "NE", "KS", "OK"],
    "texas": ["TX"],
    "mountain west": ["MT", "ID", "WY", "CO", "UT", "NV", "NM", "AZ"],
    "pacific nw": ["WA", "OR", "AK"],
    "california": ["CA", "HI"],
    // Additional generic aliases
    "south": ["AL", "AR", "FL", "GA", "KY", "LA", "MS", "NC", "SC", "TN", "TX", "VA", "WV"],
    "southwest": ["AZ", "NM", "OK", "TX"],
    "west coast": ["CA", "OR", "WA"],
    "east coast": ["CT", "DE", "FL", "GA", "MA", "MD", "ME", "NC", "NH", "NJ", "NY", "PA", "RI", "SC", "VA", "VT"],
  };
  const regionMatches: string[] = [];
  for (const [region, states] of Object.entries(regionStates)) {
    if (allText.includes(region.toLowerCase())) regionMatches.push(...states);
  }

  // If no filters detected, return all schools (first message is usually vague)
  if (divisions.length === 0 && mentionedStates.length === 0 && regionMatches.length === 0) {
    return allSchools;
  }

  // Filter schools
  let filtered = allSchools;
  if (divisions.length > 0) {
    filtered = filtered.filter((s: any) => divisions.includes(s.division));
  }
  const stateFilter = [...new Set([...mentionedStates, ...regionMatches])];
  if (stateFilter.length > 0) {
    filtered = filtered.filter((s: any) => stateFilter.includes(s.state));
  }

  // If filter is too aggressive (< 10 results), fall back to broader set
  if (filtered.length < 10) {
    if (divisions.length > 0) {
      filtered = allSchools.filter((s: any) => divisions.includes(s.division));
    }
    if (filtered.length < 10) return allSchools;
  }

  return filtered;
}

// Match school names mentioned in AI response text against the database
function matchSchoolsByName(text: string, allSchools: any[]): { id: number; name: string }[] {
  const matched: { id: number; name: string }[] = [];
  const seenIds = new Set<number>();

  // First: try [SCHOOL_ID:xxx] tags
  const tagMatches = [...text.matchAll(/\[SCHOOL_ID:\s*(\d+)\s*\]/gi)];
  for (const m of tagMatches) {
    const id = parseInt(m[1], 10);
    if (seenIds.has(id)) continue;
    const school = allSchools.find((s: any) => s.id === id);
    if (school) {
      seenIds.add(id);
      matched.push({ id: school.id, name: school.name });
    }
  }

  // Second: fuzzy match school names in the text (fallback when tags are missing)
  // Sort by name length descending so longer names match first (e.g. "Texas A&M" before "Texas")
  const sortedSchools = [...allSchools].sort((a, b) => b.name.length - a.name.length);
  const textLower = text.toLowerCase();
  for (const school of sortedSchools) {
    if (seenIds.has(school.id)) continue;
    const nameLower = school.name.toLowerCase();
    // Only match if it appears as a distinct mention (not substring of another word)
    // Check for the school name preceded/followed by non-alpha characters or start/end
    const escaped = nameLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(?:^|[^a-z])${escaped}(?:[^a-z]|$)`);
    if (regex.test(textLower)) {
      seenIds.add(school.id);
      matched.push({ id: school.id, name: school.name });
    }
  }

  return matched;
}

const SYSTEM_PROMPT = `You are the ExtraBase AI Scout — a college baseball recruiting assistant for 14-18 year old players. Talk like a teammate, not a counselor. Short sentences, simple words, no jargon. Never use words like "leverage", "trajectory", "metrics", "facilitate", "optimal", "viable", "utilize", "academic profile", "competitive landscape", "financial considerations", or "prospective student-athlete."

<schools_database>
{SCHOOLS_DATA}
</schools_database>

RULES:
1. ALWAYS recommend 8-12 programs in your FIRST response. The player already answered intake questions — skip the recap, go straight to recommendations. DO NOT repeat back what they told you. Just give the results.
2. For each school: 1 sentence why it fits + key numbers (tuition, conference, record, draft picks, ranking, coach name). Use bullet points.
3. After recommendations, add ONE personalized follow-up offer (2-3 sentences max). Pick the most relevant:
   - ALWAYS ask about baseball ability if not mentioned: "What kind of player are you — top prospect competing for a spot at a big program, or looking for a place you can get on the field right away?"
   - If high academic + strong GPA (3.5+): "You're clearly focused on academics. You can check each school's majors on their detail page here in ExtraBase — want me to focus on the strongest academic programs for you?"
   - If high GPA but didn't mention academics: "Your GPA opens doors to some great academic programs. Want me to factor that in?"
   - If draft matters: "What position do you play and how would you describe your game? That'll help me find programs that develop guys for the draft."
   - If broad region/"Anywhere": "Any specific states you're drawn to? Or places where you have family?"
   - If multiple divisions: "Leaning toward one division? Playing time and scholarship money can be very different between D1 and D2."
4. EVERY response MUST include program recommendations — NEVER respond with only questions or clarifications. If the player asks to refine, give updated recommendations FIRST, then ask a brief follow-up if needed. Results always come first.
5. If SAT/ACT is missing from their profile or the message says they haven't taken it yet, they haven't taken it — NOT that scores are low. Never mention SAT/ACT scores unless the player explicitly provided them in their message. Ignore any test scores from the player profile if the message says they haven't taken them.
6. NEVER mention the player's position or make position-specific recommendations unless the player explicitly states their position in their message. The profile may include a position but do NOT reference it, assume it, or tailor advice to it unless the player brings it up themselves.
7. FORMATTING: Do NOT use markdown headers (# or ##). Just use **bold text** for section labels. Use dashes for bullet points. Keep it clean and simple.
8. Every school mention MUST include its ID tag: **LSU** [SCHOOL_ID:1]. Use **bold** for school names.
9. School size: "small" means under 5,000 students, "medium" means 5,000-15,000, "large" means 15,000+. Use the enrollment number in the data to match. "Postseason contenders" = schools with CWS appearances or NCAA regional appearances.
10. Only recommend schools from the database. Be encouraging. Never promise scholarships or roster spots.
11. ONLY discuss college baseball. If asked about anything else: "I only know about college baseball! What kind of program are you looking for?"
12. You're talking to minors. Keep it appropriate. Never ask for phone numbers, addresses, or passwords.`;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ remaining: 20 });
  }
  const UNLIMITED_EMAILS = ["testing@extrabase.com"];
  const userEmail = session.user.email?.toLowerCase() || "";
  if (UNLIMITED_EMAILS.includes(userEmail)) {
    return NextResponse.json({ remaining: 20 });
  }
  const { remaining } = aiLimiter.peek(session.user.id);
  return NextResponse.json({ remaining });
}

export async function POST(request: NextRequest) {
  // Auth check
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Please sign in to use AI Scout." },
      { status: 401 }
    );
  }

  // Unlimited accounts bypass rate limiting
  const UNLIMITED_EMAILS = ["testing@extrabase.com"];
  const userEmail = session.user.email?.toLowerCase() || "";
  const isUnlimited = UNLIMITED_EMAILS.includes(userEmail);

  // Rate limit check (skip for unlimited accounts)
  let remaining: number | undefined;
  if (!isUnlimited) {
    const result = aiLimiter.check(session.user.id);
    remaining = result.remaining;
    if (!result.allowed) {
      return NextResponse.json(
        {
          error: "You've used all 20 AI Scout messages for this month. Your limit resets in 30 days — in the meantime, browse programs directly!",
          remaining: 0,
        },
        { status: 429 }
      );
    }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI Scout is not available right now. Please try again later." },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { messages, playerProfile } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages are required" }, { status: 400 });
    }

    // Pre-filter schools based on conversation keywords for faster responses
    const relevantSchools = preFilterSchools(messages);

    // Build system prompt with filtered school data
    const schoolsSummary = buildSchoolsSummary(relevantSchools);
    const systemPrompt = SYSTEM_PROMPT.replace("{SCHOOLS_DATA}", schoolsSummary);

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
        playerContext = `\n\nThe player you are talking to has the following profile:\n${parts.join("\n")}`;
      }
    }

    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1200,
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

    // Match schools: first by [SCHOOL_ID:xxx] tags, then by name matching as fallback
    const allSchools = getSchools();
    const schoolCards = matchSchoolsByName(text, allSchools);

    return NextResponse.json({
      reply: text,
      schools: schoolCards,
      remaining,
    });
  } catch (err: any) {
    console.error("AI Match error:", err);

    if (err?.status === 401) {
      return NextResponse.json(
        { error: "AI Scout is temporarily unavailable. Please try again later." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
