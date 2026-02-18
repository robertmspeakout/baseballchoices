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
    // Strategy 1: Try ESPN's coaching staff (most reliable for sports)
    const espnUrl = await tryESPN(school);
    if (espnUrl) {
      return NextResponse.json({ url: espnUrl });
    }

    // Strategy 2: Try Wikipedia with just the coach name
    const wikiUrl = await tryWikipedia(name);
    if (wikiUrl) {
      return NextResponse.json({ url: wikiUrl });
    }

    // Strategy 3: Try Wikipedia with coach + school context
    const wikiUrl2 = await tryWikipedia(`${name} ${school} baseball`);
    if (wikiUrl2) {
      return NextResponse.json({ url: wikiUrl2 });
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
    // Only accept results that are likely about the person (check title/snippet for relevance)
    for (const result of results) {
      const title = (result.title || "").toLowerCase();
      const snippet = (result.snippet || "").toLowerCase();
      // Skip results that are clearly not about a person (vehicles, places, companies, etc.)
      const irrelevant = ["aircraft", "airplane", "airline", "airport", "ship", "locomotive", "building", "stadium", "bridge", "company", "disambiguation"];
      if (irrelevant.some((word) => title.includes(word) || snippet.includes(word))) continue;

      const pageId = result.pageid;
      const imageUrl = `https://en.wikipedia.org/w/api.php?action=query&pageids=${pageId}&prop=pageimages&pithumbsize=300&format=json&origin=*`;
      const imageRes = await fetch(imageUrl, { signal: AbortSignal.timeout(5000) });
      if (!imageRes.ok) continue;

      const imageData = await imageRes.json();
      const page = imageData?.query?.pages?.[pageId];
      if (page?.thumbnail?.source) {
        // Skip images that look like non-person content
        const imgSrc = page.thumbnail.source.toLowerCase();
        if (irrelevant.some((word) => imgSrc.includes(word))) continue;
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
    const espnSearchUrl = `https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/teams?limit=5&search=${encodeURIComponent(school)}`;
    const espnRes = await fetch(espnSearchUrl, { cache: "no-store", signal: AbortSignal.timeout(8000) });

    if (!espnRes.ok) return null;

    const espnData = await espnRes.json();
    const teams = espnData?.sports?.[0]?.leagues?.[0]?.teams || espnData?.teams || [];
    if (teams.length === 0) return null;

    // Find best match by school name
    const schoolLower = school.toLowerCase();
    const normalize = (entry: any) => entry.team || entry;
    const teamEntry = normalize(
      teams.find((e: any) => normalize(e).displayName?.toLowerCase() === schoolLower) ||
      teams.find((e: any) => normalize(e).displayName?.toLowerCase().includes(schoolLower)) ||
      teams[0]
    );

    const teamId = String(teamEntry.id);

    // Try the team detail endpoint (includes coaches)
    const teamUrl = `https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/teams/${teamId}`;
    const teamRes = await fetch(teamUrl, { cache: "no-store", signal: AbortSignal.timeout(8000) });

    if (teamRes.ok) {
      const teamData = await teamRes.json();
      const t = teamData?.team || teamData;

      const coaches = t?.coaches || [];
      for (const coach of coaches) {
        if (coach.headshot?.href) return coach.headshot.href;
        if (coach.image?.href) return coach.image.href;
      }
    }

    // Try the roster endpoint which sometimes has coach data
    try {
      const rosterUrl = `https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/teams/${teamId}/roster`;
      const rosterRes = await fetch(rosterUrl, { cache: "no-store", signal: AbortSignal.timeout(5000) });
      if (rosterRes.ok) {
        const rosterData = await rosterRes.json();
        const coaches = rosterData?.coaches || rosterData?.coach || [];
        for (const coach of (Array.isArray(coaches) ? coaches : [coaches])) {
          if (coach?.headshot?.href) return coach.headshot.href;
        }
      }
    } catch { /* ignore */ }

    return null;
  } catch {
    return null;
  }
}
