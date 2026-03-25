import { NextRequest, NextResponse } from "next/server";
import { ESPN_TEAM_IDS, resolveEspnTeam, normalize, currentSeason, teamNameMatches } from "@/lib/espn";
import { getNcaaRecord } from "@/lib/ncaa";
import recordOverrides from "@/data/record-overrides.json";

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

  const overrides = recordOverrides as Record<string, string>;

  const fetchRecord = async (school: string): Promise<void> => {
    const log: string[] = [];
    debugLog[school] = log;
    try {
      // ── Step 0: check if ESPN doesn't track this team ──────────
      // "unavailable" = ESPN has no reliable data, return null instead of wrong data
      if (overrides[school] === "unavailable") {
        records[school] = null;
        log.push(`ESPN unavailable for "${school}" — skipping`);
        return;
      }

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

      // ── Step 2: fetch record from /teams endpoint (authoritative) ──
      // The /teams endpoint returns the team's current overall record
      // directly.  This is more reliable than computing from schedule
      // events, which ESPN sometimes returns incomplete.
      const teamUrl = `${BASE}/teams/${teamId}`;
      log.push(`Fetching team: ${teamUrl}`);

      const teamRes = await fetch(teamUrl);
      log.push(`Team status: ${teamRes.status}`);

      if (teamRes.ok) {
        const teamData = await teamRes.json();
        const t = teamData?.team || teamData;

        // Validate that we got the right team
        if (t?.displayName && !teamNameMatches(school, t)) {
          log.push(`⚠ NAME MISMATCH: asked for "${school}" but ESPN returned "${t.displayName}" (id=${teamId}). Curated map may be wrong.`);
          console.warn(`[records] ESPN mismatch: "${school}" → id ${teamId} → "${t.displayName}"`);
          records[school] = null;
          return;
        }

        if (t?.record?.items?.[0]?.summary) {
          records[school] = t.record.items[0].summary;
          log.push(`Result (team record): ${records[school]}`);
          return;
        } else if (typeof t?.record === "string") {
          records[school] = t.record;
          log.push(`Result (team string): ${records[school]}`);
          return;
        } else if (t?.recordSummary) {
          records[school] = t.recordSummary;
          log.push(`Result (team summary): ${records[school]}`);
          return;
        }
        log.push("Team endpoint had no record fields");
      }

      // ── Step 3: fallback to schedule computation ────────────────────
      const schedUrl = `${BASE}/teams/${teamId}/schedule?season=${season}`;
      log.push(`Fallback: fetching schedule: ${schedUrl}`);

      const schedRes = await fetch(schedUrl);
      log.push(`Schedule status: ${schedRes.status}`);

      if (schedRes.ok) {
        const schedData = await schedRes.json();
        const teamInfo = schedData?.team || {};

        // Try recordSummary from schedule response first
        if (teamInfo.recordSummary) {
          records[school] = teamInfo.recordSummary;
          log.push(`Result (schedule recordSummary): ${records[school]}`);
          return;
        }

        // Last resort: compute from individual game results
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
          records[school] = `${wins}-${losses}`;
          log.push(`Computed from ${gamesCount} games: ${records[school]}`);
          return;
        }
        log.push(`Schedule had no recordSummary and no completed games`);
      }

      records[school] = null;
      log.push("Result: null (no record found from any source)");
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
