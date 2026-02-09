import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  const { schoolId } = await params;
  const db = getDb();
  const body = await request.json();
  const id = parseInt(schoolId);

  // Check school exists
  const school = db.prepare("SELECT id FROM schools WHERE id = ?").get(id);
  if (!school) {
    return NextResponse.json({ error: "School not found" }, { status: 404 });
  }

  const { priority, notes, last_contacted } = body;

  // Upsert user data
  db.prepare(
    `INSERT INTO user_school_data (school_id, priority, notes, last_contacted, updated_at)
     VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(school_id) DO UPDATE SET
       priority = COALESCE(excluded.priority, priority),
       notes = COALESCE(excluded.notes, notes),
       last_contacted = COALESCE(excluded.last_contacted, last_contacted),
       updated_at = CURRENT_TIMESTAMP`
  ).run(id, priority ?? 0, notes ?? "", last_contacted ?? null);

  const updated = db
    .prepare(
      `SELECT s.*, COALESCE(u.priority, 0) as priority, COALESCE(u.notes, '') as notes, u.last_contacted
       FROM schools s
       LEFT JOIN user_school_data u ON s.id = u.school_id
       WHERE s.id = ?`
    )
    .get(id);

  return NextResponse.json(updated);
}
