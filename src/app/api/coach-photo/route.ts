import { NextRequest, NextResponse } from "next/server";

/* eslint-disable @typescript-eslint/no-explicit-any */

export const dynamic = "force-dynamic";

// Try multiple sources for coach headshot photos
export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name");
  const school = request.nextUrl.searchParams.get("school");
  const website = request.nextUrl.searchParams.get("website");

  if (!name || !school) {
    return NextResponse.json({ url: null });
  }

  try {
    // Strategy 1: Try the school's own athletics website (most accurate)
    if (website) {
      const siteUrl = await trySchoolWebsite(website, name);
      if (siteUrl) {
        return NextResponse.json({ url: siteUrl });
      }
    }

    // Strategy 2: Try ESPN's coaching staff
    const espnUrl = await tryESPN(school);
    if (espnUrl) {
      return NextResponse.json({ url: espnUrl });
    }

    // Strategy 3: Try Wikipedia with just the coach name
    const wikiUrl = await tryWikipedia(name);
    if (wikiUrl) {
      return NextResponse.json({ url: wikiUrl });
    }

    // Strategy 4: Try Wikipedia with coach + school context
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

async function trySchoolWebsite(website: string, coachName: string): Promise<string | null> {
  try {
    // Most college athletics sites have a coaches page at /coaches relative to the sport page
    const baseUrl = website.replace(/\/$/, "");
    const coachesUrl = `${baseUrl}/coaches`;

    const res = await fetch(coachesUrl, {
      signal: AbortSignal.timeout(8000),
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    if (!res.ok) return null;

    const html = await res.text();

    // Normalize the coach name for matching
    const nameParts = coachName.toLowerCase().split(/\s+/);
    const lastName = nameParts[nameParts.length - 1];
    const firstName = nameParts[0];

    // Look for image tags near the coach's name in the HTML
    // Common patterns: the coach name appears in text near an <img> with a headshot
    // Strategy: find all <img> tags with their surrounding context and match by coach name proximity

    // First, try to find a section containing the coach's name
    // Look for the coach name (case-insensitive) and grab a large window around it
    const lowerHtml = html.toLowerCase();
    const nameIndex = lowerHtml.indexOf(`${firstName}`) !== -1 && lowerHtml.indexOf(`${lastName}`) !== -1
      ? findCoachSection(lowerHtml, firstName, lastName)
      : -1;

    if (nameIndex === -1) return null;

    // Extract a window around where we found the coach's name
    const windowStart = Math.max(0, nameIndex - 2000);
    const windowEnd = Math.min(html.length, nameIndex + 2000);
    const section = html.substring(windowStart, windowEnd);

    // Find image URLs in this section
    const imgMatches = section.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi);
    for (const match of imgMatches) {
      const src = match[0];
      const imgUrl = match[1];

      // Skip tiny images (icons, spacers), logos, and non-photo images
      if (isLikelyHeadshot(src, imgUrl)) {
        // Make relative URLs absolute
        const absoluteUrl = imgUrl.startsWith("http")
          ? imgUrl
          : imgUrl.startsWith("//")
            ? `https:${imgUrl}`
            : new URL(imgUrl, coachesUrl).href;
        return absoluteUrl;
      }
    }

    // Also try data-src (lazy-loaded images)
    const lazySrcMatches = section.matchAll(/data-src=["']([^"']+)["']/gi);
    for (const match of lazySrcMatches) {
      const imgUrl = match[1];
      if (imgUrl.match(/\.(jpg|jpeg|png|webp)/i) && !imgUrl.match(/logo|icon|sponsor|banner|favicon/i)) {
        const absoluteUrl = imgUrl.startsWith("http")
          ? imgUrl
          : imgUrl.startsWith("//")
            ? `https:${imgUrl}`
            : new URL(imgUrl, coachesUrl).href;
        return absoluteUrl;
      }
    }

    return null;
  } catch {
    return null;
  }
}

// Find the position of the coach's name section in the HTML
function findCoachSection(html: string, firstName: string, lastName: string): number {
  // Try to find both first and last name near each other (within 200 chars)
  let searchStart = 0;
  while (searchStart < html.length) {
    const lastNameIdx = html.indexOf(lastName, searchStart);
    if (lastNameIdx === -1) break;

    // Check if first name is within 200 chars of last name
    const windowStart = Math.max(0, lastNameIdx - 200);
    const windowEnd = Math.min(html.length, lastNameIdx + 200);
    const window = html.substring(windowStart, windowEnd);

    if (window.includes(firstName)) {
      return lastNameIdx;
    }

    searchStart = lastNameIdx + 1;
  }
  return -1;
}

// Heuristic: is this image likely a headshot photo?
function isLikelyHeadshot(imgTag: string, imgUrl: string): boolean {
  const lower = (imgTag + " " + imgUrl).toLowerCase();

  // Skip things that are clearly not headshots
  if (lower.match(/logo|icon|sponsor|banner|favicon|spacer|pixel|tracking|ad-|advert|widget|badge/)) {
    return false;
  }

  // Skip very small images (width/height attributes < 50)
  const widthMatch = lower.match(/width=["']?(\d+)/);
  const heightMatch = lower.match(/height=["']?(\d+)/);
  if (widthMatch && parseInt(widthMatch[1]) < 50) return false;
  if (heightMatch && parseInt(heightMatch[1]) < 50) return false;

  // Positive signals: common headshot URL patterns
  if (lower.match(/headshot|coach|staff|portrait|photo|head_shot|profile/)) {
    return true;
  }

  // Accept image URLs that look like photos (jpg/png/webp)
  if (imgUrl.match(/\.(jpg|jpeg|png|webp)/i)) {
    return true;
  }

  return false;
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
