/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Shared ESPN college baseball helpers.
 *
 * ESPN's team search API often ignores the `search` parameter and returns ALL
 * ~434 teams alphabetically.  This causes ambiguous school names ("Texas",
 * "Pacific", "Portland", …) to resolve to the wrong team.
 *
 * This module provides:
 *  1. A curated map of school-name → ESPN baseball team-ID for every name that
 *     is ambiguous or uses an abbreviation ESPN doesn't recognise.
 *  2. A `resolveEspnTeam` helper that tries the map first, then falls back to
 *     progressively-looser name matching on the search results.
 */

// ---------------------------------------------------------------------------
// 1.  ESPN college-baseball team-ID map
//     Keys are EXACTLY the `name` values stored in schools.json (case-sensitive
//     match is done via toLowerCase()).
//     IDs come from the ESPN college-baseball API, NOT the general NCAA/logo IDs.
// ---------------------------------------------------------------------------

export const ESPN_TEAM_IDS: Record<string, number> = {
  // ── State-name schools (where "X" is a prefix of "X State", "X Tech" etc.) ──
  "Alabama": 148,
  "Alabama A&M": 317,
  "Alabama State": 318,
  "Arizona": 60,
  "Arizona State": 59,
  "Arkansas": 58,
  "Arkansas State": 320,
  "Arkansas-Pine Bluff": 321,
  "Auburn": 55,
  "Auburn Montgomery": 55,   // same campus athletics
  "California": 65,
  "California Baptist": 1105,
  "Charleston": 118,
  "Charleston Southern": 329,
  "Connecticut": 69,
  "Delaware": 339,
  "Delaware State": 340,
  "Florida": 75,
  "Florida A&M": 353,
  "Florida Atlantic": 163,
  "Florida Gulf Coast": 291,
  "Florida International": 164,
  "Florida Southern": 1274,
  "Florida State": 72,
  "Georgia": 78,
  "Georgia Southern": 138,
  "Georgia State": 358,
  "Georgia Tech": 77,
  "Houston": 124,
  "Houston Christian": 367,
  "Illinois": 153,
  "Illinois State": 288,
  "Indiana": 294,
  "Indiana State": 308,
  "Iowa": 167,
  "Iowa State": 373,
  "Jacksonville": 139,
  "Jacksonville State": 73,
  "Kansas": 168,
  "Kansas State": 264,
  "Kentucky": 82,
  "Louisiana": 144,
  "Louisiana Tech": 173,
  "Louisiana-Monroe": 272,
  "LSU": 85,
  "Maryland": 87,
  "Maryland Eastern Shore": 385,
  "Massachusetts": 386,
  "Michigan": 89,
  "Michigan State": 88,
  "Minnesota": 90,
  "Mississippi State": 150,
  "Missouri": 91,
  "Missouri State": 197,
  "Nebraska": 99,
  "New Mexico": 104,
  "New Mexico State": 103,
  "North Carolina": 96,
  "North Texas": 404,
  "Northwestern": 411,
  "Northwestern State": 186,
  "Ohio": 109,
  "Ohio State": 108,
  "Oklahoma": 112,
  "Oklahoma State": 110,
  "Ole Miss": 92,
  "Oregon": 273,
  "Oregon State": 113,
  "Pacific": 413,
  "Pacific Lutheran": 129700,
  "Penn": 415,
  "Penn State": 414,
  "Portland": 416,
  "Purdue": 189,
  "Rutgers": 102,
  "San Diego": 143,
  "San Diego State": 62,
  "San Francisco": 267,
  "South Alabama": 57,
  "South Carolina": 193,
  "South Florida": 76,
  "Southern": 194,
  "Southern Illinois": 432,
  "Southern Indiana": 1246,
  "Southern Miss": 192,
  "Tennessee": 199,
  "Tennessee State": 440,
  "Tennessee Tech": 441,
  "Texas": 126,
  "Texas A&M": 123,
  "Texas A&M-Corpus Christi": 443,
  "Texas Southern": 200,
  "Texas State": 147,
  "Texas Tech": 201,
  "USC": 68,
  "Utah": 128,
  "Utah Tech": 1146,
  "Utah Valley": 455,
  "Virginia": 131,
  "Virginia Tech": 132,
  "Washington": 133,
  "Washington State": 134,

  // ── Abbreviated / alternate names ESPN doesn't use in displayName ──
  "FAU": 163,           // Florida Atlantic Owls
  "FIU": 164,           // Florida International Panthers
  "LIU": 379,           // Long Island University Sharks
  "LMU": 174,           // Loyola Marymount Lions
  "ETSU": 304,          // East Tennessee State Buccaneers
  "UTRGV": 932,         // UT Rio Grande Valley Vaqueros
  "UTSA": 297,          // UTSA Roadrunners
  "Cal State LA": 129760, // Cal State Los Angeles Golden Eagles
  "SE Missouri State": 191, // Southeast Missouri State Redhawks
  "SE Oklahoma State": 842, // SW Oklahoma State — placeholder; correct if ESPN has it
  "Southeastern Louisiana": 309, // SE Louisiana Lions

  // ── Parenthetical qualifiers ──
  "Miami (FL)": 176,    // Miami Hurricanes
  "Miami (OH)": 107,    // Miami (OH) RedHawks

  // ── Hawai'i variants (okina mismatch) ──
  "Hawai'i": 79,
  "Hawaii Hilo": 847,
  "Hawaii Pacific": 832,

  // ── Other D1 schools that might need help ──
  "Army": 151,
  "Navy": 179,
  "Air Force": 155,
  "BYU": 127,
  "TCU": 198,
  "SMU": 433,
  "UCF": 160,
  "UCLA": 66,
  "UNLV": 182,
  "UMBC": 450,
  "UIC": 80,
  "VCU": 204,
  "VMI": 459,
  "UAB": 447,
  "NJIT": 395,
  "UMass Lowell": 449,
  "UNC Wilmington": 152,
  "UNC Greensboro": 181,
  "UNC Asheville": 452,
  "SIU Edwardsville": 429,
  "UT Arlington": 125,
  "UT Martin": 442,
  "Oral Roberts": 111,
  "Incarnate Word": 371,
  "Appalachian State": 271,
  "Coastal Carolina": 146,
  "Long Beach State": 141,
  "Cal Poly": 61,
  "Cal State Fullerton": 165,
  "Cal State Northridge": 185,
  "Cal State Bakersfield": 327,
  "UC Irvine": 142,
  "UC Davis": 448,
  "UC Riverside": 67,
  "UC Santa Barbara": 290,
  "UC San Diego": 1147,
  "Fresno State": 137,
  "San Jose State": 63,
  "Pepperdine": 187,
  "Gonzaga": 287,
  "Sacramento State": 314,
  "Stony Brook": 196,
  "Kennesaw State": 307,
  "Belmont": 262,
  "Evansville": 149,
  "Dallas Baptist": 263,
  "Wichita State": 206,
  "Wright State": 270,
  "Creighton": 98,
  "Seton Hall": 268,
  "Vanderbilt": 120,
  "Wake Forest": 97,
  "Clemson": 117,
  "Duke": 93,
  "NC State": 95,
  "Notre Dame": 81,
  "Boston College": 86,
  "Pittsburgh": 115,
  "Louisville": 83,
  "Rice": 122,
  "Baylor": 121,
  "West Virginia": 136,
  "Stanford": 64,
  "Tulane": 203,
  "Old Dominion": 140,
  "Liberty": 172,
  "Elon": 303,
  "East Carolina": 94,
  "Memphis": 119,
  "Cincinnati": 161,
  "Stetson": 74,
  "Mercer": 295,
};

