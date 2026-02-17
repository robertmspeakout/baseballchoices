import { NextRequest, NextResponse } from "next/server";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Maps school names to their athletics site domains for coach photo lookups
// This covers major D1 programs; others fall back to generic search
const SITE_PATTERNS: Record<string, string> = {};

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name");
  const school = request.nextUrl.searchParams.get("school");

  if (!name || !school) {
    return NextResponse.json({ url: null });
  }

  try {
    // Strategy 1: Search Google for coach headshot from athletics site
    // Use a formatted search query that targets official athletics pages
    const searchName = name.replace(/\s+/g, "+");
    const searchSchool = school.replace(/\s+/g, "+");

    // Try fetching from the school's athletics website roster/coaching staff page
    // Many use Sidearm Sports and have predictable URL patterns
    const query = `${searchName}+${searchSchool}+baseball+head+coach+headshot`;

    // Try Google Custom Search or fall back to athletics site patterns
    // For now, try to construct likely URLs based on common athletics site patterns

    // Strategy 2: Try ESPN's coaching staff
    const espnSearchUrl = `https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/teams?limit=3&search=${encodeURIComponent(school)}`;
    const espnRes = await fetch(espnSearchUrl, { cache: "no-store" });

    if (espnRes.ok) {
      const espnData = await espnRes.json();
      const teams = espnData?.sports?.[0]?.leagues?.[0]?.teams || espnData?.teams || [];
      if (teams.length > 0) {
        const team = teams[0].team || teams[0];
        const teamId = team.id;

        // ESPN sometimes has coach info at the team endpoint
        const teamUrl = `https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/teams/${teamId}`;
        const teamRes = await fetch(teamUrl, { cache: "no-store" });

        if (teamRes.ok) {
          const teamData = await teamRes.json();
          const t = teamData?.team || teamData;

          // Check if there's coach data with headshot
          const coaches = t?.coaches || [];
          for (const coach of coaches) {
            if (coach.headshot?.href) {
              return NextResponse.json({ url: coach.headshot.href });
            }
            // Sometimes it's nested differently
            if (coach.image?.href) {
              return NextResponse.json({ url: coach.image.href });
            }
          }

          // ESPN team logo as last resort (not a coach photo but better than nothing)
          // Don't use this - user wants actual coach photos
        }
      }
    }

    // No photo found
    return NextResponse.json({ url: null });
  } catch {
    return NextResponse.json({ url: null });
  }
}
