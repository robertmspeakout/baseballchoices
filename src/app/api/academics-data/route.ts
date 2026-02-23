import { NextRequest, NextResponse } from "next/server";

/* eslint-disable @typescript-eslint/no-explicit-any */

export const dynamic = "force-dynamic";

const SCORECARD_KEY = process.env.COLLEGE_SCORECARD_API_KEY || "DEMO_KEY";

// In-memory cache for scorecard results (24h TTL)
const scorecardCache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000;

// ─── Main handler ───────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const school = request.nextUrl.searchParams.get("school") || "";
  const state = request.nextUrl.searchParams.get("state") || "";

  if (!school) {
    return NextResponse.json({ scorecard: null, programs: [] });
  }

  const result = await fetchScorecard(school, state);

  return NextResponse.json({
    scorecard: result?.scorecard ?? null,
    programs: result?.programs ?? [],
  });
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
  "latest.programs.cip_4_digit",
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
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
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
    const netPricePublic = bestMatch["latest.cost.avg_net_price.public"];
    const netPricePrivate = bestMatch["latest.cost.avg_net_price.private"];
    const netPriceOverall = bestMatch["latest.cost.avg_net_price.overall"];
    const avgNetPrice = netPriceOverall ?? netPricePublic ?? netPricePrivate;

    // For "% receiving financial aid", combine Pell + federal loan rates
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

    // Extract programs — deduplicate by title, only Bachelor's degrees (level 3)
    const rawPrograms: any[] = bestMatch["latest.programs.cip_4_digit"] || [];
    const seenTitles = new Set<string>();
    const programs: { title: string; code: string }[] = [];

    for (const prog of rawPrograms) {
      const title = prog?.title;
      const code = prog?.code;
      const level = prog?.credential?.level;
      // Level 3 = Bachelor's degree; include all if no level data
      if (title && !seenTitles.has(title) && (level === 3 || level == null)) {
        seenTitles.add(title);
        programs.push({ title, code: code || "" });
      }
    }

    programs.sort((a, b) => a.title.localeCompare(b.title));

    const result = { scorecard, programs };
    scorecardCache.set(cacheKey, { data: result, ts: Date.now() });
    return result;
  } catch {
    return null;
  }
}
