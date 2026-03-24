import { NextRequest, NextResponse } from "next/server";
import { ESPN_TEAM_IDS, resolveEspnTeam, normalize as espnNormalize, teamNameMatches } from "@/lib/espn";

/* eslint-disable @typescript-eslint/no-explicit-any */

export const dynamic = "force-dynamic";

const ROUTE_VERSION = 5;

function emptyResponse() {
  return NextResponse.json({
    _v: ROUTE_VERSION,
    record: null,
    recentGames: [],
    upcoming: [],
  });
}

export async function GET(request: NextRequest) {
  // --- Parse params ---
  let school: string | null = null;
  let debug = false;
  let espnIdParam: string | null = null;

  try {
    school = request.nextUrl.searchParams.get("school");
    debug = request.nextUrl.searchParams.get("debug") === "1";
    espnIdParam = request.nextUrl.searchParams.get("espn_id");
  } catch {
    // If even param parsing fails, return a diagnostic
    return NextResponse.json({
      _v: ROUTE_VERSION,
      _error: "param_parse_failed",
      timestamp: new Date().toISOString(),
      record: null,
      recentGames: [],
      upcoming: [],
    });
  }

  // --- Debug-only probe (no school needed) ---
  // This MUST come before any ESPN calls so we can verify the route is alive
  if (debug && !school) {
    return NextResponse.json({
      _v: ROUTE_VERSION,
      _debug: true,
      alive: true,
      message: "Schedule route v4 is responding. Provide ?school=NAME&debug=1 for full debug.",
      timestamp: new Date().toISOString(),
    });
  }

  if (!school) {
    return emptyResponse();
  }

  const debugLog: string[] = [];
  debugLog.push(`v${ROUTE_VERSION} | school=${school} | espn_id=${espnIdParam || "none"} | ts=${new Date().toISOString()}`);

  try {
    // --- Step 1: Resolve the ESPN team ID ---
    // First check the curated map, then fall back to ESPN search.
    let teamId: string;

    const knownId = ESPN_TEAM_IDS[school];
    let usedCuratedId = false;
    if (knownId) {
      teamId = String(knownId);
      usedCuratedId = true;
      debugLog.push(`Known ESPN ID: ${teamId} (from map for "${school}")`);
    } else {
      // Fall back to ESPN search
      // ESPN often ignores the `search` param and returns ALL teams
      // alphabetically.  Use a high limit so our name-matching logic has
      // all teams to work with.
      const searchUrl = `https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/teams?limit=500&search=${encodeURIComponent(school)}`;
      debugLog.push(`Searching: ${searchUrl}`);

      let searchRes: Response;
      try {
        searchRes = await fetch(searchUrl);
      } catch (fetchErr: any) {
        debugLog.push(`Search fetch threw: ${fetchErr?.message || String(fetchErr)}`);
        if (debug) return NextResponse.json({ _v: ROUTE_VERSION, _debug: true, error: "search_fetch_exception", log: debugLog });
        return emptyResponse();
      }

      if (!searchRes.ok) {
        debugLog.push(`Search failed: ${searchRes.status}`);
        if (debug) return NextResponse.json({ _v: ROUTE_VERSION, _debug: true, error: "search_failed", status: searchRes.status, log: debugLog });
        return emptyResponse();
      }

      let searchData: any;
      try {
        searchData = await searchRes.json();
      } catch (jsonErr: any) {
        debugLog.push(`Search JSON parse failed: ${jsonErr?.message || String(jsonErr)}`);
        if (debug) return NextResponse.json({ _v: ROUTE_VERSION, _debug: true, error: "search_json_parse_failed", log: debugLog });
        return emptyResponse();
      }

      const teams: any[] | null =
        searchData?.sports?.[0]?.leagues?.[0]?.teams ||
        searchData?.teams ||
        null;

      if (!teams || teams.length === 0) {
        debugLog.push(`No teams found. Keys: ${Object.keys(searchData || {}).join(",")}`);
        if (debug) return NextResponse.json({ _v: ROUTE_VERSION, _debug: true, error: "no_teams", log: debugLog, rawKeys: Object.keys(searchData || {}) });
        return emptyResponse();
      }

      // If espn_id hint is provided, try to match it first
      let teamEntry: any = null;
      if (espnIdParam) {
        const hintMatch = teams.find((e) => String(espnNormalize(e).id) === espnIdParam);
        if (hintMatch) {
          teamEntry = espnNormalize(hintMatch);
          debugLog.push(`Matched by espn_id hint: ${teamEntry.displayName} (id=${teamEntry.id})`);
        }
      }

      // Otherwise use the shared resolver (map + progressive name matching)
      if (!teamEntry) {
        teamEntry = resolveEspnTeam(school, teams);
      }

      teamId = String(teamEntry.id);
      debugLog.push(`Using team: ${teamEntry.displayName} (id=${teamId})`);
    }

    // --- Step 2: Fetch team info + schedule ---
    const year = new Date().getFullYear();
    const scheduleUrl = `https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/teams/${teamId}/schedule?season=${year}`;
    const teamUrl = `https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/teams/${teamId}`;
    debugLog.push(`Fetching: teamUrl=${teamUrl}`);
    debugLog.push(`Fetching: scheduleUrl=${scheduleUrl}`);

    let teamRes: Response | null = null;
    let scheduleRes: Response | null = null;

    try {
      [teamRes, scheduleRes] = await Promise.all([
        fetch(teamUrl),
        fetch(scheduleUrl),
      ]);
    } catch (fetchErr: any) {
      debugLog.push(`Parallel fetch threw: ${fetchErr?.message || String(fetchErr)}`);
      if (debug) return NextResponse.json({ _v: ROUTE_VERSION, _debug: true, error: "parallel_fetch_exception", log: debugLog });
      return emptyResponse();
    }

    debugLog.push(`teamRes: ${teamRes?.status}, scheduleRes: ${scheduleRes?.status}`);

    // --- Step 3: Extract record from team endpoint ---
    let espnRecord: string | null = null;
    let teamDataParsed: any = null;
    if (teamRes && teamRes.ok) {
      try {
        const teamData = await teamRes.json();
        const t = teamData?.team || teamData;
        teamDataParsed = t;
        if (t?.record?.items?.[0]?.summary) {
          espnRecord = t.record.items[0].summary;
        } else if (typeof t?.record === "string") {
          espnRecord = t.record;
        }
        debugLog.push(`Team record: ${espnRecord} | ESPN name: ${t?.displayName || "?"}`);

        // Validate: if we used a curated ID, check that the ESPN team name
        // actually matches the school we're looking for.  If not, the curated
        // ID is wrong — discard the data to avoid showing the wrong team's info.
        if (usedCuratedId && t?.displayName && !teamNameMatches(school, t)) {
          debugLog.push(`⚠ NAME MISMATCH: asked for "${school}" but ESPN returned "${t.displayName}" (id=${teamId}). Curated map entry is wrong — discarding data.`);
          console.warn(`[schedule] ESPN_TEAM_IDS mismatch: "${school}" → id ${teamId} → "${t.displayName}". Please run: node scripts/audit-espn-ids.js --apply`);
          if (debug) {
            return NextResponse.json({ _v: ROUTE_VERSION, _debug: true, error: "name_mismatch", school, espnName: t.displayName, teamId, log: debugLog });
          }
          return emptyResponse();
        }
      } catch (e: any) {
        debugLog.push(`Team JSON parse error: ${e?.message}`);
      }
    }

    // --- Step 4: Handle schedule response ---
    if (!scheduleRes || !scheduleRes.ok) {
      debugLog.push(`Schedule fetch failed: ${scheduleRes?.status}`);
      // Try previous year as fallback
      const fallbackUrl = `https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/teams/${teamId}/schedule?season=${year - 1}`;
      debugLog.push(`Trying fallback year ${year - 1}: ${fallbackUrl}`);

      let fallbackRes: Response;
      try {
        fallbackRes = await fetch(fallbackUrl);
      } catch (fbErr: any) {
        debugLog.push(`Fallback fetch threw: ${fbErr?.message || String(fbErr)}`);
        if (debug) return NextResponse.json({ _v: ROUTE_VERSION, _debug: true, error: "fallback_fetch_exception", log: debugLog });
        return NextResponse.json({ _v: ROUTE_VERSION, record: espnRecord, recentGames: [], upcoming: [] });
      }

      debugLog.push(`Fallback result: ${fallbackRes.status}`);
      if (!fallbackRes.ok) {
        if (debug) return NextResponse.json({ _v: ROUTE_VERSION, _debug: true, error: "schedule_fetch_failed", log: debugLog });
        return NextResponse.json({ _v: ROUTE_VERSION, record: espnRecord, recentGames: [], upcoming: [] });
      }

      let fallbackData: any;
      try {
        fallbackData = await fallbackRes.json();
      } catch {
        if (debug) return NextResponse.json({ _v: ROUTE_VERSION, _debug: true, error: "fallback_json_parse_failed", log: debugLog });
        return NextResponse.json({ _v: ROUTE_VERSION, record: espnRecord, recentGames: [], upcoming: [] });
      }

      if (debug) return NextResponse.json({ _v: ROUTE_VERSION, _debug: true, error: "primary_failed_fallback_ok", log: debugLog, fallbackKeys: Object.keys(fallbackData), fallbackEventsCount: (fallbackData?.events || []).length });
      return NextResponse.json({ _v: ROUTE_VERSION, record: espnRecord, recentGames: [], upcoming: [] });
    }

    let scheduleData: any;
    try {
      scheduleData = await scheduleRes.json();
    } catch (jsonErr: any) {
      debugLog.push(`Schedule JSON parse failed: ${jsonErr?.message || String(jsonErr)}`);
      if (debug) return NextResponse.json({ _v: ROUTE_VERSION, _debug: true, error: "schedule_json_parse_failed", log: debugLog });
      return NextResponse.json({ _v: ROUTE_VERSION, record: espnRecord, recentGames: [], upcoming: [] });
    }

    const events: any[] = scheduleData?.events || [];
    debugLog.push(`Schedule parsed: keys=${Object.keys(scheduleData).join(",")} | events=${events.length}`);

    // Debug mode: return raw ESPN response structure
    if (debug) {
      return NextResponse.json({
        _v: ROUTE_VERSION,
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

    // Prefer the schedule endpoint's record (current season) over the team
    // endpoint which can return last season's record early in the year.
    const st = scheduleData?.team;
    if (st?.recordSummary) {
      espnRecord = st.recordSummary;
    } else if (st?.record?.items?.[0]?.summary) {
      espnRecord = st.record.items[0].summary;
    }

    // --- Step 5: Parse games ---
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
      _v: ROUTE_VERSION,
      record: espnRecord,
      recentGames,
      upcoming: next5,
    }, {
      headers: { "Cache-Control": "public, s-maxage=300" },
    });
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    const errName = err?.name || "unknown";
    const errStack = err?.stack?.split("\n").slice(0, 5) || [];
    console.error(`[schedule v${ROUTE_VERSION}] Error for "${school}":`, errMsg);

    if (debug) {
      return NextResponse.json({
        _v: ROUTE_VERSION,
        _debug: true,
        error: "caught_exception",
        message: errMsg,
        name: errName,
        stack: errStack,
        log: debugLog,
      });
    }

    // Return error info in production too (non-debug) so we can diagnose
    return NextResponse.json({
      _v: ROUTE_VERSION,
      _error: errMsg,
      _errorName: errName,
      record: null,
      recentGames: [],
      upcoming: [],
    });
  }
}
