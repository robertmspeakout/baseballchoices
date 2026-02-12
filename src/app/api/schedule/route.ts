import { NextRequest, NextResponse } from "next/server";

interface ESPNEvent {
  id: string;
  date: string;
  name: string;
  shortName: string;
  competitions: {
    id: string;
    date: string;
    venue?: { fullName: string; city: string; state: string };
    status: {
      type: { completed: boolean; description: string };
    };
    competitors: {
      id: string;
      team: { displayName: string; abbreviation: string; logo: string };
      homeAway: string;
      score?: string;
      winner?: boolean;
    }[];
  }[];
}

export async function GET(request: NextRequest) {
  const school = request.nextUrl.searchParams.get("school");
  if (!school) {
    return NextResponse.json({ record: null, recentGames: [], upcoming: [] });
  }

  try {
    // Step 1: Search for the ESPN team ID
    const searchUrl = `https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/teams?limit=5&search=${encodeURIComponent(school)}`;
    const searchRes = await fetch(searchUrl, {
      headers: { "User-Agent": "NextBase/1.0" },
      next: { revalidate: 3600 },
    });

    if (!searchRes.ok) {
      return NextResponse.json({ record: null, recentGames: [], upcoming: [] });
    }

    const searchData = await searchRes.json();
    const teams = searchData?.sports?.[0]?.leagues?.[0]?.teams;
    if (!teams || teams.length === 0) {
      return NextResponse.json({ record: null, recentGames: [], upcoming: [] });
    }

    // Find best match (prefer exact name match, then includes, then first result)
    const schoolLower = school.toLowerCase();
    const teamEntry =
      teams.find(
        (t: { team: { displayName: string } }) =>
          t.team.displayName.toLowerCase() === schoolLower
      ) ||
      teams.find(
        (t: { team: { displayName: string } }) =>
          t.team.displayName.toLowerCase().startsWith(schoolLower)
      ) ||
      teams[0];
    const teamId = teamEntry.team.id;
    const teamDisplayName = teamEntry.team.displayName.toLowerCase();

    // Step 2: Fetch team schedule
    const scheduleUrl = `https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/teams/${teamId}/schedule`;
    const scheduleRes = await fetch(scheduleUrl, {
      headers: { "User-Agent": "NextBase/1.0" },
      next: { revalidate: 1800 }, // Cache 30 min
    });

    if (!scheduleRes.ok) {
      return NextResponse.json({ record: null, recentGames: [], upcoming: [] });
    }

    const scheduleData = await scheduleRes.json();
    const events: ESPNEvent[] = scheduleData?.events || [];

    // Separate completed and upcoming games
    const completed: typeof parsedGames = [];
    const upcoming: typeof parsedGames = [];

    const parsedGames: {
      date: string;
      opponent: string;
      opponentLogo: string;
      location: string;
      homeAway: string;
      score: string | null;
      result: string | null;
      completed: boolean;
    }[] = [];

    for (const event of events) {
      const comp = event.competitions?.[0];
      if (!comp) continue;

      const isCompleted = comp.status?.type?.completed === true;

      // Find our team and opponent (match against ESPN's resolved team name)
      const ourTeam = comp.competitors?.find(
        (c) => c.team.displayName.toLowerCase() === teamDisplayName
      );
      const opponent = comp.competitors?.find(
        (c) => c.team.displayName.toLowerCase() !== teamDisplayName
      );

      if (!ourTeam || !opponent) continue;

      const venue = comp.venue;
      let locationStr = "";
      if (venue) {
        locationStr = venue.fullName;
        if (venue.city) locationStr += `, ${venue.city}`;
        if (venue.state) locationStr += `, ${venue.state}`;
      } else {
        locationStr = ourTeam.homeAway === "home" ? "Home" : "Away";
      }

      let score: string | null = null;
      let result: string | null = null;
      if (isCompleted && ourTeam.score != null && opponent.score != null) {
        score = `${ourTeam.score}-${opponent.score}`;
        result = ourTeam.winner ? "W" : "L";
      }

      const game = {
        date: event.date,
        opponent: opponent.team.displayName,
        opponentLogo: opponent.team.logo || "",
        location: locationStr,
        homeAway: ourTeam.homeAway === "home" ? "vs" : "@",
        score,
        result,
        completed: isCompleted,
      };

      if (isCompleted) {
        completed.push(game);
      } else {
        upcoming.push(game);
      }
    }

    // Win-loss record from all completed games
    const wins = completed.filter(g => g.result === "W").length;
    const losses = completed.filter(g => g.result === "L").length;
    const record = completed.length > 0 ? `${wins}-${losses}` : null;

    // Last 3 completed games (most recent first)
    const recentGames = completed.slice(-3).reverse();

    // Next 3 upcoming games
    const next3 = upcoming.slice(0, 3);

    return NextResponse.json({ record, recentGames, upcoming: next3 });
  } catch {
    return NextResponse.json({ record: null, recentGames: [], upcoming: [] });
  }
}
