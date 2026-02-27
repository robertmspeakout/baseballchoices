import { NextRequest, NextResponse } from "next/server";

/* eslint-disable @typescript-eslint/no-explicit-any */

export const dynamic = "force-dynamic";

export type TickerItem = {
  schoolName: string;
  schoolLogo: string | null;
  type: "score" | "next_game" | "record";
  text: string;
  subtext: string;
  link: string | null;
};

// Batch endpoint: fetches ticker items (last score, next game, record) for multiple schools
// Usage: GET /api/ticker?schools=Vanderbilt,Texas,Florida+State
export async function GET(request: NextRequest) {
  const schoolsParam = request.nextUrl.searchParams.get("schools");
  if (!schoolsParam) {
    return NextResponse.json({ items: [] });
  }

  const schoolEntries: { name: string; logo: string | null; espnId: string | null }[] = [];
  try {
    // Accept JSON array of {name, logo} objects
    const parsed = JSON.parse(schoolsParam);
    if (Array.isArray(parsed)) {
      for (const entry of parsed) {
        if (typeof entry === "object" && entry.name) {
          // Extract ESPN team ID from logo URL if available
          const espnId = entry.logo?.match(/espncdn\.com\/.*\/(\d+)\.\w+$/)?.[1] || null;
          schoolEntries.push({ name: entry.name, logo: entry.logo || null, espnId });
        }
      }
    }
  } catch {
    // Fall back to comma-separated names
    const names = schoolsParam.split(",").map((s) => s.trim()).filter(Boolean);
    for (const name of names) {
      schoolEntries.push({ name, logo: null, espnId: null });
    }
  }

  if (schoolEntries.length === 0) {
    return NextResponse.json({ items: [] });
  }

  // Limit to 15 schools max
  const batch = schoolEntries.slice(0, 15);
  const allItems: TickerItem[] = [];

  const fetchTickerForSchool = async (entry: { name: string; logo: string | null; espnId: string | null }) => {
    try {
      let teamId: string;
      let teamLogo: string | null = entry.logo;

      if (entry.espnId) {
        // Use the known ESPN ID — skip the ambiguous name search
        teamId = entry.espnId;
      } else {
        // Fallback: search by name
        const searchUrl = `https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/teams?limit=3&search=${encodeURIComponent(entry.name)}`;
        const searchRes = await fetch(searchUrl, { cache: "no-store" });
        if (!searchRes.ok) return;

        const searchData = await searchRes.json();
        const teams: any[] =
          searchData?.sports?.[0]?.leagues?.[0]?.teams ||
          searchData?.teams || [];
        if (teams.length === 0) return;

        const normalize = (e: any) => e.team || e;
        const schoolLower = entry.name.toLowerCase();
        const teamEntry = normalize(
          teams.find((e: any) => normalize(e).displayName?.toLowerCase() === schoolLower) ||
          teams.find((e: any) => normalize(e).displayName?.toLowerCase().includes(schoolLower)) ||
          teams[0]
        );

        teamId = String(teamEntry.id);
        teamLogo = teamEntry.logos?.[0]?.href || entry.logo;
      }

      // Step 2: Fetch team info + schedule in parallel
      const year = new Date().getFullYear();
      const [teamRes, scheduleRes] = await Promise.all([
        fetch(
          `https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/teams/${teamId}`,
          { cache: "no-store" }
        ),
        fetch(
          `https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/teams/${teamId}/schedule?season=${year}`,
          { cache: "no-store" }
        ),
      ]);

      // Extract record
      let record: string | null = null;
      if (teamRes.ok) {
        try {
          const teamData = await teamRes.json();
          const t = teamData?.team || teamData;
          if (t?.record?.items?.[0]?.summary) {
            record = t.record.items[0].summary;
          } else if (typeof t?.record === "string") {
            record = t.record;
          }
        } catch { /* ignore */ }
      }

      // Parse schedule
      if (!scheduleRes.ok) return;
      const scheduleData = await scheduleRes.json();
      const events: any[] = scheduleData?.events || [];

      if (!record) {
        const st = scheduleData?.team;
        if (st?.record?.items?.[0]?.summary) {
          record = st.record.items[0].summary;
        } else if (st?.recordSummary) {
          record = st.recordSummary;
        }
      }

      const extractScore = (c: any): string | null => {
        const s = c.score;
        if (s == null || s === "") return null;
        if (typeof s === "number") return String(s);
        if (typeof s === "string") return s;
        if (typeof s === "object") {
          if (s.displayValue != null) return String(s.displayValue);
          if (s.value != null) return String(s.value);
        }
        return null;
      };

      // Find last completed game and next upcoming game
      let lastGame: any = null;
      let nextGame: any = null;

      for (const event of events) {
        const comp = event.competitions?.[0];
        if (!comp) continue;
        const isCompleted = comp.status?.type?.completed === true;
        const competitors: any[] = comp.competitors || [];
        if (competitors.length < 2) continue;

        if (isCompleted) {
          lastGame = { event, comp, competitors };
        } else if (!nextGame) {
          nextGame = { event, comp, competitors };
        }
      }

      const logo = teamLogo || entry.logo;

      // Add last score ticker item
      if (lastGame) {
        const { event, competitors } = lastGame;
        const ourTeam = competitors.find((c: any) => String(c.team?.id || c.id) === teamId);
        const opponent = competitors.find((c: any) => String(c.team?.id || c.id) !== teamId);
        if (ourTeam && opponent) {
          const ourScore = extractScore(ourTeam);
          const oppScore = extractScore(opponent);
          const oppName = opponent.team?.shortDisplayName || opponent.team?.displayName || "Opp";
          const homeAway = ourTeam.homeAway === "home" ? "vs" : "@";

          let resultTag = "";
          if (ourScore != null && oppScore != null) {
            const won = ourTeam.winner === true || parseInt(ourScore) > parseInt(oppScore);
            resultTag = won ? "W" : "L";
          }

          const gameDate = new Date(event.date);
          const dateStr = gameDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });

          const scoreText = ourScore != null && oppScore != null
            ? `${entry.name} ${ourScore}, ${oppName} ${oppScore}`
            : `${entry.name} ${homeAway} ${oppName}`;

          // Prefer recap or summary link over generic boxscore
          const eventLinks: any[] = event.links || [];
          const findTickerLink = (...rels: string[]) =>
            eventLinks.find((l: any) =>
              rels.some((r) => l.rel?.includes(r) || l.text?.toLowerCase().includes(r))
            )?.href;
          const gameId = event.id || event.uid?.split(":").pop();
          const scoreLink =
            findTickerLink("recap") ||
            findTickerLink("summary") ||
            (gameId ? `https://www.espn.com/college-baseball/game/_/gameId/${gameId}` : null) ||
            `https://www.google.com/search?q=${encodeURIComponent(`${entry.name} baseball vs ${oppName} recap ${dateStr}`)}&tbm=nws`;

          allItems.push({
            schoolName: entry.name,
            schoolLogo: logo,
            type: "score",
            text: scoreText,
            subtext: `${resultTag ? resultTag + " · " : ""}Final · ${dateStr}`,
            link: scoreLink,
          });
        }
      }

      // Add next game ticker item
      if (nextGame) {
        const { event, competitors } = nextGame;
        const ourTeam = competitors.find((c: any) => String(c.team?.id || c.id) === teamId);
        const opponent = competitors.find((c: any) => String(c.team?.id || c.id) !== teamId);
        if (ourTeam && opponent) {
          const oppName = opponent.team?.shortDisplayName || opponent.team?.displayName || "TBD";
          const homeAway = ourTeam.homeAway === "home" ? "vs" : "@";

          const gameDate = new Date(event.date);
          const dateStr = gameDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
          const timeStr = gameDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

          const espnLink = event.links?.[0]?.href || null;

          allItems.push({
            schoolName: entry.name,
            schoolLogo: logo,
            type: "next_game",
            text: `${entry.name} ${homeAway} ${oppName}`,
            subtext: `${dateStr} · ${timeStr}`,
            link: espnLink,
          });
        }
      }

      // Add record ticker item
      if (record) {
        // Compute wins/losses for a streak indicator
        let wins = 0;
        let losses = 0;
        const parts = record.match(/(\d+)-(\d+)/);
        if (parts) {
          wins = parseInt(parts[1]);
          losses = parseInt(parts[2]);
        }

        allItems.push({
          schoolName: entry.name,
          schoolLogo: logo,
          type: "record",
          text: `${entry.name} (${record})`,
          subtext: wins + losses > 0 ? `${wins}W · ${losses}L this season` : "Current record",
          link: null,
        });
      }
    } catch {
      // Skip schools that fail
    }
  };

  // Process in chunks of 5 for controlled concurrency
  for (let i = 0; i < batch.length; i += 5) {
    const chunk = batch.slice(i, i + 5);
    await Promise.all(chunk.map(fetchTickerForSchool));
  }

  // Interleave items: group by school, then round-robin so ticker alternates schools
  const bySchool: Record<string, TickerItem[]> = {};
  for (const item of allItems) {
    if (!bySchool[item.schoolName]) bySchool[item.schoolName] = [];
    bySchool[item.schoolName].push(item);
  }

  const schoolGroups = Object.values(bySchool);
  const interleaved: TickerItem[] = [];
  const maxLen = Math.max(...schoolGroups.map((g) => g.length), 0);
  for (let i = 0; i < maxLen; i++) {
    for (const group of schoolGroups) {
      if (i < group.length) {
        interleaved.push(group[i]);
      }
    }
  }

  return NextResponse.json({ items: interleaved }, {
    headers: { "Cache-Control": "public, s-maxage=300" },
  });
}
