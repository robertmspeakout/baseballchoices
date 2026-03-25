import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { auth } from "@/lib/auth";

/* eslint-disable @typescript-eslint/no-explicit-any */

const OVERRIDES_PATH = path.join(process.cwd(), "src/data/record-overrides.json");

async function requireOwner() {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized", status: 401 };
  if ((session.user as any).role !== "OWNER") return { error: "Forbidden", status: 403 };
  return null;
}

function readOverrides(): Record<string, string> {
  try {
    const raw = fs.readFileSync(OVERRIDES_PATH, "utf-8");
    const data = JSON.parse(raw);
    // Strip the _comment key
    const { _comment, ...overrides } = data;
    return overrides;
  } catch {
    return {};
  }
}

function writeOverrides(overrides: Record<string, string>) {
  const data = {
    _comment: "Manual season record overrides. These take priority over ESPN. Key = school name (must match schools.json), value = current season W-L record.",
    ...overrides,
  };
  fs.writeFileSync(OVERRIDES_PATH, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

// GET: list all overrides
export async function GET() {
  const denied = await requireOwner();
  if (denied) return NextResponse.json({ error: denied.error }, { status: denied.status });

  return NextResponse.json({ overrides: readOverrides() });
}

// POST: set or remove overrides
// Body: { "school": "Portland", "record": "15-7" }  — set override
// Body: { "school": "Portland", "record": null }     — remove override
export async function POST(request: NextRequest) {
  const denied = await requireOwner();
  if (denied) return NextResponse.json({ error: denied.error }, { status: denied.status });

  const body = await request.json();
  const { school, record } = body;

  if (!school || typeof school !== "string") {
    return NextResponse.json({ error: "school is required" }, { status: 400 });
  }

  const overrides = readOverrides();

  if (record === null || record === undefined || record === "") {
    delete overrides[school];
  } else {
    overrides[school] = String(record);
  }

  writeOverrides(overrides);

  return NextResponse.json({ ok: true, overrides });
}
