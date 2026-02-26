import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readFileSync } from "fs";
import { join } from "path";

/* eslint-disable @typescript-eslint/no-explicit-any */

export const dynamic = "force-dynamic";

// Cache schools data in memory
let schoolsData: any[] | null = null;
function getSchools(): any[] {
  if (!schoolsData) {
    const filePath = join(process.cwd(), "src/data/schools.json");
    schoolsData = JSON.parse(readFileSync(filePath, "utf-8"));
  }
  return schoolsData!;
}

// Find ESPN team ID for a school name
async function findEspnTeamId(schoolName: string): Promise<{ teamId: string; teamLogo: string } | null> {
  try {
    const searchUrl = `https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/teams?limit=3&search=${encodeURIComponent(schoolName)}`;
    const res = await fetch(searchUrl, { cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;

    const data = await res.json();
    const teams: any[] = data?.sports?.[0]?.leagues?.[0]?.teams || data?.teams || [];
    if (teams.length === 0) return null;

    const normalize = (e: any) => e.team || e;
    const lc = schoolName.toLowerCase();
    const entry = normalize(
      teams.find((e: any) => normalize(e).displayName?.toLowerCase() === lc) ||
      teams.find((e: any) => normalize(e).displayName?.toLowerCase().includes(lc)) ||
      teams[0]
    );

    return {
      teamId: String(entry.id),
      teamLogo: entry.logos?.[0]?.href || "",
    };
  } catch {
    return null;
  }
}

// Extract score from ESPN competitor
function extractScore(c: any): string | null {
  const s = c.score;
  if (s == null || s === "") return null;
  if (typeof s === "number") return String(s);
  if (typeof s === "string") return s;
  if (typeof s === "object") {
    if (s.displayValue != null) return String(s.displayValue);
    if (s.value != null) return String(s.value);
  }
  return null;
}

// GET — generate notifications for the current user's 4/5-star programs
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user has notifications enabled
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { notificationsEnabled: true },
  });
  if (!user?.notificationsEnabled) {
    return NextResponse.json({ generated: 0, message: "Notifications disabled" });
  }

  // Get user's 4 and 5 star programs
  const starredSchools = await prisma.userSchoolData.findMany({
    where: { userId: session.user.id, priority: { gte: 4 } },
    select: { schoolId: true },
  });

  if (starredSchools.length === 0) {
    return NextResponse.json({ generated: 0, message: "No 4 or 5 star programs" });
  }

  const schoolIds = starredSchools.map((s) => s.schoolId);
  const allSchools = getSchools();

  // Get existing notifications from the last 24 hours to avoid duplicates
  const oneDayAgo = new Date();
  oneDayAgo.setHours(oneDayAgo.getHours() - 24);
  const recentNotifications = await prisma.notification.findMany({
    where: {
      userId: session.user.id,
      createdAt: { gte: oneDayAgo },
    },
    select: { type: true, schoolId: true, title: true },
  });
  const recentKeys = new Set(recentNotifications.map((n) => `${n.type}:${n.schoolId}:${n.title}`));

  const newNotifications: {
    userId: string;
    schoolId: number;
    type: string;
    title: string;
    body: string;
    link: string | null;
    schoolLogo: string | null;
  }[] = [];

  // Process schools in chunks of 5
  for (let i = 0; i < schoolIds.length; i += 5) {
    const chunk = schoolIds.slice(i, i + 5);
    await Promise.all(
      chunk.map(async (schoolId) => {
        const school = allSchools.find((s: any) => s.id === schoolId);
        if (!school) return;

        const espn = await findEspnTeamId(school.name);
        if (!espn) return;

        try {
          const year = new Date().getFullYear();
          const [scheduleRes, teamRes] = await Promise.all([
            fetch(
              `https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/teams/${espn.teamId}/schedule?season=${year}`,
              { cache: "no-store", signal: AbortSignal.timeout(8000) }
            ),
            fetch(
              `https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/teams/${espn.teamId}`,
              { cache: "no-store", signal: AbortSignal.timeout(8000) }
            ),
          ]);

          // --- Check ranking (D1 only) ---
          // We compare against the last ranking notification we sent for this school
          // to detect changes, rather than using static JSON data which may be stale.
          if (school.division === "D1" && teamRes.ok) {
            try {
              const teamData = await teamRes.json();
              const t = teamData?.team || teamData;
              const currentRank = t?.rank;

              // Find the most recent ranking notification for this school
              const lastRankNotif = await prisma.notification.findFirst({
                where: {
                  userId: session.user.id,
                  schoolId,
                  type: "ranking_change",
                },
                orderBy: { createdAt: "desc" },
                select: { title: true },
              });

              // Extract the last rank from the previous notification title (e.g. "#12" or "out of Top 25")
              const wasRanked = lastRankNotif ? !lastRankNotif.title.includes("drops out") : null;
              const prevRankMatch = lastRankNotif?.title.match(/#(\d+)/);
              const prevRank = prevRankMatch ? parseInt(prevRankMatch[1]) : null;

              if (currentRank && currentRank <= 25) {
                // Team is currently ranked — notify if newly ranked or rank changed
                if (wasRanked === false) {
                  // Was previously unranked, now ranked
                  const key = `ranking_change:${schoolId}:${school.name} enters Top 25 at #${currentRank}`;
                  if (!recentKeys.has(key)) {
                    newNotifications.push({
                      userId: session.user.id,
                      schoolId,
                      type: "ranking_change",
                      title: `${school.name} enters Top 25 at #${currentRank}`,
                      body: `${school.name} has entered the D1 Top 25 rankings at #${currentRank}.`,
                      link: null,
                      schoolLogo: espn.teamLogo || school.logo_url,
                    });
                  }
                } else if (prevRank && prevRank !== currentRank) {
                  // Rank changed
                  const direction = currentRank < prevRank ? "up" : "down";
                  const key = `ranking_change:${schoolId}:${school.name} moves to #${currentRank}`;
                  if (!recentKeys.has(key)) {
                    newNotifications.push({
                      userId: session.user.id,
                      schoolId,
                      type: "ranking_change",
                      title: `${school.name} moves ${direction} to #${currentRank}`,
                      body: `${school.name} moved from #${prevRank} to #${currentRank} in the D1 Top 25.`,
                      link: null,
                      schoolLogo: espn.teamLogo || school.logo_url,
                    });
                  }
                } else if (wasRanked === null) {
                  // First time we're tracking this school — just record current rank
                  const key = `ranking_change:${schoolId}:${school.name} ranked #${currentRank}`;
                  if (!recentKeys.has(key)) {
                    newNotifications.push({
                      userId: session.user.id,
                      schoolId,
                      type: "ranking_change",
                      title: `${school.name} is ranked #${currentRank}`,
                      body: `${school.name} is currently #${currentRank} in the D1 Top 25 rankings.`,
                      link: null,
                      schoolLogo: espn.teamLogo || school.logo_url,
                    });
                  }
                }
              } else if (wasRanked === true && prevRank) {
                // Team was ranked before but isn't anymore
                const key = `ranking_change:${schoolId}:${school.name} drops out of Top 25`;
                if (!recentKeys.has(key)) {
                  newNotifications.push({
                    userId: session.user.id,
                    schoolId,
                    type: "ranking_change",
                    title: `${school.name} drops out of Top 25`,
                    body: `${school.name} (previously #${prevRank}) has dropped out of the D1 Top 25 rankings.`,
                    link: null,
                    schoolLogo: espn.teamLogo || school.logo_url,
                  });
                }
              }
            } catch { /* ignore */ }
          }

          // --- Check schedule for game results and today's games ---
          if (scheduleRes.ok) {
            const scheduleData = await scheduleRes.json();
            const events: any[] = scheduleData?.events || [];

            const today = new Date();
            const todayStr = today.toISOString().split("T")[0];

            // Find last completed game and today's games
            let lastCompletedGame: any = null;
            const todaysGames: any[] = [];

            for (const event of events) {
              const comp = event.competitions?.[0];
              if (!comp) continue;
              const isCompleted = comp.status?.type?.completed === true;
              const competitors: any[] = comp.competitors || [];
              if (competitors.length < 2) continue;

              const gameDate = new Date(event.date);
              const gameDateStr = gameDate.toISOString().split("T")[0];

              if (isCompleted) {
                lastCompletedGame = { event, comp, competitors };
              } else if (gameDateStr === todayStr) {
                todaysGames.push({ event, comp, competitors });
              }
            }

            // Notification: last game result
            if (lastCompletedGame) {
              const { event, competitors } = lastCompletedGame;
              const ourTeam = competitors.find((c: any) => String(c.team?.id || c.id) === espn.teamId);
              const opponent = competitors.find((c: any) => String(c.team?.id || c.id) !== espn.teamId);
              if (ourTeam && opponent) {
                const ourScore = extractScore(ourTeam);
                const oppScore = extractScore(opponent);
                const oppName = opponent.team?.shortDisplayName || opponent.team?.displayName || "Opponent";
                const homeAway = ourTeam.homeAway === "home" ? "vs" : "@";

                if (ourScore != null && oppScore != null) {
                  const won = ourTeam.winner === true || parseInt(ourScore) > parseInt(oppScore);
                  const resultTag = won ? "W" : "L";
                  const gameDate = new Date(event.date);
                  const dateStr = gameDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                  const title = `${resultTag}: ${school.name} ${ourScore}, ${oppName} ${oppScore}`;
                  const key = `game_result:${schoolId}:${title}`;

                  // Build ESPN game recap link from the event ID
                  const gameId = event.id || event.uid?.split(":").pop();
                  const recapLink = gameId
                    ? `https://www.espn.com/college-baseball/game/_/gameId/${gameId}`
                    : event.links?.[0]?.href || null;

                  if (!recentKeys.has(key)) {
                    newNotifications.push({
                      userId: session.user.id,
                      schoolId,
                      type: "game_result",
                      title,
                      body: `${school.name} ${homeAway} ${oppName} — Final score ${ourScore}-${oppScore} on ${dateStr}.`,
                      link: recapLink,
                      schoolLogo: espn.teamLogo || school.logo_url,
                    });
                  }
                }
              }
            }

            // Notification: game today
            for (const game of todaysGames) {
              const { event, competitors } = game;
              const ourTeam = competitors.find((c: any) => String(c.team?.id || c.id) === espn.teamId);
              const opponent = competitors.find((c: any) => String(c.team?.id || c.id) !== espn.teamId);
              if (ourTeam && opponent) {
                const oppName = opponent.team?.shortDisplayName || opponent.team?.displayName || "TBD";
                const homeAway = ourTeam.homeAway === "home" ? "vs" : "@";
                const gameDate = new Date(event.date);
                const timeStr = gameDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

                const title = `Game Today: ${school.name} ${homeAway} ${oppName}`;
                const key = `game_today:${schoolId}:${title}`;

                // Try to find ESPN+ or broadcast link
                let streamLink: string | null = null;
                const broadcasts = event.competitions?.[0]?.broadcasts;
                if (broadcasts) {
                  for (const b of broadcasts) {
                    for (const name of b.names || []) {
                      if (name.toLowerCase().includes("espn")) {
                        streamLink = event.links?.[0]?.href || "https://www.espn.com/watch/";
                        break;
                      }
                    }
                  }
                }
                if (!streamLink) {
                  streamLink = event.links?.[0]?.href || null;
                }

                if (!recentKeys.has(key)) {
                  newNotifications.push({
                    userId: session.user.id,
                    schoolId,
                    type: "game_today",
                    title,
                    body: `${school.name} plays ${oppName} today at ${timeStr}.`,
                    link: streamLink,
                    schoolLogo: espn.teamLogo || school.logo_url,
                  });
                }
              }
            }
          }
        } catch {
          // Skip this school on error
        }
      })
    );
  }

  // Batch insert all new notifications
  if (newNotifications.length > 0) {
    await prisma.notification.createMany({ data: newNotifications });
  }

  // Clean up old notifications (older than 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  await prisma.notification.deleteMany({
    where: {
      userId: session.user.id,
      createdAt: { lt: thirtyDaysAgo },
    },
  });

  return NextResponse.json({ generated: newNotifications.length });
}
