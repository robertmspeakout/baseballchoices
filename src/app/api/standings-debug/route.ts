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

  // ── Phase 1: Get Portland's last game date from schedule ──
  let lastGameDate: string | null = null;
  let lastGameDates: string[] = [];

  await tryFetch("espnPortlandSchedule", "https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/teams/416/schedule?season=2026&limit=100", (text) => {
    const json = JSON.parse(text);
    const events = json.events || [];
    const team = json.team || {};
    const completed = events.filter((e: any) => e.competitions?.[0]?.status?.type?.completed);

    // Collect dates of all completed games (YYYYMMDD format for scoreboard)
    const dates = completed.map((e: any) => {
      const d = new Date(e.date);
      return d.toISOString().slice(0, 10).replace(/-/g, "");
    });
    lastGameDates = [...new Set(dates)].sort().reverse(); // most recent first
    lastGameDate = lastGameDates[0] || null;

    let wins = 0, losses = 0;
    for (const ev of completed) {
      const comp = ev.competitions[0];
      const us = comp.competitors?.find((c: any) => String(c.team?.id || c.id) === "416");
      if (us?.winner === true) wins++;
      else if (us?.winner === false) losses++;
    }
    return {
      recordSummary: team.recordSummary,
      recordItems: team.record,
      totalEvents: events.length,
      completedEvents: completed.length,
      computedRecord: `${wins}-${losses}`,
      lastGameDate,
      allCompletedDates: lastGameDates,
    };
  });

  // ── Phase 2: Test the scoreboard approach using Portland's actual game dates ──
  // Also test ESPN standings bulk + ESPN team endpoint
  const scoreboardTests: Promise<void>[] = [];

  // Test up to 3 most recent game dates from Portland's schedule
  for (let i = 0; i < Math.min(3, lastGameDates.length); i++) {
    const date = lastGameDates[i];
    scoreboardTests.push(
      tryFetch(`scoreboardForPortland_${date}`, `https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/scoreboard?dates=${date}`, (text) => {
        const json = JSON.parse(text);
        const events = json.events || [];
        let portlandGame = null;
        for (const ev of events) {
          for (const c of (ev.competitions?.[0]?.competitors || [])) {
            if (String(c.team?.id) === "416") {
              portlandGame = {
                game: ev.name,
                records: c.records,
                score: c.score,
                winner: c.winner,
                homeAway: c.homeAway,
                allKeys: Object.keys(c),
              };
            }
          }
        }
        return { totalGames: events.length, portlandGame };
      })
    );
  }

  // Also test ESPN standings bulk endpoint
  scoreboardTests.push(
    tryFetch("espnStandingsBulk", "https://site.api.espn.com/apis/v2/sports/baseball/college-baseball/standings", (text) => {
      const json = JSON.parse(text);
      const conferences = json.children || [];
      let portlandEntry = null;
      let totalTeams = 0;
      let teamsWithRecord = 0;
      for (const conf of conferences) {
        const entries = conf.standings?.entries || [];
        for (const entry of entries) {
          totalTeams++;
          const team = entry.team || {};
          const stats = entry.stats || [];
          const overallStat = stats.find((s: any) => s.name === "overall" || s.type === "total");
          if (overallStat?.displayValue && overallStat.displayValue !== "0-0") teamsWithRecord++;

          if (String(team.id) === "416" || team.displayName?.includes("Portland")) {
            portlandEntry = {
              teamId: team.id,
              teamName: team.displayName,
              stats: stats.slice(0, 10),
              overallStat: overallStat || null,
            };
          }
        }
      }
      return {
        totalConferences: conferences.length,
        totalTeams,
        teamsWithNonZeroRecord: teamsWithRecord,
        portlandEntry,
      };
    })
  );

  // Test ESPN team endpoint — show ALL keys to find any record field
  scoreboardTests.push(
    tryFetch("espnTeam416_allKeys", "https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/teams/416", (text) => {
      const json = JSON.parse(text);
      const t = json.team || json;
      return {
        topLevelKeys: Object.keys(json),
        teamKeys: Object.keys(t),
        record: t.record,
        recordSummary: t.recordSummary,
        standingSummary: t.standingSummary,
        displayName: t.displayName,
      };
    })
  );

  await Promise.all(scoreboardTests);

  return NextResponse.json(results);
}
