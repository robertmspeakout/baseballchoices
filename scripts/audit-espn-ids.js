#!/usr/bin/env node

/**
 * Audit & Fix ESPN College Baseball Team IDs
 *
 * Verifies every entry in ESPN_TEAM_IDS (src/lib/espn.ts) against the ESPN
 * college baseball API, and can automatically fix mismatches.
 *
 * Usage:
 *   node scripts/audit-espn-ids.js                    # Audit curated map
 *   node scripts/audit-espn-ids.js --all              # Also audit non-mapped D1 schools
 *   node scripts/audit-espn-ids.js --school "Portland"  # Check one school
 *   node scripts/audit-espn-ids.js --fix              # Show corrected entries
 *   node scripts/audit-espn-ids.js --apply            # Auto-update espn.ts with fixes
 *   node scripts/audit-espn-ids.js --generate         # Generate complete map for ALL D1 schools
 *   node scripts/audit-espn-ids.js --dump             # Dump all ESPN teams to /tmp/espn_baseball_teams.json
 */

const fs = require("fs");
const path = require("path");

const BASE =
  "https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball";
const ESPN_TS_PATH = path.join(__dirname, "..", "src", "lib", "espn.ts");

// ── Parse the ESPN_TEAM_IDS map from espn.ts ────────────────────────────────
function parseEspnTeamIds() {
  const content = fs.readFileSync(ESPN_TS_PATH, "utf-8");
  const match = content.match(
    /export const ESPN_TEAM_IDS[^{]*\{([\s\S]*?)\n\};/
  );
  if (!match) throw new Error("Could not parse ESPN_TEAM_IDS from espn.ts");

  const map = {};
  const lineRegex = /["']([^"']+)["']\s*:\s*(\d+)/g;
  let m;
  while ((m = lineRegex.exec(match[1])) !== null) {
    map[m[1]] = parseInt(m[2], 10);
  }
  return map;
}

// ── Load schools.json ───────────────────────────────────────────────────────
function loadSchools() {
  const schoolsPath = path.join(
    __dirname, "..", "src", "data", "schools.json"
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

  if (dn === s || sdn === s || loc === s) return true;
  if (dn.startsWith(s + " ") || dn.includes(s)) return true;
  if (loc === s) return true;

  // Handle parenthetical qualifiers: "Miami (FL)" → "Miami Hurricanes"
  const baseSchool = s.replace(/\s*\(.*\)/, "").trim();
  if (baseSchool !== s) {
    if (dn.startsWith(baseSchool + " ") || loc === baseSchool) return true;
  }

  return false;
}

// ── Find the best ESPN team for a school name ──────────────────────────────
function findBestMatch(schoolName, allTeams) {
  const s = schoolName.toLowerCase().trim();

  const filters = [
    // Exact location match
    (t) => t.location.toLowerCase() === s,
    // Exact displayName match
    (t) => t.displayName.toLowerCase() === s,
    // Exact shortDisplayName match
    (t) => t.shortDisplayName.toLowerCase() === s,
    // Location starts with
    (t) => t.location.toLowerCase().startsWith(s + " "),
    // displayName starts with
    (t) => t.displayName.toLowerCase().startsWith(s + " "),
    // displayName includes
    (t) => t.displayName.toLowerCase().includes(s),
  ];

  for (const fn of filters) {
    const matches = allTeams.filter(fn);
    if (matches.length === 1) return matches[0];
  }

  // If exact location matches exist but multiple, return them as ambiguous
  const byLocation = allTeams.filter(
    (t) => t.location.toLowerCase() === s
  );
  if (byLocation.length > 0) {
    return { _ambiguous: true, candidates: byLocation };
  }

  const byDnPrefix = allTeams.filter(
    (t) => t.displayName.toLowerCase().startsWith(s + " ")
  );
  if (byDnPrefix.length > 0) {
    return { _ambiguous: true, candidates: byDnPrefix };
  }

  return null;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Apply corrections to espn.ts ────────────────────────────────────────────
function applyCorrections(corrections, allTeamsByIdMap) {
  let content = fs.readFileSync(ESPN_TS_PATH, "utf-8");

  for (const [school, newId] of Object.entries(corrections)) {
    // Match the line with this school name and replace the ID
    const escaped = school.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(
      `(["']${escaped}["']\\s*:\\s*)\\d+`,
      "g"
    );
    const replaced = content.replace(regex, `$1${newId}`);
    if (replaced !== content) {
      content = replaced;
      const team = allTeamsByIdMap.get(newId);
      console.log(
        `  Updated "${school}": → ${newId} (${team?.displayName || "?"})`
      );
    } else {
      console.log(`  Could not find "${school}" in espn.ts to update`);
    }
  }

  fs.writeFileSync(ESPN_TS_PATH, content, "utf-8");
  console.log(`\nWrote updates to ${ESPN_TS_PATH}`);
}

// ── Generate complete map ───────────────────────────────────────────────────
function generateCompleteMap(schools, allTeams, allTeamsByIdMap) {
  const d1Schools = schools.filter((s) => s.division === "D1");
  const existingMap = parseEspnTeamIds();

  console.log(`\nGenerating ESPN_TEAM_IDS for ${d1Schools.length} D1 schools...\n`);

  const newMap = {};
  const unmatchable = [];

  for (const school of d1Schools) {
    // If existing map entry is correct, keep it
    const existingId = existingMap[school.name];
    if (existingId) {
      const team = allTeamsByIdMap.get(existingId);
      if (team && nameMatches(school.name, team)) {
        newMap[school.name] = existingId;
        continue;
      }
    }

    // Find best match from ESPN
    const best = findBestMatch(school.name, allTeams);
    if (best && !best._ambiguous) {
      newMap[school.name] = best.id;
    } else if (best?._ambiguous) {
      // If ambiguous, keep existing if we have one, otherwise flag
      if (existingId) {
        newMap[school.name] = existingId;
        console.log(
          `? ${school.name}: Ambiguous, keeping existing ID ${existingId} (candidates: ${best.candidates.map((c) => `${c.displayName}:${c.id}`).join(", ")})`
        );
      } else {
        unmatchable.push({
          name: school.name,
          candidates: best.candidates,
        });
      }
    } else {
      unmatchable.push({ name: school.name, candidates: [] });
    }
  }

  // Output the map
  console.log("\n// ── Generated ESPN_TEAM_IDS ──");
  console.log("export const ESPN_TEAM_IDS: Record<string, number> = {");
  const sorted = Object.entries(newMap).sort(([a], [b]) =>
    a.localeCompare(b)
  );
  for (const [name, id] of sorted) {
    const team = allTeamsByIdMap.get(id);
    const comment = team ? ` // ${team.displayName}` : "";
    console.log(`  "${name}": ${id},${comment}`);
  }
  console.log("};");

  if (unmatchable.length > 0) {
    console.log(`\n// ── Could not auto-match (${unmatchable.length}) ──`);
    for (const u of unmatchable) {
      if (u.candidates.length > 0) {
        console.log(
          `// "${u.name}": ???, // Candidates: ${u.candidates.map((c) => `${c.displayName}(${c.id})`).join(", ")}`
        );
      } else {
        console.log(`// "${u.name}": ???, // No ESPN match found`);
      }
    }
  }

  return { matched: sorted.length, unmatchable: unmatchable.length };
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const doAll = args.includes("--all");
  const doFix = args.includes("--fix");
  const doApply = args.includes("--apply");
  const doGenerate = args.includes("--generate");
  const doDump = args.includes("--dump");
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

  // Dump mode
  if (doDump) {
    const dumpPath = "/tmp/espn_baseball_teams.json";
    fs.writeFileSync(dumpPath, JSON.stringify(allTeams, null, 2));
    console.log(`Dumped ${allTeams.length} teams to ${dumpPath}`);
    return;
  }

  // Generate mode
  if (doGenerate) {
    const schools = loadSchools();
    const result = generateCompleteMap(schools, allTeams, byId);
    console.log(
      `\nGeneration complete: ${result.matched} matched, ${result.unmatchable} unmatchable`
    );
    return;
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
        console.log(
          `  ESPN returns:   ${espnTeam.displayName} (${espnTeam.location})`
        );
        console.log(
          `  Match: ${nameMatches(singleSchool, espnTeam) ? "YES ✓" : "NO ✗"}`
        );
      } else {
        console.log(`  Curated map ID: ${knownId}`);
        console.log(
          "  ESPN: ID not found in team list — verifying directly..."
        );
        const direct = await verifyTeamId(knownId);
        if (direct) {
          console.log(
            `  ESPN returns:   ${direct.displayName} (${direct.location})`
          );
          console.log(
            `  Match: ${nameMatches(singleSchool, direct) ? "YES ✓" : "NO ✗"}`
          );
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
        console.log(
          `    - ${c.displayName} (id=${c.id}, location=${c.location})`
        );
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
        console.log(
          `  → Suggested: ${best.displayName} (id=${best.id})`
        );
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
    console.log(
      `\n=== Auditing all ${d1Schools.length} D1 schools ===\n`
    );

    for (const school of d1Schools) {
      if (curatedMap[school.name]) continue;

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

  if ((doFix || doApply) && Object.keys(corrections).length > 0) {
    console.log(
      `\n=== ${doApply ? "Applying" : "Suggested"} corrections ===\n`
    );

    if (doApply) {
      applyCorrections(corrections, byId);
    } else {
      for (const [school, id] of Object.entries(corrections)) {
        const espnTeam = byId.get(id);
        const comment = espnTeam ? `// ${espnTeam.displayName}` : "";
        console.log(`  "${school}": ${id}, ${comment}`);
      }
    }
  } else if ((doFix || doApply) && Object.keys(corrections).length === 0) {
    console.log("\nNo corrections needed — all entries are correct!");
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
