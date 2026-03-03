import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { auth } from "@/lib/auth";

/* eslint-disable @typescript-eslint/no-explicit-any */

const SCHOOLS_PATH = path.join(process.cwd(), "src/data/schools.json");

async function requireOwner() {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized", status: 401 };
  if ((session.user as any).role !== "OWNER") return { error: "Forbidden", status: 403 };
  return null;
}

export async function GET() {
  const denied = await requireOwner();
  if (denied) return NextResponse.json({ error: denied.error }, { status: denied.status });

  const data = JSON.parse(fs.readFileSync(SCHOOLS_PATH, "utf8"));
  return NextResponse.json(data);
}

// Update a single school by id
export async function PUT(request: NextRequest) {
  const denied = await requireOwner();
  if (denied) return NextResponse.json({ error: denied.error }, { status: denied.status });

  try {
    const updated = await request.json();
    if (!updated || !updated.id) {
      return NextResponse.json({ error: "Missing school id" }, { status: 400 });
    }

    const data = JSON.parse(fs.readFileSync(SCHOOLS_PATH, "utf8"));
    const idx = data.findIndex((s: any) => s.id === updated.id);
    if (idx === -1) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    // Merge updated fields into existing school
    data[idx] = { ...data[idx], ...updated };
    fs.writeFileSync(SCHOOLS_PATH, JSON.stringify(data, null, 2));

    return NextResponse.json({ success: true, school: data[idx] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
