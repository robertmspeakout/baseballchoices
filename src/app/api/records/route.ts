import { NextRequest, NextResponse } from "next/server";

/* eslint-disable @typescript-eslint/no-explicit-any */

export const dynamic = "force-dynamic";

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

  // Limit to 25 schools per request to avoid overloading ESPN
  const batch = schoolNames.slice(0, 25);
  const records: Record<string, string | null> = {};
  const debugLog: Record<string, string[]> = {};

  // Fetch records in parallel with a concurrency of 5
  const fetchRecord = async (school: string): Promise<void> => {
    const log: string[] = [];
    debugLog[school] = log;
    try {
      const searchUrl = `https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/teams?limit=3&search=${encodeURIComponent(school)}`;
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

      const normalize = (entry: any) => entry.team || entry;
      const schoolLower = school.toLowerCase();

      // Log all team names returned
      teams.forEach((e: any, i: number) => {
        const t = normalize(e);
        log.push(`  team[${i}]: id=${t.id} name="${t.displayName}"`);
      });

      const teamEntry = normalize(
        teams.find((e: any) => normalize(e).displayName?.toLowerCase() === schoolLower) ||
        teams.find((e: any) => normalize(e).displayName?.toLowerCase().includes(schoolLower)) ||
        teams[0]
      );

      const teamId = String(teamEntry.id);
      log.push(`Selected: ${teamEntry.displayName} (id=${teamId})`);

      const teamRes = await fetch(
        `https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/teams/${teamId}`
      );

      log.push(`Team fetch status: ${teamRes.status}`);
      if (!teamRes.ok) { records[school] = null; return; }

      const teamData = await teamRes.json();
      const t = teamData?.team || teamData;

      // Log raw record fields
      log.push(`record.items[0].summary: ${t?.record?.items?.[0]?.summary ?? "undefined"}`);
      log.push(`record (string?): ${typeof t?.record === "string" ? t.record : "not a string"}`);
      log.push(`recordSummary: ${t?.recordSummary ?? "undefined"}`);

      if (t?.record?.items?.[0]?.summary) {
        records[school] = t.record.items[0].summary;
        log.push(`Result: ${records[school]}`);
      } else if (typeof t?.record === "string") {
        records[school] = t.record;
        log.push(`Result (string): ${records[school]}`);
      } else if (t?.recordSummary) {
        records[school] = t.recordSummary;
        log.push(`Result (summary): ${records[school]}`);
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
