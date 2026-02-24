#!/usr/bin/env node
/**
 * D3 School Data Enrichment Script
 *
 * Fills gaps in existing D3 baseball school entries:
 * 1. College Scorecard API (data.ed.gov) — enrollment, acceptance/graduation rates (100% missing)
 * 2. ESPN logo lookup — logos for the 142 schools still missing them
 * 3. Mailing address generation from existing city/state data
 *
 * Usage:
 *   node scripts/enrich-d3-data.js
 *
 * Options:
 *   SCORECARD_KEY=<your-key>  Use a real API key (get free at https://api.data.gov/signup/)
 *                             DEMO_KEY works but is limited to 30 req/hr
 *   RESUME=true               Resume from where it left off (reads progress file)
 *   SKIP_SCORECARD=true       Skip College Scorecard lookups
 *   SKIP_ESPN=true            Skip ESPN logo lookups
 */

const fs = require("fs");
const path = require("path");
const https = require("https");

const SCHOOLS_PATH = path.join(__dirname, "..", "src", "data", "schools.json");
const PROGRESS_PATH = path.join(__dirname, "..", ".d3-enrich-progress.json");
const SCORECARD_KEY = process.env.SCORECARD_KEY || "DEMO_KEY";
const RESUME = process.env.RESUME === "true";

// ─── Helpers ────────────────────────────────────────────────────
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function fetchJSON(url, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      headers: { "User-Agent": "ExtraBase-Enrichment/1.0" },
    };
    const req = https.get(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data: null });
        }
      });
    });
    req.on("error", reject);
    req.setTimeout(timeout, () => {
      req.destroy();
      reject(new Error("timeout"));
    });
  });
}

// ─── College Scorecard API ──────────────────────────────────────
const SCORECARD_FIELDS = [
  "school.name",
  "school.city",
  "school.state",
  "school.zip",
  "id",
  "location.lat",
  "location.lon",
  "latest.student.size",
  "latest.cost.tuition.in_state",
  "latest.cost.tuition.out_of_state",
  "latest.admissions.admission_rate.overall",
  "latest.completion.rate_suppressed.overall",
].join(",");

async function fetchScorecard(name, city, state) {
  try {
    const params = new URLSearchParams({
      "school.search": name,
      _per_page: "5",
      fields: SCORECARD_FIELDS,
      api_key: SCORECARD_KEY,
    });
    if (state) params.set("school.state", state);

    const url = `https://api.data.gov/ed/collegescorecard/v1/schools?${params}`;
    const { status, data } = await fetchJSON(url);

    if (status === 429) {
      console.log("    Rate limited, waiting 60s...");
      await sleep(60000);
      return fetchScorecard(name, city, state);
    }
    if (status !== 200 || !data?.results?.length) return null;

    // Pick best match
    const norm = name.toLowerCase();
    const results = data.results;
    const match =
      results.find((r) => {
        const rn = (r["school.name"] || "").toLowerCase();
        return rn.includes(norm) || norm.includes(rn.replace(/ university| college/g, "").trim());
      }) ||
      results.find((r) =>
        (r["school.city"] || "").toLowerCase() === (city || "").toLowerCase()
      ) ||
      results[0];

    const admRate = match["latest.admissions.admission_rate.overall"];
    const gradRate = match["latest.completion.rate_suppressed.overall"];

    return {
      matched_name: match["school.name"],
      enrollment: match["latest.student.size"] ?? null,
      acceptance_rate: admRate != null ? Math.round(admRate * 100) : null,
      graduation_rate: gradRate != null ? Math.round(gradRate * 100) : null,
    };
  } catch (err) {
    console.log(`    Scorecard error: ${err.message}`);
    return null;
  }
}

// ─── ESPN Logo Lookup ───────────────────────────────────────────
async function findESPNLogo(schoolName) {
  try {
    const searchUrl = `https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/teams?limit=50&search=${encodeURIComponent(schoolName)}`;
    const { status, data } = await fetchJSON(searchUrl);

    if (status !== 200 || !data?.sports?.[0]?.leagues?.[0]?.teams?.length) {
      return await findESPNLogoFallback(schoolName);
    }

    const teams = data.sports[0].leagues[0].teams;
    const norm = schoolName.toLowerCase();
    const team =
      teams.find((t) => {
        const tn = (t.team?.displayName || t.team?.name || "").toLowerCase();
        return tn.includes(norm) || norm.includes(tn.replace(/ university| college/g, "").trim());
      }) || teams[0];

    if (team?.team?.id) {
      return `https://a.espncdn.com/i/teamlogos/ncaa/500/${team.team.id}.png`;
    }
    return null;
  } catch {
    return await findESPNLogoFallback(schoolName);
  }
}

