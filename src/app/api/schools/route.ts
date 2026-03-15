import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";
import { prisma } from "@/lib/prisma";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Read JSON once at module load time (server-side only)
let schoolsData: any[] | null = null;

function getSchools(): any[] {
  if (!schoolsData) {
    const filePath = join(process.cwd(), "src/data/schools.json");
    schoolsData = JSON.parse(readFileSync(filePath, "utf-8"));
  }
  return schoolsData!;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const page = Math.max(1, parseInt(params.get("page") || "1"));
  const pageSize = Math.min(200, Math.max(1, parseInt(params.get("pageSize") || "50")));
  const division = params.get("division") || "";
  const search = params.get("search") || "";
  const state = params.get("state") || "";
  const conference = params.get("conference") || "";
  const id = params.get("id") || "";

  const schools = getSchools();

  // Fetch live rankings from database
  let rankingsMap: Record<number, number> = {};
  try {
    const rankings = await prisma.schoolRanking.findMany();
    for (const r of rankings) {
      rankingsMap[r.schoolId] = r.ranking;
    }
  } catch {
    // If DB query fails, fall back to JSON rankings
  }

  // Merge rankings into school data
  const hasDbRankings = Object.keys(rankingsMap).length > 0;
  const mergedSchools = schools.map((s: any) => ({
    ...s,
    current_ranking: hasDbRankings ? (rankingsMap[s.id] ?? null) : s.current_ranking,
  }));

  // Single school lookup by ID
  if (id) {
    const school = mergedSchools.find((s: any) => s.id === parseInt(id));
    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }
    return NextResponse.json({ school });
  }

  // Filter
  let filtered = mergedSchools;

  if (division) {
    filtered = filtered.filter((s: any) => s.division === division);
  }
  if (state) {
    filtered = filtered.filter((s: any) => s.state === state);
  }
  if (conference) {
    filtered = filtered.filter((s: any) => s.conference === conference);
  }
  if (search) {
    const term = search.toLowerCase();
    filtered = filtered.filter((s: any) => {
      const searchable = [s.name, s.city, s.state, s.conference, s.head_coach_name, s.mascot]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return searchable.includes(term);
    });
  }

  // Paginate
  const total = filtered.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const paginated = filtered.slice(start, start + pageSize);

  return NextResponse.json({
    schools: paginated,
    pagination: { page, pageSize, total, totalPages },
  });
}
