import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();

  const row = db
    .prepare(
      `SELECT s.*, COALESCE(u.priority, 0) as priority, COALESCE(u.notes, '') as notes, u.last_contacted
       FROM schools s
       LEFT JOIN user_school_data u ON s.id = u.school_id
       WHERE s.id = ?`
    )
    .get(parseInt(id));

  if (!row) {
    return NextResponse.json({ error: "School not found" }, { status: 404 });
  }

  return NextResponse.json(row);
}