async function findESPNLogoFallback(schoolName) {
  try {
    const url = `https://site.web.api.espn.com/apis/common/v3/search?query=${encodeURIComponent(schoolName + " baseball")}&limit=5&type=team`;
    const { status, data } = await fetchJSON(url);
    if (status !== 200) return null;

    const items = data?.items || data?.results || [];
    for (const item of items) {
      if (item?.id || item?.uid) {
        const id = item.id || item.uid?.split(":").pop();
        if (id) {
          return `https://a.espncdn.com/i/teamlogos/ncaa/500/${id}.png`;
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Main enrichment ────────────────────────────────────────────
async function main() {
  const schools = JSON.parse(fs.readFileSync(SCHOOLS_PATH, "utf8"));
  const d3Schools = schools.filter((s) => s.division === "D3");

  // Stats before
  const missingLogo = d3Schools.filter((s) => !s.logo_url).length;
  const missingEnrollment = d3Schools.filter((s) => !s.enrollment).length;
  const missingAccRate = d3Schools.filter((s) => !s.acceptance_rate).length;
  const missingMailing = d3Schools.filter((s) => !s.mailing_address).length;

  console.log(`\nD3 School Enrichment`);
  console.log(`Found ${d3Schools.length} D3 schools`);
  console.log(`  Missing logos: ${missingLogo}`);
  console.log(`  Missing enrollment: ${missingEnrollment}`);
  console.log(`  Missing acceptance rate: ${missingAccRate}`);
  console.log(`  Missing mailing address: ${missingMailing}`);
  console.log(`Using API key: ${SCORECARD_KEY === "DEMO_KEY" ? "DEMO_KEY (30 req/hr — get a free key at https://api.data.gov/signup/)" : "Custom key"}\n`);

  // Load progress if resuming
  let progress = {};
  if (RESUME && fs.existsSync(PROGRESS_PATH)) {
    progress = JSON.parse(fs.readFileSync(PROGRESS_PATH, "utf8"));
    console.log(`Resuming from previous run (${Object.keys(progress).length} schools already done)\n`);
  }

  let enriched = 0;
  let skipped = 0;
  let scorecardHits = 0;
  let logoHits = 0;

  for (let i = 0; i < d3Schools.length; i++) {
    const school = d3Schools[i];
    const idx = schools.findIndex((s) => s.id === school.id);

    if (progress[school.id]) {
      skipped++;
      continue;
    }

    // Determine what this school still needs
    const needsScorecard = !school.enrollment || !school.acceptance_rate || !school.graduation_rate;
    const needsLogo = !school.logo_url;
    const needsMailing = !school.mailing_address;

    // Skip if already complete
    if (!needsScorecard && !needsLogo && !needsMailing) {
      progress[school.id] = true;
      skipped++;
      continue;
    }

    console.log(`[${i + 1}/${d3Schools.length}] ${school.name} (${school.city}, ${school.state})`);

    // 1. College Scorecard — enrollment, acceptance rate, graduation rate
    if (needsScorecard && process.env.SKIP_SCORECARD !== "true") {
      const sc = await fetchScorecard(school.name, school.city, school.state);
      if (sc) {
        console.log(`  ✓ Scorecard: ${sc.matched_name} — enrollment ${sc.enrollment}, acceptance ${sc.acceptance_rate}%`);
        if (sc.enrollment != null && !school.enrollment) schools[idx].enrollment = sc.enrollment;
        if (sc.acceptance_rate != null && !school.acceptance_rate) schools[idx].acceptance_rate = sc.acceptance_rate;
        if (sc.graduation_rate != null && !school.graduation_rate) schools[idx].graduation_rate = sc.graduation_rate;
        scorecardHits++;
      } else {
        console.log(`  ✗ Scorecard: no match found`);
      }
      await sleep(SCORECARD_KEY === "DEMO_KEY" ? 2500 : 500);
    }

    // 2. ESPN Logo — only for schools missing logos
    if (needsLogo && process.env.SKIP_ESPN !== "true") {
      const logo = await findESPNLogo(school.name);
      if (logo) {
        schools[idx].logo_url = logo;
        console.log(`  ✓ ESPN logo found`);
        logoHits++;
      } else {
        console.log(`  ✗ ESPN logo not found`);
      }
      await sleep(300);
    }

    // 3. Generate mailing address from existing data
    if (needsMailing && school.city && school.state) {
      schools[idx].mailing_address = `${school.name} Baseball, Athletic Department, ${school.city}, ${school.state}`;
      console.log(`  ✓ Generated mailing address`);
    }

    enriched++;
    progress[school.id] = true;

    // Save progress every 10 schools
    if (enriched % 10 === 0) {
      fs.writeFileSync(SCHOOLS_PATH, JSON.stringify(schools, null, 2));
      fs.writeFileSync(PROGRESS_PATH, JSON.stringify(progress));
      console.log(`  [Saved progress — ${enriched} enriched so far]\n`);
    }
  }

  // Final save
  fs.writeFileSync(SCHOOLS_PATH, JSON.stringify(schools, null, 2));
  if (fs.existsSync(PROGRESS_PATH)) fs.unlinkSync(PROGRESS_PATH);

  // Stats after
  const afterNoLogo = schools.filter((s) => s.division === "D3" && !s.logo_url).length;
  const afterNoEnroll = schools.filter((s) => s.division === "D3" && !s.enrollment).length;
  const afterNoAcc = schools.filter((s) => s.division === "D3" && !s.acceptance_rate).length;

  console.log(`\n${"=".repeat(50)}`);
  console.log(`Done!`);
  console.log(`  Enriched: ${enriched}`);
  console.log(`  Skipped (already done/complete): ${skipped}`);
  console.log(`  Scorecard hits: ${scorecardHits}`);
  console.log(`  Logo hits: ${logoHits}`);
  console.log(`\nRemaining gaps:`);
  console.log(`  Still missing logos: ${afterNoLogo} (was ${missingLogo})`);
  console.log(`  Still missing enrollment: ${afterNoEnroll} (was ${missingEnrollment})`);
  console.log(`  Still missing acceptance rate: ${afterNoAcc} (was ${missingAccRate})`);
  console.log(`\nSchools data saved to ${SCHOOLS_PATH}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
