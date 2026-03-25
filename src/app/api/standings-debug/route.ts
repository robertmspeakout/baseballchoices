import { NextResponse } from "next/server";

/* eslint-disable @typescript-eslint/no-explicit-any */

export const dynamic = "force-dynamic";

const ESPN_STANDINGS_URL =
  "https://site.api.espn.com/apis/v2/sports/baseball/college-baseball/standings";
const NCAA_API_URL = "https://ncaa-api.henrygd.me/standings/baseball/d1";

export async function GET() {
  const results: any = { timestamp: new Date().toISOString() };

  // Test 1: ESPN Standings bulk endpoint
  try {
    const res = await fetch(ESPN_STANDINGS_URL, { signal: AbortSignal.timeout(15000) });
    results.espnStandings = {
      status: res.status,
      ok: res.ok,
    };
    if (res.ok) {
      const json = await res.json();
      const topKeys = Object.keys(json);
      const children = json.children || [];
      results.espnStandings.topKeys = topKeys;
      results.espnStandings.conferenceCount = children.length;
      // Show first conference + first few teams as sample
      if (children.length > 0) {
        const firstConf = children[0];
        const entries = firstConf.standings?.entries || [];
        results.espnStandings.firstConference = firstConf.name || firstConf.abbreviation || "?";
        results.espnStandings.firstConfTeamCount = entries.length;
        results.espnStandings.sampleTeams = entries.slice(0, 3).map((e: any) => ({
          id: e.team?.id,
          displayName: e.team?.displayName,
          location: e.team?.location,
          stats: e.stats?.slice(0, 5).map((s: any) => ({ name: s.name, displayValue: s.displayValue, value: s.value })),
        }));
      }
      // Search for Portland specifically
      for (const conf of children) {
        for (const entry of (conf.standings?.entries || [])) {
          const dn = (entry.team?.displayName || "").toLowerCase();
          const loc = (entry.team?.location || "").toLowerCase();
          if (dn.includes("portland") || loc.includes("portland")) {
            results.espnStandings.portlandMatch = {
              conference: conf.name,
              id: entry.team?.id,
              displayName: entry.team?.displayName,
              stats: entry.stats?.map((s: any) => ({ name: s.name, displayValue: s.displayValue })),
            };
          }
        }
      }
    }
  } catch (err: any) {
    results.espnStandings = { error: err?.message || String(err) };
  }

  // Test 2: NCAA API
  try {
    const res = await fetch(NCAA_API_URL, {
      headers: { "User-Agent": "baseballchoices/1.0" },
      signal: AbortSignal.timeout(15000),
    });
    results.ncaaApi = {
      status: res.status,
      ok: res.ok,
    };
    if (res.ok) {
      const json = await res.json();
      const topKeys = Object.keys(json);
      const data = json.data || json || [];
      results.ncaaApi.topKeys = topKeys;
      results.ncaaApi.groupCount = Array.isArray(data) ? data.length : "not array";
      // Show first group as sample
      if (Array.isArray(data) && data.length > 0) {
        const first = data[0];
        results.ncaaApi.firstGroup = {
          conference: first.conference || first.name || "?",
          keys: Object.keys(first),
          teamCount: (first.standings || first.data || []).length,
          sampleTeams: (first.standings || first.data || []).slice(0, 3),
        };
      }
      // Search for Portland
      for (const group of (Array.isArray(data) ? data : [])) {
        for (const team of (group.standings || group.data || [])) {
          const school = (team["School"] || team["school"] || "").toLowerCase();
          if (school.includes("portland")) {
            results.ncaaApi.portlandMatch = team;
          }
        }
      }
    }
  } catch (err: any) {
    results.ncaaApi = { error: err?.message || String(err) };
  }

  return NextResponse.json(results);
}
