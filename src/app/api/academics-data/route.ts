import { NextRequest, NextResponse } from "next/server";

/* eslint-disable @typescript-eslint/no-explicit-any */

export const dynamic = "force-dynamic";

const SCORECARD_KEY = process.env.COLLEGE_SCORECARD_API_KEY || "DEMO_KEY";

// In-memory cache (24h TTL)
const scorecardCache = new Map<string, { data: any; ts: number }>();
const programsCache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000;

// ─── Main handler ───────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const school = request.nextUrl.searchParams.get("school") || "";
  const state = request.nextUrl.searchParams.get("state") || "";
  const city = request.nextUrl.searchParams.get("city") || "";

  if (!school) {
    return NextResponse.json({ scorecard: null, programs: [] });
  }

  const scorecardResult = await fetchScorecard(school, state, city);
  const scorecard = scorecardResult?.scorecard ?? null;
  const scorecardId = scorecardResult?.id ?? null;

  // Fetch programs using the school's Scorecard ID (separate call)
  const programs = scorecardId ? await fetchPrograms(scorecardId) : [];

  return NextResponse.json({ scorecard, programs });
}

// ─── College Scorecard API — school data ────────────────────────
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

// Generate name variations for ambiguous short school names
function getNameVariations(name: string): string[] {
  const variations: string[] = [name];
  // Only try variations if the name looks short/ambiguous (single word or two words)
  const wordCount = name.trim().split(/\s+/).length;
  if (wordCount <= 2) {
    variations.push(`University of ${name}`);
    variations.push(`${name} University`);
    variations.push(`${name} State University`);
    variations.push(`${name} College`);
  }
  return variations;
}

async function fetchScorecard(school: string, state: string, city: string) {
  const cacheKey = `${school}|${state}|${city}`.toLowerCase();
  const cached = scorecardCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.data;
  }

  try {
    const variations = getNameVariations(school);

    for (const searchName of variations) {
      const result = await tryScorecardSearch(searchName, state, city, school);
      if (result) {
        scorecardCache.set(cacheKey, { data: result, ts: Date.now() });
        return result;
      }
    }

    return null;
  } catch {
    return null;
  }
}

async function tryScorecardSearch(
  searchName: string,
  state: string,
  city: string,
  originalName: string
) {
  const params = new URLSearchParams({
    "school.search": searchName,
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

  // Score each result for best match
  const normalizedSearch = originalName.toLowerCase();
  const normalizedCity = city.toLowerCase();

  const scored = results.map((r: any) => {
    const rName = (r["school.name"] || "").toLowerCase();
    const rCity = (r["school.city"] || "").toLowerCase();
    let score = 0;

    // Strong bonus: name contains the original search term
    if (rName.includes(normalizedSearch)) score += 10;
    // Bonus: city matches
    if (normalizedCity && rCity === normalizedCity) score += 5;
    // Smaller bonus: larger student body (more likely a university vs community college)
    score += Math.min((r["latest.student.size"] || 0) / 10000, 3);
    // Bonus: has tuition data (filters out non-degree-granting institutions)
    if (r["latest.cost.tuition.in_state"] || r["latest.cost.tuition.out_of_state"]) score += 2;

    return { result: r, score };
  });

  scored.sort((a: any, b: any) => b.score - a.score);
  const bestMatch = scored[0]?.result;
  if (!bestMatch) return null;

  // Require at least a name or city match to avoid garbage results
  const bestName = (bestMatch["school.name"] || "").toLowerCase();
  const bestCity = (bestMatch["school.city"] || "").toLowerCase();
  if (!bestName.includes(normalizedSearch) && !(normalizedCity && bestCity === normalizedCity)) {
    return null;
  }

  return buildScorecardResult(bestMatch);
}

function buildScorecardResult(bestMatch: any) {
  const sat25Reading =
    bestMatch["latest.admissions.sat_scores.25th_percentile.critical_reading"];
  const sat75Reading =
    bestMatch["latest.admissions.sat_scores.75th_percentile.critical_reading"];
  const sat25Math =
    bestMatch["latest.admissions.sat_scores.25th_percentile.math"];
  const sat75Math =
    bestMatch["latest.admissions.sat_scores.75th_percentile.math"];

  const sat25 =
    sat25Reading != null && sat25Math != null
      ? sat25Reading + sat25Math
      : null;
  const sat75 =
    sat75Reading != null && sat75Math != null
      ? sat75Reading + sat75Math
      : null;

  const netPricePublic = bestMatch["latest.cost.avg_net_price.public"];
  const netPricePrivate = bestMatch["latest.cost.avg_net_price.private"];
  const netPriceOverall = bestMatch["latest.cost.avg_net_price.overall"];
  const avgNetPrice = netPriceOverall ?? netPricePublic ?? netPricePrivate;

  const pellRate = bestMatch["latest.aid.pell_grant_rate"];
  const loanRate = bestMatch["latest.aid.federal_loan_rate"];
  const aidPercentage =
    pellRate != null || loanRate != null
      ? Math.max(pellRate ?? 0, loanRate ?? 0)
      : null;

  const scorecard = {
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

  return { scorecard, id: bestMatch["id"] };
}

// ─── College Scorecard API — programs/majors ────────────────────
async function fetchPrograms(scorecardId: number): Promise<{ title: string; code: string }[]> {
  const cacheKey = `programs-${scorecardId}`;
  const cached = programsCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.data;
  }

  try {
    // Fetch the specific school by ID with only program data
    const params = new URLSearchParams({
      id: String(scorecardId),
      fields: "latest.programs.cip_4_digit",
      api_key: SCORECARD_KEY,
    });

    const url = `https://api.data.gov/ed/collegescorecard/v1/schools?${params}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return [];

    const data = await res.json();
    const results = data?.results || [];
    if (results.length === 0) return [];

    const rawPrograms: any[] = results[0]?.["latest.programs.cip_4_digit"] || [];
    const seenTitles = new Set<string>();
    const programs: { title: string; code: string }[] = [];

    for (const prog of rawPrograms) {
      const title = prog?.title;
      const code = prog?.code;
      const level = prog?.credential?.level;
      // Level 3 = Bachelor's degree; include all if no level info
      if (title && !seenTitles.has(title) && (level === 3 || level == null)) {
        seenTitles.add(title);
        programs.push({ title, code: code || "" });
      }
    }

    programs.sort((a, b) => a.title.localeCompare(b.title));
    programsCache.set(cacheKey, { data: programs, ts: Date.now() });
    return programs;
  } catch {
    return [];
  }
}
