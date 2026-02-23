import { NextRequest, NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

/* eslint-disable @typescript-eslint/no-explicit-any */

export const dynamic = "force-dynamic";

const SCORECARD_KEY = process.env.COLLEGE_SCORECARD_API_KEY || "DEMO_KEY";
const NCAA_APR_CSV_URL =
  "https://ncaaorg.s3.amazonaws.com/research/academics/2020RES_APR2019PubDataShare.csv";

// In-memory cache for scorecard results (24h TTL)
const scorecardCache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000;

// In-memory cache for the full APR dataset (loaded once)
let aprCache: Map<string, AprEntry> | null = null;
let aprLoadPromise: Promise<Map<string, AprEntry>> | null = null;

interface AprEntry {
  school_name: string;
  apr: number;
  year: string;
}

// ─── Main handler ───────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const school = request.nextUrl.searchParams.get("school") || "";
  const state = request.nextUrl.searchParams.get("state") || "";

  if (!school) {
    return NextResponse.json({ scorecard: null, apr: null });
  }

  // Fetch both in parallel
  const [scorecard, apr] = await Promise.all([
    fetchScorecard(school, state),
    lookupApr(school),
  ]);

  return NextResponse.json({ scorecard, apr });
}

// ─── College Scorecard API ──────────────────────────────────────
const SCORECARD_FIELDS = [
  "school.name",
  "school.city",
  "school.state",
  "id",
  "latest.student.size",
  "latest.student.demographics.student_faculty_ratio",
  "latest.cost.tuition.in_state",
  "latest.cost.tuition.out_of_state",
  "latest.cost.avg_net_price.overall",
  "latest.cost.avg_net_price.public",
  "latest.cost.avg_net_price.private",
  "latest.aid.pell_grant_rate",
  "latest.aid.federal_loan_rate",
  "latest.admissions.sat_scores.25th_percentile.critical_reading",
  "latest.admissions.sat_scores.75th_percentile.critical_reading",
  "latest.admissions.sat_scores.25th_percentile.math",
  "latest.admissions.sat_scores.75th_percentile.math",
  "latest.admissions.act_scores.25th_percentile.cumulative",
  "latest.admissions.act_scores.75th_percentile.cumulative",
].join(",");

