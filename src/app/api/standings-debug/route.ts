import { NextResponse } from "next/server";

/* eslint-disable @typescript-eslint/no-explicit-any */

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET() {
  const results: any = { timestamp: new Date().toISOString() };

  const tryFetch = async (label: string, url: string, handler?: (text: string) => any) => {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "baseballchoices/1.0" },
        signal: AbortSignal.timeout(15000),
      });
      const info: any = { status: res.status };
      if (res.ok) {
        const text = await res.text();
        info.size = text.length;
        if (handler) {
          info.parsed = handler(text);
        }
      }
      results[label] = info;
    } catch (err: any) {
      results[label] = { error: err?.message || String(err) };
    }
  };

  await Promise.all([
    // 1. ESPN scoreboard — check if games have team records embedded
    tryFetch("espnScoreboard", "https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/scoreboard", (text) => {
      const json = JSON.parse(text);
      const events = json.events || [];
      // Find a completed game and show its full competitor structure
      const completedGame = events.find((e: any) =>
        e.competitions?.[0]?.status?.type?.completed === true
      );
      const anyGame = events[0];
      const game = completedGame || anyGame;
      if (!game) return { games: 0 };
      const comp = game.competitions?.[0];
      const competitors = comp?.competitors || [];
      return {
        totalGames: events.length,
        completedGames: events.filter((e: any) => e.competitions?.[0]?.status?.type?.completed).length,
        sampleGame: game.name,
        // Show FULL competitor structure to find where records live
        competitor1: competitors[0] ? {
          teamId: competitors[0].team?.id,
          teamName: competitors[0].team?.displayName,
          records: competitors[0].records,
          score: competitors[0].score,
          winner: competitors[0].winner,
          // Show all keys on competitor
          allKeys: Object.keys(competitors[0]),
        } : null,
        competitor2: competitors[1] ? {
          teamId: competitors[1].team?.id,
          teamName: competitors[1].team?.displayName,
          records: competitors[1].records,
          score: competitors[1].score,
          winner: competitors[1].winner,
        } : null,
      };
    }),

    // 2. NCAA stats — winning percentage (has all teams with W-L)
    tryFetch("ncaaStats_winPct", "https://ncaa-api.henrygd.me/stats/baseball/d1/current/team/340", (text) => {
      const json = JSON.parse(text);
      const portlandIdx = text.toLowerCase().indexOf("portland");
      return {
        topKeys: Object.keys(json),
        dataCount: (json.data || []).length,
        sampleData: (json.data || []).slice(0, 3),
        portlandFound: portlandIdx >= 0,
        portlandContext: portlandIdx >= 0 ? text.slice(Math.max(0, portlandIdx - 100), portlandIdx + 200) : null,
      };
    }),

    // 3. NCAA rankings
    tryFetch("ncaaRankings", "https://ncaa-api.henrygd.me/rankings/baseball/d1", (text) => {
      const json = JSON.parse(text);
      return {
        topKeys: Object.keys(json),
        dataCount: (json.data || []).length,
        sampleData: (json.data || []).slice(0, 3),
      };
    }),

    // 4. ESPN schedule for Portland with higher limit
    tryFetch("espnPortlandFullSchedule", "https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/teams/416/schedule?season=2026&limit=100", (text) => {
      const json = JSON.parse(text);
      const events = json.events || [];
      const team = json.team || {};
      const completed = events.filter((e: any) => e.competitions?.[0]?.status?.type?.completed);
      let wins = 0, losses = 0;
      for (const ev of completed) {
        const comp = ev.competitions[0];
        const us = comp.competitors?.find((c: any) => String(c.team?.id || c.id) === "416");
        if (us?.winner === true) wins++;
        else if (us?.winner === false) losses++;
      }
      return {
        recordSummary: team.recordSummary,
        totalEvents: events.length,
        completedEvents: completed.length,
        computedRecord: `${wins}-${losses}`,
        sampleEventNames: events.slice(0, 5).map((e: any) => e.name),
        lastEventNames: events.slice(-5).map((e: any) => e.name),
      };
    }),

    // 5. ESPN scoreboard for a recent date (March 22 — Saturday, likely games)
    tryFetch("espnScoreboardMar22", "https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/scoreboard?dates=20260322", (text) => {
      const json = JSON.parse(text);
      const events = json.events || [];
      // Look for Portland in any game
      let portlandGame = null;
      for (const ev of events) {
        const comp = ev.competitions?.[0];
        for (const c of (comp?.competitors || [])) {
          if (c.team?.displayName?.toLowerCase().includes("portland") ||
              String(c.team?.id) === "416") {
            portlandGame = {
              game: ev.name,
              teamId: c.team?.id,
              teamName: c.team?.displayName,
              records: c.records,
              score: c.score,
              winner: c.winner,
              allCompetitorKeys: Object.keys(c),
            };
          }
        }
      }
      return {
        totalGames: events.length,
        portlandGame,
      };
    }),

    // 6. Try a few more scoreboard dates to find Portland
    tryFetch("espnScoreboardMar21", "https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/scoreboard?dates=20260321", (text) => {
      const json = JSON.parse(text);
      const events = json.events || [];
      let portlandGame = null;
      for (const ev of events) {
        for (const c of (ev.competitions?.[0]?.competitors || [])) {
          if (String(c.team?.id) === "416") {
            portlandGame = { game: ev.name, records: c.records, score: c.score, winner: c.winner, allKeys: Object.keys(c) };
          }
        }
      }
      return { totalGames: events.length, portlandGame };
    }),

    tryFetch("espnScoreboardMar20", "https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/scoreboard?dates=20260320", (text) => {
      const json = JSON.parse(text);
      const events = json.events || [];
      let portlandGame = null;
      for (const ev of events) {
        for (const c of (ev.competitions?.[0]?.competitors || [])) {
          if (String(c.team?.id) === "416") {
            portlandGame = { game: ev.name, records: c.records, score: c.score, winner: c.winner, allKeys: Object.keys(c) };
          }
        }
      }
      return { totalGames: events.length, portlandGame };
    }),
  ]);

  return NextResponse.json(results);
}
