import { NextRequest, NextResponse } from "next/server";

/* eslint-disable @typescript-eslint/no-explicit-any */

export const dynamic = "force-dynamic"; // Never cache this route handler

// Extract ESPN team ID from an ESPN logo URL like https://a.espncdn.com/i/teamlogos/ncaa/500/2501.png
function extractEspnIdFromLogo(logoUrl: string | null | undefined): string | null {
  if (!logoUrl) return null;
  const m = logoUrl.match(/espncdn\.com\/.*\/(\d+)\.\w+$/);
  return m ? m[1] : null;
}

export async function GET(request: NextRequest) {
  const school = request.nextUrl.searchParams.get("school");
  if (!school) {
    return NextResponse.json({ record: null, recentGames: [], upcoming: [] });
  }

  // If caller passed an ESPN team ID (from logo_url), use it directly — no search needed
  const espnIdParam = request.nextUrl.searchParams.get("espn_id");

  try {
    let teamId: string;

    if (espnIdParam) {
      // Trust the caller's ESPN ID — skip the ambiguous name search entirely
      teamId = espnIdParam;
    } else {
      // Fallback: search by name (can be ambiguous for schools like "Portland")
      const searchUrl = `https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/teams?limit=5&search=${encodeURIComponent(school)}`;
      const searchRes = await fetch(searchUrl, { cache: "no-store", signal: AbortSignal.timeout(8000) });

      if (!searchRes.ok) {
        console.error(`[schedule] ESPN search failed: ${searchRes.status} for "${school}"`);
        return NextResponse.json({ record: null, recentGames: [], upcoming: [] });
      }

      const searchData = await searchRes.json();

      let teams: any[] | null =
        searchData?.sports?.[0]?.leagues?.[0]?.teams ||
        searchData?.teams ||
        null;

      if (!teams || teams.length === 0) {
        console.error(`[schedule] No ESPN teams found for "${school}"`);
        return NextResponse.json({ record: null, recentGames: [], upcoming: [] });
      }

      const normalize = (entry: any) => entry.team || entry;
      const schoolLower = school.toLowerCase();
      const match = (fn: (t: any) => boolean) => teams!.find((e) => fn(normalize(e)));

      const teamEntry = normalize(
        match((t) => t.displayName?.toLowerCase() === schoolLower) ||
        match((t) => t.displayName?.toLowerCase().startsWith(schoolLower)) ||
        match((t) => t.displayName?.toLowerCase().includes(schoolLower)) ||
        match((t) =>
          schoolLower.includes(t.displayName?.toLowerCase() || "") ||
          t.shortDisplayName?.toLowerCase() === schoolLower ||
          t.abbreviation?.toLowerCase() === schoolLower
        ) ||
        { team: normalize(teams[0]) }
      );

      teamId = String(teamEntry.id);
    }

    // Step 2: Fetch team info (for record) and schedule in parallel
    const year = new Date().getFullYear();
    const [teamRes, scheduleRes] = await Promise.all([
      fetch(
        `https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/teams/${teamId}`,
        { cache: "no-store", signal: AbortSignal.timeout(8000) }
      ),
      fetch(
        `https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/teams/${teamId}/schedule?season=${year}`,
        { cache: "no-store", signal: AbortSignal.timeout(8000) }
      ),
    ]);

    // Extract record from team endpoint
    let espnRecord: string | null = null;
    if (teamRes.ok) {
      try {
        const teamData = await teamRes.json();
        const t = teamData?.team || teamData;
        // record can be at t.record.items[0].summary or t.record (string)
        if (t?.record?.items?.[0]?.summary) {
          espnRecord = t.record.items[0].summary;
        } else if (typeof t?.record === "string") {
          espnRecord = t.record;
        }
      } catch { /* ignore */ }
    }

    if (!scheduleRes.ok) {
      console.error(`[schedule] ESPN schedule fetch failed: ${scheduleRes.status} for team ${teamId}`);
      return NextResponse.json({ record: espnRecord, recentGames: [], upcoming: [] });
    }

    let scheduleData = await scheduleRes.json();
    let events: any[] = scheduleData?.events || [];

    // Fallback: if current year has no events, try previous year
    if (events.length === 0) {
      try {
        const fallbackRes = await fetch(
          `https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/teams/${teamId}/schedule?season=${year - 1}`,
          { cache: "no-store", signal: AbortSignal.timeout(8000) }
        );
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          const fallbackEvents = fallbackData?.events || [];
          if (fallbackEvents.length > 0) {
            scheduleData = fallbackData;
            events = fallbackEvents;
          }
        }
      } catch { /* ignore fallback failure */ }
    }

    // Also try to get record from schedule response
    if (!espnRecord) {
      const st = scheduleData?.team;
      if (st?.record?.items?.[0]?.summary) {
        espnRecord = st.record.items[0].summary;
      } else if (st?.recordSummary) {
        espnRecord = st.recordSummary;
      }
    }

    // Parse games
    type ParsedGame = {
      date: string;
      opponent: string;
      opponentLogo: string;
      location: string;
      homeAway: string;
      score: string | null;
      result: string | null;
      completed: boolean;
    };

    const completed: ParsedGame[] = [];
    const upcoming: ParsedGame[] = [];

    for (const event of events) {
      const comp = event.competitions?.[0];
      if (!comp) continue;

      const isCompleted = comp.status?.type?.completed === true;
      const competitors: any[] = comp.competitors || [];
      if (competitors.length < 2) continue;

      // Find our team by id. Competitors have team.id or id
      const ourTeam = competitors.find(
        (c: any) => String(c.team?.id || c.id) === teamId
      );
      const opponent = competitors.find(
        (c: any) => String(c.team?.id || c.id) !== teamId
      );

      if (!ourTeam || !opponent) continue;

      const venue = comp.venue;
      let locationStr = "";
      if (venue) {
        locationStr = venue.fullName || "";
        if (venue.city) locationStr += locationStr ? `, ${venue.city}` : venue.city;
        if (venue.state) locationStr += `, ${venue.state}`;
      } else {
        locationStr = ourTeam.homeAway === "home" ? "Home" : "Away";
      }

      // Extract score - handle string, number, or object formats
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

      let score: string | null = null;
      let result: string | null = null;

      if (isCompleted) {
        const ourScore = extractScore(ourTeam);
        const oppScore = extractScore(opponent);
        if (ourScore != null && oppScore != null) {
          score = `${ourScore}-${oppScore}`;
          const ourNum = parseInt(ourScore, 10);
          const oppNum = parseInt(oppScore, 10);
          if (ourTeam.winner === true) result = "W";
          else if (ourTeam.winner === false) result = "L";
          else result = ourNum > oppNum ? "W" : ourNum < oppNum ? "L" : "T";
        } else {
          // Completed but no score data — mark as completed without score
          result = ourTeam.winner === true ? "W" : ourTeam.winner === false ? "L" : null;
        }
      }

      const game: ParsedGame = {
        date: event.date,
        opponent: opponent.team?.displayName || opponent.displayName || "TBD",
        opponentLogo: opponent.team?.logo || opponent.team?.logos?.[0]?.href || "",
        location: locationStr,
        homeAway: ourTeam.homeAway === "home" ? "vs" : "@",
        score,
        result,
        completed: isCompleted,
      };

      if (isCompleted) {
        completed.push(game);
      } else {
        upcoming.push(game);
      }
    }

    // Compute record from games if ESPN didn't provide one
    if (!espnRecord && completed.length > 0) {
      const wins = completed.filter((g) => g.result === "W").length;
      const losses = completed.filter((g) => g.result === "L").length;
      espnRecord = `${wins}-${losses}`;
    }

    // Last 5 completed games (most recent first), next 5 upcoming
    const recentGames = completed.slice(-5).reverse();
    const next5 = upcoming.slice(0, 5);

    return NextResponse.json({
      record: espnRecord,
      recentGames,
      upcoming: next5,
    }, {
      headers: { "Cache-Control": "public, s-maxage=300" },
    });
  } catch (err) {
    console.error(`[schedule] Error fetching schedule for "${school}":`, err);
    return NextResponse.json({ record: null, recentGames: [], upcoming: [] });
  }
}
