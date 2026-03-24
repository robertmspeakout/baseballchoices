import { NextRequest, NextResponse } from "next/server";
import { ESPN_TEAM_IDS, teamNameMatches } from "@/lib/espn";
import schools from "@/data/schools.json";

/* eslint-disable @typescript-eslint/no-explicit-any */

export const dynamic = "force-dynamic";

const BASE =
  "https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball";

/**
 * Admin endpoint: Audits all ESPN_TEAM_IDS entries by fetching the actual team
 * data from ESPN and checking for name mismatches.
 *
 * Also finds the correct ESPN ID for every D1 school in schools.json.
 *
 * Usage:
 *   GET /api/admin/audit-espn              — audit curated map
 *   GET /api/admin/audit-espn?full=1       — also generate IDs for all D1 schools
 *   GET /api/admin/audit-espn?school=Portland — check a single school
 *
 * Returns JSON with mismatches, corrections, and the suggested updated map.
 */
export async function GET(request: NextRequest) {
  const fullMode = request.nextUrl.searchParams.get("full") === "1";
  const singleSchool = request.nextUrl.searchParams.get("school");

  // Step 1: Fetch all ESPN college baseball teams
  const teamsUrl = `${BASE}/teams?limit=500`;
  let allTeams: any[];
  try {
    const res = await fetch(teamsUrl);
    if (!res.ok) {
      return NextResponse.json(
        { error: "ESPN teams fetch failed", status: res.status },
        { status: 502 }
      );
    }
    const data = await res.json();
    allTeams = [];
    for (const sport of data?.sports || []) {
      for (const league of sport.leagues || []) {
        for (const entry of league.teams || []) {
          const t = entry.team || entry;
          allTeams.push({
            id: Number(t.id),
            displayName: t.displayName || "",
            shortDisplayName: t.shortDisplayName || "",
            abbreviation: t.abbreviation || "",
            location: t.location || "",
            nickname: t.nickname || "",
          });
        }
      }
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: "ESPN fetch error", message: err?.message },
      { status: 502 }
    );
  }

  const byId = new Map<number, any>();
  for (const t of allTeams) byId.set(t.id, t);

  // Helper: find the best ESPN team match for a school name
  function findBest(name: string) {
    const s = name.toLowerCase().trim();
    const filters = [
      (t: any) => t.location.toLowerCase() === s,
      (t: any) => t.displayName.toLowerCase() === s,
      (t: any) => t.shortDisplayName.toLowerCase() === s,
      (t: any) => t.location.toLowerCase().startsWith(s + " "),
      (t: any) => t.displayName.toLowerCase().startsWith(s + " "),
      (t: any) => t.displayName.toLowerCase().includes(s),
    ];
    for (const fn of filters) {
      const matches = allTeams.filter(fn);
      if (matches.length === 1) return matches[0];
    }
    const byLoc = allTeams.filter(
      (t) => t.location.toLowerCase() === s
    );
    if (byLoc.length > 0) return { _ambiguous: true, candidates: byLoc };
    return null;
  }

  // Single school mode
  if (singleSchool) {
    const knownId = ESPN_TEAM_IDS[singleSchool];
    const espnTeam = knownId ? byId.get(knownId) : null;
    const best = findBest(singleSchool);
    return NextResponse.json({
      school: singleSchool,
      curatedId: knownId || null,
      curatedTeam: espnTeam
        ? { id: espnTeam.id, displayName: espnTeam.displayName }
        : null,
      curatedMatch: espnTeam
        ? teamNameMatches(singleSchool, espnTeam)
        : null,
      bestMatch: best?._ambiguous
        ? { ambiguous: true, candidates: best.candidates }
        : best
        ? { id: best.id, displayName: best.displayName, location: best.location }
        : null,
    });
  }

  // Audit all curated entries
  const mismatches: any[] = [];
  const correct: string[] = [];
  const notInEspn: any[] = [];
  const corrections: Record<string, number> = {};

  for (const [school, id] of Object.entries(ESPN_TEAM_IDS)) {
    const espnTeam = byId.get(id);
    if (!espnTeam) {
      notInEspn.push({ school, id });
      const best = findBest(school);
      if (best && !best._ambiguous) corrections[school] = best.id;
      continue;
    }
    if (!teamNameMatches(school, espnTeam)) {
      mismatches.push({
        school,
        curatedId: id,
        espnName: espnTeam.displayName,
      });
      const best = findBest(school);
      if (best && !best._ambiguous) corrections[school] = best.id;
    } else {
      correct.push(school);
    }
  }

  // Full mode: also check all D1 schools not in the curated map
  let unmapped: any[] = [];
  const suggestedNewEntries: Record<string, number> = {};

  if (fullMode) {
    const d1Schools = (schools as any[]).filter(
      (s) => s.division === "D1"
    );
    for (const school of d1Schools) {
      if (ESPN_TEAM_IDS[school.name]) continue;
      const best = findBest(school.name);
      if (!best) {
        unmapped.push({ name: school.name, status: "no_match" });
      } else if (best._ambiguous) {
        unmapped.push({
          name: school.name,
          status: "ambiguous",
          candidates: best.candidates.map((c: any) => ({
            id: c.id,
            displayName: c.displayName,
          })),
        });
      } else {
        suggestedNewEntries[school.name] = best.id;
      }
    }
  }

  // Build the corrected full map
  const correctedMap: Record<string, number> = {};
  for (const [school, id] of Object.entries(ESPN_TEAM_IDS)) {
    correctedMap[school] = corrections[school] || id;
  }
  if (fullMode) {
    for (const [school, id] of Object.entries(suggestedNewEntries)) {
      correctedMap[school] = id;
    }
  }

  return NextResponse.json({
    espnTeamsCount: allTeams.length,
    curatedMapSize: Object.keys(ESPN_TEAM_IDS).length,
    summary: {
      correct: correct.length,
      mismatches: mismatches.length,
      notInEspn: notInEspn.length,
    },
    mismatches,
    notInEspn,
    corrections,
    ...(fullMode
      ? {
          unmapped,
          suggestedNewEntries,
          suggestedNewEntriesCount: Object.keys(suggestedNewEntries).length,
        }
      : {}),
    // The complete corrected map — copy this to espn.ts
    correctedMap,
  });
}
