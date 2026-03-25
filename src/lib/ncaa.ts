/**
 * NCAA standings data fetcher.
 *
 * Uses the free ncaa-api (https://github.com/henrygd/ncaa-api) to fetch
 * current-season records for all D1 baseball teams.  This is far more
 * reliable than ESPN's per-team API, which frequently returns stale or
 * wrong records.
 *
 * The public instance at ncaa-api.henrygd.me is rate-limited to 5 req/s.
 * We fetch ALL conferences in a single call and cache the result in memory
 * so individual school lookups are essentially free.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

const NCAA_API_BASE = "https://ncaa-api.henrygd.me";

// In-memory cache: refreshed at most once every 10 minutes
let cachedRecords: Record<string, string> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Normalize a school name for fuzzy matching.
 * Strips common suffixes, parentheticals, punctuation, and lowercases.
 */
function normalizeSchoolName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s*\(.*?\)/g, "")        // Remove parentheticals: "Miami (FL)" → "Miami"
    .replace(/['']/g, "'")              // Normalize apostrophes
    .replace(/[^a-z0-9&' -]/g, "")     // Strip other punctuation
    .trim();
}

/**
 * Build a lookup map from NCAA standings data.
 * Keys are normalized school names, values are "W-L" strings.
 */
function buildRecordMap(data: any[]): Record<string, string> {
  const records: Record<string, string> = {};

  for (const group of data) {
    const standings: any[] = group.standings || group.data || [];
    for (const team of standings) {
      const school = team["School"] || team["school"] || "";
      const overallW = team["Overall W"] || team["W"] || "";
      const overallL = team["Overall L"] || team["L"] || "";

      if (school && overallW !== "" && overallL !== "") {
        const record = `${overallW}-${overallL}`;
        // Store under multiple keys for matching flexibility
        records[normalizeSchoolName(school)] = record;
        // Also store the raw name lowercased
        records[school.toLowerCase().trim()] = record;
      }
    }
  }

  return records;
}

/**
 * Fetch all D1 baseball standings from NCAA and return a name→record map.
 * Returns cached data if available and fresh.
 */
export async function fetchNcaaRecords(): Promise<Record<string, string>> {
  const now = Date.now();
  if (cachedRecords && (now - cacheTimestamp) < CACHE_TTL_MS) {
    return cachedRecords;
  }

  try {
    const url = `${NCAA_API_BASE}/standings/baseball/d1`;
    const res = await fetch(url, {
      headers: { "User-Agent": "baseballchoices/1.0" },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      console.warn(`[ncaa] Standings fetch failed: ${res.status}`);
      return cachedRecords || {};
    }

    const json = await res.json();
    const data: any[] = json.data || json || [];

    const records = buildRecordMap(data);
    if (Object.keys(records).length > 0) {
      cachedRecords = records;
      cacheTimestamp = now;
      console.log(`[ncaa] Cached ${Object.keys(records).length} team records`);
    }

    return records;
  } catch (err: any) {
    console.warn(`[ncaa] Standings fetch error: ${err?.message || err}`);
    return cachedRecords || {};
  }
}

/**
 * Look up a single school's record from NCAA data.
 * Tries several name variations to find a match.
 */
export async function getNcaaRecord(schoolName: string): Promise<string | null> {
  const records = await fetchNcaaRecords();
  if (Object.keys(records).length === 0) return null;

  const normalized = normalizeSchoolName(schoolName);
  const lower = schoolName.toLowerCase().trim();

  // Direct match
  if (records[normalized]) return records[normalized];
  if (records[lower]) return records[lower];

  // Try common abbreviation expansions
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

  // Substring match: find first key that contains our name or vice versa
  for (const [key, value] of Object.entries(records)) {
    if (key.includes(normalized) || normalized.includes(key)) {
      return value;
    }
  }

  return null;
}
