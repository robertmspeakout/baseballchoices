import { NextRequest, NextResponse } from "next/server";

/* eslint-disable @typescript-eslint/no-explicit-any */

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const espnId = request.nextUrl.searchParams.get("espn_id");
  if (!espnId) {
    return NextResponse.json({ roster: [] });
  }

  try {
    const res = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/teams/${espnId}/roster`,
      { cache: "no-store", signal: AbortSignal.timeout(10000) }
    );

    if (!res.ok) {
      console.error(`[roster] ESPN fetch failed: ${res.status} for team ${espnId}`);
      return NextResponse.json({ roster: [] });
    }

    const data = await res.json();

    // ESPN returns athletes in one of two formats:
    // 1. Flat array: data.athletes is [{...player}, ...]
    // 2. Grouped: data.athletes is [{ position: "Pitchers", items: [...] }, ...]
    let athletes: any[] = [];

    if (Array.isArray(data.athletes)) {
      for (const entry of data.athletes) {
        if (entry.items && Array.isArray(entry.items)) {
          // Grouped format
          athletes.push(...entry.items);
        } else if (entry.displayName || entry.fullName) {
          // Flat format — this is a player directly
          athletes.push(entry);
        }
      }
    }

    const roster = athletes.map((a: any) => ({
      jersey: a.jersey || "",
      name: a.displayName || a.fullName || `${a.firstName || ""} ${a.lastName || ""}`.trim(),
      position: a.position?.abbreviation || a.position?.name || "",
      classYear: a.experience?.displayValue || "",
      height: a.displayHeight || "",
      weight: a.displayWeight || (a.weight ? `${a.weight} lbs` : ""),
      hometown:
        [a.birthPlace?.city, a.birthPlace?.state].filter(Boolean).join(", ") || "",
    }));

    // Sort by jersey number (numeric)
    roster.sort((a: any, b: any) => {
      const numA = parseInt(a.jersey, 10);
      const numB = parseInt(b.jersey, 10);
      if (isNaN(numA) && isNaN(numB)) return a.jersey.localeCompare(b.jersey);
      if (isNaN(numA)) return 1;
      if (isNaN(numB)) return -1;
      return numA - numB;
    });

    return NextResponse.json(
      { roster },
      { headers: { "Cache-Control": "public, s-maxage=3600" } }
    );
  } catch (err) {
    console.error(`[roster] Error fetching roster for team ${espnId}:`, err);
    return NextResponse.json({ roster: [] });
  }
}
