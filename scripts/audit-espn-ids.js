#!/usr/bin/env node

/**
 * Audit ESPN College Baseball Team IDs
 *
 * This script verifies that every entry in ESPN_TEAM_IDS (in src/lib/espn.ts)
 * actually maps to the correct school by querying the ESPN college baseball API.
 *
 * It also checks ALL schools in schools.json to ensure they resolve to the right
 * team (whether via the curated map or ESPN search).
 *
 * Usage:
 *   node scripts/audit-espn-ids.js              # Audit curated map only
 *   node scripts/audit-espn-ids.js --all        # Audit all schools in schools.json
 *   node scripts/audit-espn-ids.js --fix        # Output corrected ESPN_TEAM_IDS map
 *   node scripts/audit-espn-ids.js --school "Portland"  # Check a single school
 */

const fs = require("fs");
const path = require("path");

const BASE =
  "https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball";

// ── Parse the ESPN_TEAM_IDS map from espn.ts ────────────────────────────────
function parseEspnTeamIds() {
  const espnTsPath = path.join(__dirname, "..", "src", "lib", "espn.ts");
  const content = fs.readFileSync(espnTsPath, "utf-8");

  // Extract the object literal from the file
  const match = content.match(
    /export const ESPN_TEAM_IDS[^{]*\{([\s\S]*?)\n\};/
  );
  if (!match) throw new Error("Could not parse ESPN_TEAM_IDS from espn.ts");

  const map = {};
  const lineRegex =
    /["']([^"']+)["']\s*:\s*(\d+)/g;
  let m;
  while ((m = lineRegex.exec(match[1])) !== null) {
    map[m[1]] = parseInt(m[2], 10);
  }
  return map;
}

// ── Load schools.json ───────────────────────────────────────────────────────
function loadSchools() {
  const schoolsPath = path.join(
    __dirname,
    "..",
    "src",
    "data",
    "schools.json"
  );
  return JSON.parse(fs.readFileSync(schoolsPath, "utf-8"));
}

// ── Fetch all ESPN college baseball teams ───────────────────────────────────
async function fetchAllEspnTeams() {
  const url = `${BASE}/teams?limit=500`;
  console.log(`Fetching all ESPN college baseball teams: ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`ESPN teams fetch failed: ${res.status}`);
  const data = await res.json();

  const teams = [];
  const sports = data?.sports || [];
  for (const sport of sports) {
    for (const league of sport.leagues || []) {
      for (const entry of league.teams || []) {
        const t = entry.team || entry;
        teams.push({
          id: Number(t.id),
          displayName: t.displayName || "",
          shortDisplayName: t.shortDisplayName || "",
          abbreviation: t.abbreviation || "",
          location: t.location || "",
          nickname: t.nickname || "",
        });
      }
    }
  }

  console.log(`Found ${teams.length} ESPN college baseball teams\n`);
  return teams;
}

// ── Verify a single team ID ────────────────────────────────────────────────
async function verifyTeamId(teamId) {
  const url = `${BASE}/teams/${teamId}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const t = data?.team || data;
    return {
      id: Number(t.id),
      displayName: t.displayName || "",
      shortDisplayName: t.shortDisplayName || "",
      location: t.location || "",
      abbreviation: t.abbreviation || "",
    };
  } catch {
    return null;
  }
}

// ── Fuzzy name match ───────────────────────────────────────────────────────
function nameMatches(schoolName, espnTeam) {
  const s = schoolName.toLowerCase().trim();
  const dn = (espnTeam.displayName || "").toLowerCase();
  const sdn = (espnTeam.shortDisplayName || "").toLowerCase();
  const loc = (espnTeam.location || "").toLowerCase();
  const nick = (espnTeam.nickname || "").toLowerCase();

  // Exact matches
  if (dn === s || sdn === s || loc === s) return true;

  // displayName starts with or contains school name
  if (dn.startsWith(s + " ") || dn.includes(s)) return true;

  // Location matches (e.g. "Portland" matches team with location "Portland")
  if (loc === s) return true;

  // Handle parenthetical qualifiers: "Miami (FL)" should match "Miami Hurricanes"
  const baseSchool = s.replace(/\s*\(.*\)/, "").trim();
  if (baseSchool !== s) {
    if (dn.startsWith(baseSchool + " ") || loc === baseSchool) return true;
  }

  return false;
}

// ── Find the best ESPN team for a school name ──────────────────────────────
function findBestMatch(schoolName, allTeams) {
  const s = schoolName.toLowerCase().trim();

  // Try exact location match first
  const byLocation = allTeams.filter(
    (t) => t.location.toLowerCase() === s
  );
  if (byLocation.length === 1) return byLocation[0];

  // Try displayName match
  const byDisplayName = allTeams.filter(
    (t) => t.displayName.toLowerCase() === s
  );
  if (byDisplayName.length === 1) return byDisplayName[0];

  // Try shortDisplayName
  const byShort = allTeams.filter(
    (t) => t.shortDisplayName.toLowerCase() === s
  );
  if (byShort.length === 1) return byShort[0];

  // Try location starts with
  const byLocPrefix = allTeams.filter(
    (t) => t.location.toLowerCase().startsWith(s)
  );
  if (byLocPrefix.length === 1) return byLocPrefix[0];

  // Try displayName starts with
  const byDnPrefix = allTeams.filter(
    (t) => t.displayName.toLowerCase().startsWith(s + " ")
  );
  if (byDnPrefix.length === 1) return byDnPrefix[0];

  // Try displayName includes
  const byIncludes = allTeams.filter(
    (t) => t.displayName.toLowerCase().includes(s)
  );
  if (byIncludes.length === 1) return byIncludes[0];

  // Multiple or no matches
  const candidates = byLocation.length > 0
    ? byLocation
    : byDnPrefix.length > 0
    ? byDnPrefix
    : byIncludes;
  return candidates.length > 0 ? { _ambiguous: true, candidates } : null;
}

// ── Throttle helper ────────────────────────────────────────────────────────
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const doAll = args.includes("--all");
  const doFix = args.includes("--fix");
  const singleIdx = args.indexOf("--school");
  const singleSchool = singleIdx >= 0 ? args[singleIdx + 1] : null;

  const curatedMap = parseEspnTeamIds();
  console.log(
    `Parsed ${Object.keys(curatedMap).length} entries from ESPN_TEAM_IDS\n`
  );

  // Fetch all ESPN teams
  let allTeams;
  try {
    allTeams = await fetchAllEspnTeams();
  } catch (err) {
    console.error("Failed to fetch ESPN teams:", err.message);
    console.error(
      "Make sure you can access the ESPN API from this environment."
    );
    process.exit(1);
  }

  // Build a lookup by ID
  const byId = new Map();
  for (const t of allTeams) {
    byId.set(t.id, t);
  }

  const mismatches = [];
  const correct = [];
  const notFound = [];
  const corrections = {};

  if (singleSchool) {
    // ── Single school mode ─────────────────────────────────────────
    console.log(`\nChecking: "${singleSchool}"\n`);

    const knownId = curatedMap[singleSchool];
    if (knownId) {
      const espnTeam = byId.get(knownId);
      if (espnTeam) {
        console.log(`  Curated map ID: ${knownId}`);
        console.log(`  ESPN returns:   ${espnTeam.displayName} (${espnTeam.location})`);
        console.log(`  Match: ${nameMatches(singleSchool, espnTeam) ? "YES ✓" : "NO ✗"}`);
      } else {
        console.log(`  Curated map ID: ${knownId}`);
        console.log("  ESPN: ID not found in team list — verifying directly...");
        const direct = await verifyTeamId(knownId);
        if (direct) {
          console.log(`  ESPN returns:   ${direct.displayName} (${direct.location})`);
          console.log(`  Match: ${nameMatches(singleSchool, direct) ? "YES ✓" : "NO ✗"}`);
        } else {
          console.log("  ESPN: Team ID does not exist");
        }
      }
    } else {
      console.log("  Not in curated map");
    }

    const best = findBestMatch(singleSchool, allTeams);
    if (best && !best._ambiguous) {
      console.log(
        `\n  Best ESPN match: ${best.displayName} (id=${best.id}, location=${best.location})`
      );
    } else if (best?._ambiguous) {
      console.log(`\n  Ambiguous matches:`);
      for (const c of best.candidates) {
        console.log(`    - ${c.displayName} (id=${c.id}, location=${c.location})`);
      }
    } else {
      console.log("\n  No ESPN match found");
    }
    return;
  }

  // ── Audit curated map ────────────────────────────────────────────
  console.log("=== Auditing curated ESPN_TEAM_IDS map ===\n");

  for (const [school, id] of Object.entries(curatedMap)) {
    const espnTeam = byId.get(id);

    if (!espnTeam) {
      // ID not in the bulk list; try direct fetch
      const direct = await verifyTeamId(id);
      await sleep(100);
      if (!direct) {
        console.log(`✗ ${school}: ID ${id} does not exist in ESPN`);
        notFound.push({ school, id });

        const best = findBestMatch(school, allTeams);
        if (best && !best._ambiguous) {
          console.log(
            `  → Suggested: ${best.displayName} (id=${best.id})`
          );
          corrections[school] = best.id;
        }
        continue;
      }

      if (!nameMatches(school, direct)) {
        console.log(
          `✗ ${school}: ID ${id} → "${direct.displayName}" (MISMATCH)`
        );
        mismatches.push({ school, id, actual: direct.displayName });

        const best = findBestMatch(school, allTeams);
        if (best && !best._ambiguous) {
          console.log(
            `  → Suggested: ${best.displayName} (id=${best.id})`
          );
          corrections[school] = best.id;
        }
      } else {
        correct.push(school);
      }
      continue;
    }

    if (!nameMatches(school, espnTeam)) {
      console.log(
        `✗ ${school}: ID ${id} → "${espnTeam.displayName}" (MISMATCH)`
      );
      mismatches.push({ school, id, actual: espnTeam.displayName });

      const best = findBestMatch(school, allTeams);
      if (best && !best._ambiguous) {
        console.log(`  → Suggested: ${best.displayName} (id=${best.id})`);
        corrections[school] = best.id;
      }
    } else {
      correct.push(school);
    }
  }

  // ── Audit all schools (optional) ─────────────────────────────────
  if (doAll) {
    const schools = loadSchools();
    const d1Schools = schools.filter((s) => s.division === "D1");
    console.log(`\n=== Auditing all ${d1Schools.length} D1 schools ===\n`);

    for (const school of d1Schools) {
      if (curatedMap[school.name]) continue; // Already audited above

      const best = findBestMatch(school.name, allTeams);
      if (!best) {
        console.log(`? ${school.name}: No ESPN match found`);
        notFound.push({ school: school.name, id: null });
      } else if (best._ambiguous) {
        console.log(
          `? ${school.name}: Ambiguous (${best.candidates.map((c) => `${c.displayName}:${c.id}`).join(", ")})`
        );
      }
    }
  }

  // ── Summary ──────────────────────────────────────────────────────
  console.log("\n=== Summary ===");
  console.log(`  Correct:    ${correct.length}`);
  console.log(`  Mismatches: ${mismatches.length}`);
  console.log(`  Not found:  ${notFound.length}`);

  if (mismatches.length > 0) {
    console.log("\nMismatched entries:");
    for (const m of mismatches) {
      const fix = corrections[m.school];
      console.log(
        `  "${m.school}": ${m.id} → "${m.actual}"${fix ? ` (fix: ${fix})` : ""}`
      );
    }
  }

  if (doFix && Object.keys(corrections).length > 0) {
    console.log("\n=== Corrected entries (copy to espn.ts) ===\n");
    for (const [school, id] of Object.entries(corrections)) {
      const espnTeam = byId.get(id);
      const comment = espnTeam
        ? `// ${espnTeam.displayName}`
        : "";
      console.log(`  "${school}": ${id}, ${comment}`);
    }
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
