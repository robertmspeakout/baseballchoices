import { NextRequest, NextResponse } from "next/server";

/* eslint-disable @typescript-eslint/no-explicit-any */

export const dynamic = "force-dynamic";

// Batch endpoint: fetches current-season records for multiple schools at once
// Usage: GET /api/records?schools=Vanderbilt,Texas,Florida State
export async function GET(request: NextRequest) {
  const schoolsParam = request.nextUrl.searchParams.get("schools");
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

  // Fetch records in parallel with a concurrency of 5
  const fetchRecord = async (school: string): Promise<void> => {
    try {
      const searchUrl = `https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/teams?limit=3&search=${encodeURIComponent(school)}`;
      const searchRes = await fetch(searchUrl, { cache: "no-store", signal: AbortSignal.timeout(8000) });
      if (!searchRes.ok) { records[school] = null; return; }

      const searchData = await searchRes.json();
      const teams: any[] =
        searchData?.sports?.[0]?.leagues?.[0]?.teams ||
        searchData?.teams || [];

      if (teams.length === 0) { records[school] = null; return; }

      const normalize = (entry: any) => entry.team || entry;
      const schoolLower = school.toLowerCase();
      const teamEntry = normalize(
        teams.find((e: any) => normalize(e).displayName?.toLowerCase() === schoolLower) ||
        teams.find((e: any) => normalize(e).displayName?.toLowerCase().includes(schoolLower)) ||
        teams[0]
      );

      const teamId = String(teamEntry.id);
      const teamRes = await fetch(
        `https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/teams/${teamId}`,
        { cache: "no-store", signal: AbortSignal.timeout(8000) }
      );

      if (!teamRes.ok) { records[school] = null; return; }

      const teamData = await teamRes.json();
      const t = teamData?.team || teamData;

      if (t?.record?.items?.[0]?.summary) {
        records[school] = t.record.items[0].summary;
      } else if (typeof t?.record === "string") {
        records[school] = t.record;
      } else if (t?.recordSummary) {
        records[school] = t.recordSummary;
      } else {
        records[school] = null;
      }
    } catch {
      records[school] = null;
    }
  };

  // Process in chunks of 5 for controlled concurrency
  for (let i = 0; i < batch.length; i += 5) {
    const chunk = batch.slice(i, i + 5);
    await Promise.all(chunk.map(fetchRecord));
  }

  return NextResponse.json({ records }, {
    headers: { "Cache-Control": "public, s-maxage=3600" },
  });
}
