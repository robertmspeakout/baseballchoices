import { NextResponse } from "next/server";

/* eslint-disable @typescript-eslint/no-explicit-any */

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET() {
  const results: any = { timestamp: new Date().toISOString() };

  const tryFetch = async (label: string, url: string) => {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "baseballchoices/1.0" },
        signal: AbortSignal.timeout(15000),
      });
      const info: any = { url, status: res.status, ok: res.ok };
      if (res.ok) {
        const text = await res.text();
        info.size = text.length;
        info.isJson = text.startsWith("{") || text.startsWith("[");
        info.isHtml = text.includes("<html") || text.includes("<table");
        // Show first 2000 chars for inspection
        info.preview = text.slice(0, 2000);

        // If JSON, try to parse and look for Portland
        if (info.isJson) {
          try {
            const json = JSON.parse(text);
            info.topKeys = Object.keys(json);

            // Search entire JSON string for "portland" (case insensitive)
            const portlandIdx = text.toLowerCase().indexOf("portland");
            if (portlandIdx >= 0) {
              info.portlandFound = true;
              info.portlandContext = text.slice(Math.max(0, portlandIdx - 100), portlandIdx + 200);
            } else {
              info.portlandFound = false;
            }
          } catch { /* not valid json */ }
        }

        // If HTML, search for Portland
        if (info.isHtml) {
          const portlandIdx = text.toLowerCase().indexOf("portland");
          if (portlandIdx >= 0) {
            info.portlandFound = true;
            info.portlandContext = text.slice(Math.max(0, portlandIdx - 200), portlandIdx + 300);
          } else {
            info.portlandFound = false;
          }
        }
      }
      results[label] = info;
    } catch (err: any) {
      results[label] = { url, error: err?.message || String(err) };
    }
  };

  // Test all potential sources
  await Promise.all([
    tryFetch("ncaaApi_baseball", "https://ncaa-api.henrygd.me/standings/baseball/d1"),
    tryFetch("ncaaApi_baseballMen", "https://ncaa-api.henrygd.me/standings/baseball-men/d1"),
    tryFetch("ncaaApi_scoreboard", "https://ncaa-api.henrygd.me/scoreboard/baseball/d1"),
    tryFetch("ncaaWebsite", "https://www.ncaa.com/standings/baseball/d1"),
    tryFetch("warrennolan", "https://www.warrennolan.com/baseball/2026/team-record"),
    tryFetch("warrennolan2", "https://www.warrennolan.com/baseball/2025/team-record"),
    tryFetch("espnScoreboard", "https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/scoreboard"),
    tryFetch("espnPortland2501", "https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/teams/2501/schedule?season=2026"),
  ]);

  return NextResponse.json(results);
}
