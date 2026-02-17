import { NextRequest, NextResponse } from "next/server";

/* eslint-disable @typescript-eslint/no-explicit-any */

export const dynamic = "force-dynamic";

// Try multiple sources for coach headshot photos
export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name");
  const school = request.nextUrl.searchParams.get("school");

  if (!name || !school) {
    return NextResponse.json({ url: null });
  }

  try {
    // Strategy 1: Try Wikipedia for coach photo
    // Many well-known college baseball coaches have Wikipedia pages with images
    const wikiUrl = await tryWikipedia(`${name} baseball coach`);
    if (wikiUrl) {
      return NextResponse.json({ url: wikiUrl });
    }

    // Strategy 2: Try Wikipedia with school name included
    const wikiUrl2 = await tryWikipedia(`${name} ${school} baseball`);
    if (wikiUrl2) {
      return NextResponse.json({ url: wikiUrl2 });
    }

    // Strategy 3: Try ESPN's coaching staff
    const espnUrl = await tryESPN(school);
    if (espnUrl) {
      return NextResponse.json({ url: espnUrl });
    }

    // No photo found
    return NextResponse.json({ url: null });
  } catch {
    return NextResponse.json({ url: null });
  }
}

async function tryWikipedia(query: string): Promise<string | null> {
  try {
    // Search Wikipedia for the person
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=3&format=json&origin=*`;
    const searchRes = await fetch(searchUrl, { signal: AbortSignal.timeout(5000) });
    if (!searchRes.ok) return null;

    const searchData = await searchRes.json();
    const results = searchData?.query?.search || [];
    if (results.length === 0) return null;

    // Try to get the page image (thumbnail) for each result
    for (const result of results) {
      const pageId = result.pageid;
      const imageUrl = `https://en.wikipedia.org/w/api.php?action=query&pageids=${pageId}&prop=pageimages&pithumbsize=300&format=json&origin=*`;
      const imageRes = await fetch(imageUrl, { signal: AbortSignal.timeout(5000) });
      if (!imageRes.ok) continue;

      const imageData = await imageRes.json();
      const page = imageData?.query?.pages?.[pageId];
      if (page?.thumbnail?.source) {
        return page.thumbnail.source;
      }
    }

    return null;
  } catch {
    return null;
  }
}

async function tryESPN(school: string): Promise<string | null> {
  try {
    const espnSearchUrl = `https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/teams?limit=3&search=${encodeURIComponent(school)}`;
    const espnRes = await fetch(espnSearchUrl, { cache: "no-store", signal: AbortSignal.timeout(5000) });

    if (!espnRes.ok) return null;

    const espnData = await espnRes.json();
    const teams = espnData?.sports?.[0]?.leagues?.[0]?.teams || espnData?.teams || [];
    if (teams.length === 0) return null;

    const team = teams[0].team || teams[0];
    const teamId = team.id;

    const teamUrl = `https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/teams/${teamId}`;
    const teamRes = await fetch(teamUrl, { cache: "no-store", signal: AbortSignal.timeout(5000) });

    if (!teamRes.ok) return null;

    const teamData = await teamRes.json();
    const t = teamData?.team || teamData;

    const coaches = t?.coaches || [];
    for (const coach of coaches) {
      if (coach.headshot?.href) return coach.headshot.href;
      if (coach.image?.href) return coach.image.href;
    }

    return null;
  } catch {
    return null;
  }
}
