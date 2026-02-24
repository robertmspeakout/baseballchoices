import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Read JSON once at module load time (server-side only)
let draftPicksData: Record<string, any[]> | null = null;

function getDraftPicks(): Record<string, any[]> {
  if (!draftPicksData) {
    const filePath = join(process.cwd(), "src/data/draft-picks.json");
    draftPicksData = JSON.parse(readFileSync(filePath, "utf-8"));
  }
  return draftPicksData!;
}

export async function GET(request: NextRequest) {
  const school = request.nextUrl.searchParams.get("school") || "";

  if (!school) {
    return NextResponse.json({ picks: [] });
  }

  const allPicks = getDraftPicks();
  const picks = allPicks[school] || [];

  return NextResponse.json({ picks });
}
