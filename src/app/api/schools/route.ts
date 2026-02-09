import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(request: NextRequest) {
  const db = getDb();
  const url = request.nextUrl;

  const search = url.searchParams.get("search") || "";
  const division = url.searchParams.get("division") || "";
  const state = url.searchParams.get("state") || "";
  const conference = url.searchParams.get("conference") || "";
  const publicPrivate = url.searchParams.get("publicPrivate") || "";
  const sortBy = url.searchParams.get("sortBy") || "name";
  const sortDir = url.searchParams.get("sortDir") || "asc";
  const priorityOnly = url.searchParams.get("priorityOnly") === "true";
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "50");
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (search) {
    conditions.push(
      "(s.name LIKE ? OR s.city LIKE ? OR s.state LIKE ? OR s.conference LIKE ? OR s.head_coach_name LIKE ? OR s.mascot LIKE ?)"
    );
    const term = `%${search}%`;
    params.push(term, term, term, term, term, term);
  }

  if (division) {
    conditions.push("s.division = ?");
    params.push(division);
  }

  if (state) {
    conditions.push("s.state = ?");
    params.push(state);
  }

  if (conference) {
    conditions.push("s.conference = ?");
    params.push(conference);
  }

  if (publicPrivate) {
    conditions.push("s.public_private = ?");
    params.push(publicPrivate);
  }

  if (priorityOnly) {
    conditions.push("COALESCE(u.priority, 0) > 0");
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // Validate sort column
  const allowedSorts: Record<string, string> = {
    name: "s.name",
    state: "s.state",
    division: "s.division",
    conference: "s.conference",
    ranking: "s.current_ranking",
    tuition: "s.tuition",
    priority: "COALESCE(u.priority, 0)",
    last_contacted: "u.last_contacted",
  };
  const sortColumn = allowedSorts[sortBy] || "s.name";
  const direction = sortDir === "desc" ? "DESC" : "ASC";

  // Handle nulls in sorting - put nulls last
  const nullsHandling =
    sortBy === "ranking"
      ? `CASE WHEN s.current_ranking IS NULL THEN 1 ELSE 0 END, `
      : sortBy === "priority"
      ? ""
      : sortBy === "last_contacted"
      ? `CASE WHEN u.last_contacted IS NULL THEN 1 ELSE 0 END, `
      : "";

  const countRow = db
    .prepare(
      `SELECT COUNT(*) as total FROM schools s LEFT JOIN user_school_data u ON s.id = u.school_id ${where}`
    )
    .get(...params) as { total: number };

  const rows = db
    .prepare(
      `SELECT s.*, COALESCE(u.priority, 0) as priority, COALESCE(u.notes, '') as notes, u.last_contacted
       FROM schools s
       LEFT JOIN user_school_data u ON s.id = u.school_id
       ${where}
       ORDER BY ${nullsHandling}${sortColumn} ${direction}
       LIMIT ? OFFSET ?`
    )
    .all(...params, limit, offset);

  return NextResponse.json({
    schools: rows,
    total: countRow.total,
    page,
    totalPages: Math.ceil(countRow.total / limit),
  });
}
