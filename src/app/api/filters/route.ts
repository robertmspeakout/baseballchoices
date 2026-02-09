import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = getDb();

  const states = db
    .prepare("SELECT DISTINCT state FROM schools WHERE state IS NOT NULL ORDER BY state")
    .all() as { state: string }[];

  const conferences = db
    .prepare("SELECT DISTINCT conference FROM schools WHERE conference IS NOT NULL ORDER BY conference")
    .all() as { conference: string }[];

  const divisions = db
    .prepare("SELECT DISTINCT division FROM schools ORDER BY division")
    .all() as { division: string }[];

  return NextResponse.json({
    states: states.map((r) => r.state),
    conferences: conferences.map((r) => r.conference),
    divisions: divisions.map((r) => r.division),
  });
}
