import { NextRequest, NextResponse } from "next/server";

/* eslint-disable @typescript-eslint/no-explicit-any */

export const dynamic = "force-dynamic"; // Never cache this route handler

export async function GET(request: NextRequest) {
  const school = request.nextUrl.searchParams.get("school");
  const debug = request.nextUrl.searchParams.get("debug") === "1";
  if (!school) {
    return NextResponse.json({ record: null, recentGames: [], upcoming: [] });
  }

  const espnIdParam = request.nextUrl.searchParams.get("espn_id");
  const debugLog: string[] = [];

  try {
    let teamId: string;

    if (espnIdParam) {
      teamId = espnIdParam;
      debugLog.push(`Using espn_id param: ${teamId}`);
    } else {
      const searchUrl = `https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/teams?limit=5&search=${encodeURIComponent(school)}`;
      debugLog.push(`Searching: ${searchUrl}`);
      const searchRes = await fetch(searchUrl, { cache: "no-store", signal: AbortSignal.timeout(10000) });

      if (!searchRes.ok) {
        debugLog.push(`Search failed: ${searchRes.status}`);
        if (debug) return NextResponse.json({ _debug: true, error: "search_failed", status: searchRes.status, log: debugLog });
        return NextResponse.json({ record: null, recentGames: [], upcoming: [] });
      }

      const searchData = await searchRes.json();
      const teams: any[] | null =
        searchData?.sports?.[0]?.leagues?.[0]?.teams ||
        searchData?.teams ||
        null;

      if (!teams || teams.length === 0) {
        debugLog.push(`No teams found in search response. Keys: ${Object.keys(searchData).join(",")}`);
        if (debug) return NextResponse.json({ _debug: true, error: "no_teams", log: debugLog, rawKeys: Object.keys(searchData) });
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
      debugLog.push(`Found team: ${teamEntry.displayName} (id=${teamId})`);
    }

    // Fetch schedule — try current year, fall back to current year - 1
    const year = new Date().getFullYear();
    const scheduleUrl = `https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/teams/${teamId}/schedule?season=${year}`;
    const teamUrl = `https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/teams/${teamId}`;
    debugLog.push(`Fetching: teamUrl=${teamUrl}`);
    debugLog.push(`Fetching: scheduleUrl=${scheduleUrl}`);

    const [teamRes, scheduleRes] = await Promise.all([
      fetch(teamUrl, { cache: "no-store", signal: AbortSignal.timeout(10000) }),
      fetch(scheduleUrl, { cache: "no-store", signal: AbortSignal.timeout(10000) }),
    ]);
    debugLog.push(`teamRes: ${teamRes.status}, scheduleRes: ${scheduleRes.status}`);

    // Extract record from team endpoint
    let espnRecord: string | null = null;
    let teamData: any = null;
    if (teamRes.ok) {
      try {
        teamData = await teamRes.json();
        const t = teamData?.team || teamData;
        if (t?.record?.items?.[0]?.summary) {
          espnRecord = t.record.items[0].summary;
        } else if (typeof t?.record === "string") {
          espnRecord = t.record;
        }
        debugLog.push(`Team record: ${espnRecord}`);
      } catch (e: any) {
        debugLog.push(`Team JSON parse error: ${e.message}`);
      }
    }

    if (!scheduleRes.ok) {
      debugLog.push(`Schedule fetch failed: ${scheduleRes.status}`);
      // Try previous year as fallback
      const fallbackUrl = `https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/teams/${teamId}/schedule?season=${year - 1}`;
      debugLog.push(`Trying fallback year ${year - 1}: ${fallbackUrl}`);
      const fallbackRes = await fetch(fallbackUrl, { cache: "no-store", signal: AbortSignal.timeout(10000) });
      debugLog.push(`Fallback result: ${fallbackRes.status}`);
      if (!fallbackRes.ok) {
        if (debug) return NextResponse.json({ _debug: true, error: "schedule_fetch_failed", log: debugLog });
        return NextResponse.json({ record: espnRecord, recentGames: [], upcoming: [] });
      }
      // Use fallback response
      const fallbackData = await fallbackRes.json();
      if (debug) return NextResponse.json({ _debug: true, error: "primary_failed_fallback_ok", log: debugLog, fallbackKeys: Object.keys(fallbackData), fallbackEventsCount: (fallbackData?.events || []).length });
      return NextResponse.json({ record: espnRecord, recentGames: [], upcoming: [] });
    }

    const scheduleData = await scheduleRes.json();
    const events: any[] = scheduleData?.events || [];
    debugLog.push(`Schedule parsed: ${Object.keys(scheduleData).join(",")} | events: ${events.length}`);

    // Debug mode: return raw ESPN response structure
    if (debug) {
      return NextResponse.json({
        _debug: true,
        teamId,
        year,
        log: debugLog,
        scheduleTopKeys: Object.keys(scheduleData),
        eventsCount: events.length,
        firstEvent: events[0] ? JSON.stringify(events[0]).slice(0, 800) : null,
        scheduleTeam: scheduleData?.team ? {
          id: scheduleData.team.id,
          displayName: scheduleData.team.displayName,
          record: scheduleData.team.record,
          recordSummary: scheduleData.team.recordSummary,
        } : null,
        espnRecord,
      });
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

    const recentGames = completed.slice(-5).reverse();
    const next5 = upcoming.slice(0, 5);

    return NextResponse.json({
      record: espnRecord,
      recentGames,
      upcoming: next5,
    }, {
      headers: { "Cache-Control": "public, s-maxage=300" },
    });
  } catch (err: any) {
    console.error(`[schedule] Error fetching schedule for "${school}":`, err);
    // In debug mode, return the error details so we can see what went wrong
    if (debug) {
      return NextResponse.json({
        _debug: true,
        error: "caught_exception",
        message: err?.message || String(err),
        name: err?.name || "unknown",
        log: debugLog,
      });
    }
    return NextResponse.json({ record: null, recentGames: [], upcoming: [] });
  }
}
