import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/* eslint-disable @typescript-eslint/no-explicit-any */

async function requireOwner() {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized", status: 401 };
  if ((session.user as any).role !== "OWNER") return { error: "Forbidden", status: 403 };
  return null;
}

export async function POST() {
  const denied = await requireOwner();
  if (denied) return NextResponse.json({ error: denied.error }, { status: denied.status });

  try {
    // Dynamic import the rankings updater
    const { updateRankings } = require("@/../scripts/update-rankings");
    const result = await updateRankings();
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