// ---------------------------------------------------------------------------
// 2.  Resolve helper
// ---------------------------------------------------------------------------

/** Unwrap `{team: {…}}` wrapper that ESPN sometimes uses. */
export function normalize(entry: any): any {
  return entry?.team || entry;
}

/**
 * Given a school name (from our DB) and the raw ESPN search-result array,
 * return the best-matching team object (already normalized).
 *
 * Priority:
 *  1. Known ESPN ID (from the map above) — returns `{ id }` stub so the
 *     caller can fetch `/teams/{id}` directly.
 *  2. Exact displayName match.
 *  3. Exact location match (e.g. "Texas" → team with location "Texas").
 *  4. Exact shortDisplayName match.
 *  5. displayName starts with schoolName + " ".
 *  6. displayName includes schoolName.
 *  7. First result (fallback).
 */
export function resolveEspnTeam(
  school: string,
  teams: any[],
): any {
  const schoolLower = school.toLowerCase();

  // 1.  Check the curated map first
  const knownId = ESPN_TEAM_IDS[school] ?? ESPN_TEAM_IDS[schoolLower];
  if (knownId) {
    // If the team list contains this ID, return the full object.
    const byId = teams.find((e) => String(normalize(e).id) === String(knownId));
    if (byId) return normalize(byId);
    // Otherwise return a stub so the caller can fetch by ID.
    return { id: knownId, displayName: school, _stub: true };
  }

  // 2–7.  Progressive name matching on the search results
  const match = (fn: (t: any) => boolean) =>
    teams.find((e: any) => fn(normalize(e)));

  return normalize(
    match((t) => t.displayName?.toLowerCase() === schoolLower) ||
    match((t) => t.location?.toLowerCase() === schoolLower) ||
    match((t) => t.shortDisplayName?.toLowerCase() === schoolLower) ||
    match((t) => t.displayName?.toLowerCase().startsWith(schoolLower + " ")) ||
    match((t) => t.displayName?.toLowerCase().includes(schoolLower)) ||
    teams[0],
  );
}

// ---------------------------------------------------------------------------
// 3.  Name-match validator
// ---------------------------------------------------------------------------

/**
 * Check whether an ESPN team object plausibly matches our school name.
 * Used to detect when a curated ESPN ID maps to the wrong team.
 */
export function teamNameMatches(school: string, espnTeam: any): boolean {
  const s = school.toLowerCase().trim();
  const dn = (espnTeam?.displayName || "").toLowerCase();
  const sdn = (espnTeam?.shortDisplayName || "").toLowerCase();
  const loc = (espnTeam?.location || "").toLowerCase();

  if (dn === s || sdn === s || loc === s) return true;
  if (dn.startsWith(s + " ") || dn.includes(s)) return true;
  if (loc.startsWith(s + " ") || loc.includes(s)) return true;

  // Handle parenthetical qualifiers: "Miami (FL)" → "Miami"
  const base = s.replace(/\s*\(.*\)/, "").trim();
  if (base !== s) {
    if (dn.startsWith(base + " ") || loc === base) return true;
  }

  return false;
}

// ---------------------------------------------------------------------------
// 4.  Season helper
// ---------------------------------------------------------------------------

/** Return the current college-baseball season year. */
export function currentSeason(): number {
  return new Date().getFullYear();
}
