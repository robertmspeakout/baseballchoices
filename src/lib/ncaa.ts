/**
 * Bulk standings fetcher — replaces ESPN's broken per-team API.
 *
 * Two sources, tried in order:
 *  1. ESPN STANDINGS endpoint (bulk — one request, all ~300 D1 teams, JSON,
 *     uses the same ESPN team IDs we already maintain).  This is a completely
 *     different endpoint from the per-team schedule/teams API that is broken.
 *  2. NCAA API (ncaa-api.henrygd.me) — free open-source wrapper around
 *     ncaa.com standings data.  Fallback if ESPN standings is down.
 *
 * Both are cached in memory for 10 minutes so individual school lookups
 * are essentially free after the first call.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { ESPN_TEAM_IDS } from "@/lib/espn";

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------
let cachedRecords: Record<string, string> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// ---------------------------------------------------------------------------
// Name normalisation
// ---------------------------------------------------------------------------
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s*\(.*?\)/g, "")        // "Miami (FL)" → "Miami"
    .replace(/['']/g, "'")
    .replace(/[^a-z0-9&' -]/g, "")
    .trim();
}

// ---------------------------------------------------------------------------
// Source 1: ESPN Standings (bulk)
// ---------------------------------------------------------------------------
const ESPN_STANDINGS_URL =
  "https://site.api.espn.com/apis/v2/sports/baseball/college-baseball/standings";

/**
 * Build a reverse map from ESPN team ID → our school name so we can key
 * records by school name when ESPN returns data keyed by team ID.
 */
function buildIdToSchoolMap(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const [school, id] of Object.entries(ESPN_TEAM_IDS)) {
    map[String(id)] = school;
  }
  return map;
}

