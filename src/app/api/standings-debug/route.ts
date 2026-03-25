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

  const tests: Promise<void>[] = [];

  // ── 1. ESPN standings with different group IDs to find WCC ──
  // The default only returned 1 group with 138 teams. WCC might be a different group.
  // Common ESPN conference group IDs for college baseball
  const groupIds = [0, 1, 2, 3, 4, 5, 10, 18, 39, 46, 50, 100];
  for (const gid of groupIds) {
    tests.push(
      tryFetch(`standings_group${gid}`, `https://site.api.espn.com/apis/v2/sports/baseball/college-baseball/standings?group=${gid}`, (text) => {
        const json = JSON.parse(text);
        const conferences = json.children || [];
        let portland = null;
        let totalTeams = 0;
        const confNames: string[] = [];
        for (const conf of conferences) {
          confNames.push(conf.name || conf.abbreviation || "?");
          const entries = conf.standings?.entries || [];
          for (const entry of entries) {
            totalTeams++;
            const team = entry.team || {};
            const dn = (team.displayName || "").toLowerCase();
            const loc = (team.location || "").toLowerCase();
            if (dn.includes("portland") || loc.includes("portland") || String(team.id) === "416") {
              const stats = entry.stats || [];
              const overall = stats.find((s: any) => s.name === "overall" || s.type === "total");
              portland = {
                teamId: team.id,
                displayName: team.displayName,
                location: team.location,
                overall: overall?.displayValue || overall?.summary || null,
                allStatNames: stats.map((s: any) => `${s.name}=${s.displayValue}`),
              };
            }
          }
        }
        return { conferences: confNames.length, confNames, totalTeams, portland };
      })
    );
  }

  // ── 2. ESPN team search for "University of Portland" ──
  tests.push(
    tryFetch("searchUniversityOfPortland", "https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/teams?limit=500&search=University%20of%20Portland", (text) => {
      const json = JSON.parse(text);
      const teams = json?.sports?.[0]?.leagues?.[0]?.teams || json?.teams || [];
      const matches: any[] = [];
      for (const entry of teams) {
        const t = entry?.team || entry;
        const dn = (t.displayName || "").toLowerCase();
        const loc = (t.location || "").toLowerCase();
        if (dn.includes("portland") || loc.includes("portland")) {
          matches.push({
            id: t.id,
            displayName: t.displayName,
            location: t.location,
            record: t.record,
            recordSummary: t.recordSummary,
            allKeys: Object.keys(t),
          });
        }
      }
      return { totalTeams: teams.length, portlandMatches: matches };
    })
  );

  // ── 3. NCAA API — try different endpoints ──
  tests.push(
    tryFetch("ncaaStandings", "https://ncaa-api.henrygd.me/standings/baseball/d1", (text) => {
      const json = JSON.parse(text);
      const data = json.data || json || [];
      let portland = null;
      for (const group of (Array.isArray(data) ? data : [])) {
        for (const team of (group.standings || group.data || [])) {
          const school = (team["School"] || team["school"] || "").toLowerCase();
          if (school.includes("portland")) {
            portland = team;
          }
        }
      }
      return { dataGroups: Array.isArray(data) ? data.length : "not array", portland };
    })
  );

  // Try NCAA scoreboard
  tests.push(
    tryFetch("ncaaScoreboard", "https://ncaa-api.henrygd.me/scoreboard/baseball/d1", (text) => {
      const json = JSON.parse(text);
      const portlandIdx = text.toLowerCase().indexOf("portland");
      return {
        topKeys: Object.keys(json),
        size: text.length,
        portlandFound: portlandIdx >= 0,
        portlandContext: portlandIdx >= 0 ? text.slice(Math.max(0, portlandIdx - 50), portlandIdx + 150) : null,
      };
    })
  );

  // Try NCAA teams list
  tests.push(
    tryFetch("ncaaTeams", "https://ncaa-api.henrygd.me/teams/baseball/d1", (text) => {
      const json = JSON.parse(text);
      const portlandIdx = text.toLowerCase().indexOf("portland");
      return {
        topKeys: Object.keys(json),
        size: text.length,
        portlandFound: portlandIdx >= 0,
        portlandContext: portlandIdx >= 0 ? text.slice(Math.max(0, portlandIdx - 50), portlandIdx + 200) : null,
      };
    })
  );

  // Try NCAA game-by-game results
  tests.push(
    tryFetch("ncaaGameByGame", "https://ncaa-api.henrygd.me/stats/baseball/d1/current/team/298", (text) => {
      const json = JSON.parse(text);
      const portlandIdx = text.toLowerCase().indexOf("portland");
      return {
        topKeys: Object.keys(json),
        dataCount: (json.data || []).length,
        sampleData: (json.data || []).slice(0, 2),
        portlandFound: portlandIdx >= 0,
        portlandContext: portlandIdx >= 0 ? text.slice(Math.max(0, portlandIdx - 50), portlandIdx + 200) : null,
      };
    })
  );

  // Try NCAA W-L stats (different stat IDs)
  for (const statId of [339, 341, 343, 221]) {
    tests.push(
      tryFetch(`ncaaStats_${statId}`, `https://ncaa-api.henrygd.me/stats/baseball/d1/current/team/${statId}`, (text) => {
        const json = JSON.parse(text);
        const portlandIdx = text.toLowerCase().indexOf("portland");
        return {
          status: "ok",
          title: json.title || json.statTitle || null,
          dataCount: (json.data || []).length,
          sampleData: (json.data || []).slice(0, 2),
          portlandFound: portlandIdx >= 0,
          portlandContext: portlandIdx >= 0 ? text.slice(Math.max(0, portlandIdx - 50), portlandIdx + 200) : null,
        };
      })
    );
  }

  await Promise.all(tests);

  return NextResponse.json(results);
}