async function fetchScorecard(school: string, state: string) {
  const cacheKey = `${school}|${state}`.toLowerCase();
  const cached = scorecardCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.data;
  }

  try {
    // Build search URL — use school.search for fuzzy matching, state to narrow results
    const params = new URLSearchParams({
      "school.search": school,
      _per_page: "5",
      fields: SCORECARD_FIELDS,
      api_key: SCORECARD_KEY,
    });
    if (state) {
      params.set("school.state", state);
    }

    const url = `https://api.data.gov/ed/collegescorecard/v1/schools?${params}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;

    const data = await res.json();
    const results = data?.results || [];
    if (results.length === 0) return null;

    // Pick the best match — prefer name containing our search term, largest enrollment
    const normalizedSearch = school.toLowerCase();
    const bestMatch =
      results.find(
        (r: any) =>
          r["school.name"]?.toLowerCase().includes(normalizedSearch)
      ) ||
      results.sort(
        (a: any, b: any) =>
          (b["latest.student.size"] || 0) - (a["latest.student.size"] || 0)
      )[0];

    if (!bestMatch) return null;

    // Extract and reshape the data
    const sat25Reading =
      bestMatch["latest.admissions.sat_scores.25th_percentile.critical_reading"];
    const sat75Reading =
      bestMatch["latest.admissions.sat_scores.75th_percentile.critical_reading"];
    const sat25Math =
      bestMatch["latest.admissions.sat_scores.25th_percentile.math"];
    const sat75Math =
      bestMatch["latest.admissions.sat_scores.75th_percentile.math"];

    // Composite SAT = reading + math percentiles
    const sat25 =
      sat25Reading != null && sat25Math != null
        ? sat25Reading + sat25Math
        : null;
    const sat75 =
      sat75Reading != null && sat75Math != null
        ? sat75Reading + sat75Math
        : null;

    // For "average financial aid", compute from net price
    // avg_net_price = cost of attendance - average grants/scholarships received
    // We show the net price directly since that's what a family would actually pay
    const netPricePublic = bestMatch["latest.cost.avg_net_price.public"];
    const netPricePrivate = bestMatch["latest.cost.avg_net_price.private"];
    const netPriceOverall = bestMatch["latest.cost.avg_net_price.overall"];
    const avgNetPrice = netPriceOverall ?? netPricePublic ?? netPricePrivate;

    // For "% receiving financial aid", combine Pell + federal loan rates
    // Pell grants are need-based federal grants, federal loan rate is broader
    const pellRate = bestMatch["latest.aid.pell_grant_rate"];
    const loanRate = bestMatch["latest.aid.federal_loan_rate"];
    // Use the higher of the two as a conservative "% receiving any aid" estimate
    const aidPercentage =
      pellRate != null || loanRate != null
        ? Math.max(pellRate ?? 0, loanRate ?? 0)
        : null;

    const result = {
      matched_name: bestMatch["school.name"],
      student_faculty_ratio:
        bestMatch["latest.student.demographics.student_faculty_ratio"] ?? null,
      in_state_tuition: bestMatch["latest.cost.tuition.in_state"] ?? null,
      out_of_state_tuition: bestMatch["latest.cost.tuition.out_of_state"] ?? null,
      avg_net_price: avgNetPrice ?? null,
      aid_percentage: aidPercentage != null ? Math.round(aidPercentage * 100) : null,
      sat_25: sat25,
      sat_75: sat75,
      act_25: bestMatch["latest.admissions.act_scores.25th_percentile.cumulative"] ?? null,
      act_75: bestMatch["latest.admissions.act_scores.75th_percentile.cumulative"] ?? null,
    };

    scorecardCache.set(cacheKey, { data: result, ts: Date.now() });
    return result;
  } catch {
    return null;
  }
}

// ─── NCAA Baseball APR Lookup ───────────────────────────────────
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function loadLocalAprData(): Map<string, AprEntry> | null {
  try {
    const localPath = join(process.cwd(), "src", "data", "baseball-apr.json");
    if (!existsSync(localPath)) return null;
    const raw = readFileSync(localPath, "utf-8");
    const data = JSON.parse(raw) as Record<string, { school_name: string; apr: number; year: string }>;
    const map = new Map<string, AprEntry>();
    for (const entry of Object.values(data)) {
      if (entry.school_name && entry.apr) {
        map.set(entry.school_name.toLowerCase(), {
          school_name: entry.school_name,
          apr: entry.apr,
          year: entry.year || "2024",
        });
      }
    }
    return map.size > 0 ? map : null;
  } catch {
    return null;
  }
}

async function loadAprData(): Promise<Map<string, AprEntry>> {
  if (aprCache) return aprCache;
  if (aprLoadPromise) return aprLoadPromise;

  aprLoadPromise = (async () => {
    // Try local JSON file first (updated APR data)
    const localData = loadLocalAprData();
    if (localData) {
      aprCache = localData;
      aprLoadPromise = null;
      return localData;
    }

    // Fall back to NCAA S3 CSV (2019 data)
    const map = new Map<string, AprEntry>();
    try {
      const res = await fetch(NCAA_APR_CSV_URL, {
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) return map;

      const csv = await res.text();
      const lines = csv.split("\n");
      const headers = lines[0]
        .split(",")
        .map((h) => h.trim().replace(/"/g, ""));

      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length < 10) continue;

        const row: Record<string, string> = {};
        headers.forEach((h, idx) => (row[h] = values[idx]));

        // Baseball = SPORT_CODE 1
        if (row.SPORT_CODE === "1") {
          const name = row.SCL_NAME;
          const apr = parseInt(row.MULTIYR_APR_RATE_1000_OFFICIAL);
          if (name && !isNaN(apr)) {
            map.set(name.toLowerCase(), {
              school_name: name,
              apr,
              year: row.ACADEMIC_YEAR || "2019",
            });
          }
        }
      }
    } catch {
      // If fetch fails, return empty map — APR will show "Not reported"
    }
    aprCache = map;
    aprLoadPromise = null;
    return map;
  })();

  return aprLoadPromise;
}

async function lookupApr(school: string): Promise<AprEntry | null> {
  const data = await loadAprData();
  if (data.size === 0) return null;

  const normalized = school.toLowerCase();

  // Try exact match first
  if (data.has(normalized)) return data.get(normalized)!;

  // Try common name variations
  const variations = [
    `university of ${normalized}`,
    `${normalized} university`,
    `the university of ${normalized}`,
    normalized.replace("&", "and"),
    normalized.replace(" and ", " & "),
  ];

  for (const v of variations) {
    if (data.has(v)) return data.get(v)!;
  }

  // Fuzzy: find entries where the school name contains our search
  for (const [key, entry] of data.entries()) {
    if (
      key.includes(normalized) ||
      normalized.includes(key.replace("university of ", "").replace(" university", ""))
    ) {
      return entry;
    }
  }

  return null;
}