async function fetchEspnStandings(): Promise<Record<string, string> | null> {
  try {
    const res = await fetch(ESPN_STANDINGS_URL, {
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      console.warn(`[standings] ESPN standings failed: ${res.status}`);
      return null;
    }
    const json = await res.json();

    const records: Record<string, string> = {};
    const idToSchool = buildIdToSchoolMap();

    // ESPN standings structure:
    // { children: [ { name: "Conference", standings: { entries: [ { team: {...}, stats: [...] } ] } } ] }
    const conferences: any[] = json.children || [];
    for (const conf of conferences) {
      const entries: any[] = conf.standings?.entries || [];
      for (const entry of entries) {
        const team = entry.team || {};
        const teamId = String(team.id || "");
        const displayName = team.displayName || "";
        const location = team.location || "";

        // Extract overall record from stats array
        let record: string | null = null;
        const stats: any[] = entry.stats || [];
        for (const stat of stats) {
          if (stat.name === "overall" || stat.type === "total") {
            record = stat.displayValue || stat.summary || null;
            if (record) break;
          }
        }
        // Sometimes the record is in a different format
        if (!record) {
          const wins = stats.find((s: any) => s.name === "wins" || s.abbreviation === "W");
          const losses = stats.find((s: any) => s.name === "losses" || s.abbreviation === "L");
          if (wins && losses) {
            record = `${wins.value || wins.displayValue}-${losses.value || losses.displayValue}`;
          }
        }

        if (!record) continue;

        // Store under multiple keys for flexible lookups
        if (teamId) records[`espn_id:${teamId}`] = record;
        if (displayName) {
          records[normalizeName(displayName)] = record;
          records[displayName.toLowerCase().trim()] = record;
        }
        if (location) {
          records[normalizeName(location)] = record;
          records[location.toLowerCase().trim()] = record;
        }
        // Map ESPN ID back to our school name
        if (teamId && idToSchool[teamId]) {
          records[normalizeName(idToSchool[teamId])] = record;
          records[idToSchool[teamId].toLowerCase().trim()] = record;
        }
      }
    }

    if (Object.keys(records).length > 10) {
      console.log(`[standings] ESPN standings: ${Object.keys(records).length} entries`);
      return records;
    }
    console.warn(`[standings] ESPN standings returned too few records: ${Object.keys(records).length}`);
    return null;
  } catch (err: any) {
    console.warn(`[standings] ESPN standings error: ${err?.message || err}`);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Source 2: NCAA API (fallback)
// ---------------------------------------------------------------------------
const NCAA_API_BASE = "https://ncaa-api.henrygd.me";

async function fetchNcaaStandings(): Promise<Record<string, string> | null> {
  try {
    const res = await fetch(`${NCAA_API_BASE}/standings/baseball/d1`, {
      headers: { "User-Agent": "baseballchoices/1.0" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      console.warn(`[standings] NCAA API failed: ${res.status}`);
      return null;
    }
    const json = await res.json();
    const data: any[] = json.data || json || [];

    const records: Record<string, string> = {};
    for (const group of data) {
      const standings: any[] = group.standings || group.data || [];
      for (const team of standings) {
        const school = team["School"] || team["school"] || "";
        const overallW = team["Overall W"] || team["W"] || "";
        const overallL = team["Overall L"] || team["L"] || "";

        if (school && overallW !== "" && overallL !== "") {
          const record = `${overallW}-${overallL}`;
          records[normalizeName(school)] = record;
          records[school.toLowerCase().trim()] = record;
        }
      }
    }

    if (Object.keys(records).length > 10) {
      console.log(`[standings] NCAA API: ${Object.keys(records).length} entries`);
      return records;
    }
    console.warn(`[standings] NCAA API returned too few records: ${Object.keys(records).length}`);
    return null;
  } catch (err: any) {
    console.warn(`[standings] NCAA API error: ${err?.message || err}`);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch all D1 baseball records. Tries ESPN standings first, then NCAA API.
 * Results are cached in memory for 10 minutes.
 */
export async function fetchNcaaRecords(): Promise<Record<string, string>> {
  const now = Date.now();
  if (cachedRecords && (now - cacheTimestamp) < CACHE_TTL_MS) {
    return cachedRecords;
  }

  // Try ESPN standings (bulk endpoint) first
  let records = await fetchEspnStandings();

  // Fall back to NCAA API
  if (!records) {
    records = await fetchNcaaStandings();
  }

  if (records && Object.keys(records).length > 0) {
    cachedRecords = records;
    cacheTimestamp = now;
    return records;
  }

  return cachedRecords || {};
}

/**
 * Look up a single school's record.
 */
export async function getNcaaRecord(schoolName: string): Promise<string | null> {
  const records = await fetchNcaaRecords();
  if (Object.keys(records).length === 0) return null;

  const normalized = normalizeName(schoolName);
  const lower = schoolName.toLowerCase().trim();

  // Direct match
  if (records[normalized]) return records[normalized];
  if (records[lower]) return records[lower];

  // Try matching by ESPN ID (if school is in our curated map)
  const espnId = ESPN_TEAM_IDS[schoolName];
  if (espnId && records[`espn_id:${String(espnId)}`]) {
    return records[`espn_id:${String(espnId)}`];
  }

  // Common abbreviation expansions
  const abbreviations: Record<string, string> = {
    "usc": "southern california",
    "lsu": "lsu",
    "ucf": "ucf",
    "tcu": "tcu",
    "smu": "smu",
    "byu": "brigham young",
    "ole miss": "ole miss",
    "fau": "florida atlantic",
    "fiu": "florida international",
    "liu": "long island",
    "lmu": "loyola marymount",
    "vcu": "virginia commonwealth",
    "uab": "uab",
    "utsa": "ut san antonio",
    "etsu": "east tennessee state",
  };
  const abbr = abbreviations[lower];
  if (abbr && records[abbr]) return records[abbr];

  // Substring match
  for (const [key, value] of Object.entries(records)) {
    if (key.startsWith("espn_id:")) continue; // skip ID keys
    if (key.includes(normalized) || normalized.includes(key)) {
      return value;
    }
  }

  return null;
}
