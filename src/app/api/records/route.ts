import { NextRequest, NextResponse } from "next/server";
import { ESPN_TEAM_IDS, resolveEspnTeam, normalize, currentSeason, teamNameMatches } from "@/lib/espn";
import { getNcaaRecord } from "@/lib/ncaa";

/* eslint-disable @typescript-eslint/no-explicit-any */

export const dynamic = "force-dynamic";

const BASE = "https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball";

// Batch endpoint: fetches current-season records for multiple schools at once
// Usage: GET /api/records?schools=Vanderbilt,Texas,Florida State
export async function GET(request: NextRequest) {
  const schoolsParam = request.nextUrl.searchParams.get("schools");
  const debug = request.nextUrl.searchParams.get("debug") === "1";

  if (!schoolsParam) {
    return NextResponse.json({ records: {} });
  }

  const schoolNames = schoolsParam.split(",").map((s) => s.trim()).filter(Boolean);
  if (schoolNames.length === 0) {
    return NextResponse.json({ records: {} });
  }

  const season = currentSeason();

  // Limit to 25 schools per request to avoid overloading ESPN
  const batch = schoolNames.slice(0, 25);
  const records: Record<string, string | null> = {};
  const debugLog: Record<string, string[]> = {};

  const fetchRecord = async (school: string): Promise<void> => {
    const log: string[] = [];
    debugLog[school] = log;
    try {
      // ── Step 1: check standings (ESPN bulk + NCAA API) ────────────
      const ncaaRecord = await getNcaaRecord(school);
      if (ncaaRecord) {
        records[school] = ncaaRecord;
        log.push(`Standings: ${ncaaRecord}`);
        return;
      }
      log.push(`Standings: no match for "${school}"`);

      // ── Step 2: fallback to ESPN per-team API ─────────────────────
      let teamId: string | null = null;

      const knownId = ESPN_TEAM_IDS[school];
      if (knownId) {
        teamId = String(knownId);
        log.push(`Known ESPN ID: ${teamId} (from map)`);
      } else {
        // Fall back to ESPN search
        // ESPN often ignores `search` and returns all teams alphabetically;
        // use a high limit so name-matching logic has all teams available.
        const searchUrl = `${BASE}/teams?limit=500&search=${encodeURIComponent(school)}`;
        log.push(`Searching: ${searchUrl}`);

        const searchRes = await fetch(searchUrl);
        log.push(`Search status: ${searchRes.status}`);
        if (!searchRes.ok) { records[school] = null; return; }

        const searchData = await searchRes.json();
        const teams: any[] =
          searchData?.sports?.[0]?.leagues?.[0]?.teams ||
          searchData?.teams || [];

        log.push(`Teams found: ${teams.length}`);
        if (teams.length === 0) { records[school] = null; return; }

        const teamEntry = resolveEspnTeam(school, teams);
        teamId = String(teamEntry.id);
        log.push(`Matched: ${teamEntry.displayName} (id=${teamId}, location=${teamEntry.location})`);
      }

      // ── Step 2: fetch current-season record ───────────────────────
      // The /schedule endpoint reliably returns recordSummary for the
      // current season.  The /teams endpoint often returns last season's
      // record when the new season has just started.
      const schedUrl = `${BASE}/teams/${teamId}/schedule?season=${season}`;
      log.push(`Fetching schedule: ${schedUrl}`);

      const schedRes = await fetch(schedUrl);
      log.push(`Schedule status: ${schedRes.status}`);

      if (schedRes.ok) {
        const schedData = await schedRes.json();
        const teamInfo = schedData?.team || {};

        // Validate that we got the right team
        if (teamInfo.displayName && !teamNameMatches(school, teamInfo)) {
          log.push(`⚠ NAME MISMATCH: asked for "${school}" but ESPN returned "${teamInfo.displayName}" (id=${teamId}). Curated map may be wrong.`);
          console.warn(`[records] ESPN mismatch: "${school}" → id ${teamId} → "${teamInfo.displayName}"`);
          records[school] = null;
          return;
        }

        // Compute record from actual game results — more reliable than ESPN's
        // recordSummary which can be stale or wrong.
        const events: any[] = schedData?.events || [];
        let wins = 0;
        let losses = 0;
        let gamesCount = 0;
        for (const event of events) {
          const comp = event.competitions?.[0];
          if (!comp || comp.status?.type?.completed !== true) continue;
          const competitors: any[] = comp.competitors || [];
          if (competitors.length < 2) continue;
          const ourTeam = competitors.find(
            (c: any) => String(c.team?.id || c.id) === teamId
          );
          if (!ourTeam) continue;
          gamesCount++;
          if (ourTeam.winner === true) wins++;
          else if (ourTeam.winner === false) losses++;
          else {
            // Fallback: compare scores
            const ourScore = parseInt(String(ourTeam.score?.displayValue ?? ourTeam.score ?? ""), 10);
            const opp = competitors.find((c: any) => String(c.team?.id || c.id) !== teamId);
            const oppScore = parseInt(String(opp?.score?.displayValue ?? opp?.score ?? ""), 10);
            if (!isNaN(ourScore) && !isNaN(oppScore)) {
              if (ourScore > oppScore) wins++;
              else if (ourScore < oppScore) losses++;
            }
          }
        }

        if (gamesCount > 0) {
          const computedRecord = `${wins}-${losses}`;
          const espnSummary = teamInfo.recordSummary || null;
          log.push(`Computed from ${gamesCount} games: ${computedRecord} (ESPN said: ${espnSummary || "n/a"})`);
          records[school] = computedRecord;
          return;
        }

        // Fall back to ESPN's recordSummary if no completed games
        const recordSummary = teamInfo.recordSummary;
        if (recordSummary) {
          records[school] = recordSummary;
          log.push(`Result (schedule): ${recordSummary}`);
          return;
        }
        log.push(`Schedule had no recordSummary and no completed games`);
      }

      // Fallback: try the /teams endpoint directly
      const teamUrl = `${BASE}/teams/${teamId}`;
      log.push(`Fallback fetching team: ${teamUrl}`);

      const teamRes = await fetch(teamUrl);
      log.push(`Team status: ${teamRes.status}`);
      if (!teamRes.ok) { records[school] = null; return; }

      const teamData = await teamRes.json();
      const t = teamData?.team || teamData;

      if (t?.record?.items?.[0]?.summary) {
        records[school] = t.record.items[0].summary;
        log.push(`Result (team record): ${records[school]}`);
      } else if (typeof t?.record === "string") {
        records[school] = t.record;
        log.push(`Result (team string): ${records[school]}`);
      } else if (t?.recordSummary) {
        records[school] = t.recordSummary;
        log.push(`Result (team summary): ${records[school]}`);
      } else {
        records[school] = null;
        log.push("Result: null (no record fields found)");
      }
    } catch (err: any) {
      records[school] = null;
      log.push(`Error: ${err?.name || "unknown"}: ${err?.message || String(err)}`);
    }
  };

  // Process in chunks of 5 for controlled concurrency
  for (let i = 0; i < batch.length; i += 5) {
    const chunk = batch.slice(i, i + 5);
    await Promise.all(chunk.map(fetchRecord));
  }

  const body = debug ? { records, _debug: debugLog } : { records };

  return NextResponse.json(body, {
    headers: { "Cache-Control": "public, s-maxage=300" },
  });
}
