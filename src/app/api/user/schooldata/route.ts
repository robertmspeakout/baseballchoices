import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — load all school data for the logged-in user
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await prisma.userSchoolData.findMany({
    where: { userId: session.user.id },
  });

  // Return as a map keyed by schoolId
  const data: Record<string, {
    priority: number;
    notes: string;
    last_contacted: string | null;
    recruiting_status: string;
    theyve_seen_me: string[];
    detail: string;
    my_contact_name: string;
    my_contact_email: string;
  }> = {};

  for (const row of rows) {
    data[row.schoolId] = {
      priority: row.priority,
      notes: row.notes,
      last_contacted: row.lastContacted,
      recruiting_status: row.recruitingStatus || "",
      theyve_seen_me: row.theyveSeenMe ? JSON.parse(row.theyveSeenMe) : [],
      detail: row.detail || "",
      my_contact_name: row.myContactName || "",
      my_contact_email: row.myContactEmail || "",
    };
  }

  return NextResponse.json(data);
}

// PUT — save/update school data for the logged-in user
export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { schoolId, ...updates } = body;

  if (!schoolId || typeof schoolId !== "number") {
    return NextResponse.json({ error: "schoolId is required" }, { status: 400 });
  }

  const dbData: Record<string, unknown> = {};
  if (updates.priority !== undefined) dbData.priority = updates.priority;
  if (updates.notes !== undefined) dbData.notes = updates.notes;
  if (updates.last_contacted !== undefined) dbData.lastContacted = updates.last_contacted;
  if (updates.recruiting_status !== undefined) dbData.recruitingStatus = updates.recruiting_status;
  if (updates.theyve_seen_me !== undefined) dbData.theyveSeenMe = JSON.stringify(updates.theyve_seen_me);
  if (updates.detail !== undefined) dbData.detail = updates.detail;
  if (updates.my_contact_name !== undefined) dbData.myContactName = updates.my_contact_name;
  if (updates.my_contact_email !== undefined) dbData.myContactEmail = updates.my_contact_email;

  const row = await prisma.userSchoolData.upsert({
    where: {
      userId_schoolId: {
        userId: session.user.id,
        schoolId,
      },
    },
    update: dbData,
    create: {
      userId: session.user.id,
      schoolId,
      ...dbData,
    },
  });

  return NextResponse.json({ success: true, id: row.id });
}

// POST — bulk sync: upload multiple school records at once (for localStorage → DB migration)
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: Record<string, {
    priority?: number;
    notes?: string;
    last_contacted?: string | null;
    recruiting_status?: string;
    theyve_seen_me?: string[];
    detail?: string;
    my_contact_name?: string;
    my_contact_email?: string;
  }> = await request.json();

  let synced = 0;
  for (const [schoolIdStr, updates] of Object.entries(body)) {
    const schoolId = parseInt(schoolIdStr);
    if (isNaN(schoolId)) continue;
    // Only sync schools that have meaningful data
    if (!updates.priority && !updates.notes && !updates.recruiting_status) continue;

    const dbData: Record<string, unknown> = {};
    if (updates.priority !== undefined) dbData.priority = updates.priority;
    if (updates.notes !== undefined) dbData.notes = updates.notes;
    if (updates.last_contacted !== undefined) dbData.lastContacted = updates.last_contacted;
    if (updates.recruiting_status !== undefined) dbData.recruitingStatus = updates.recruiting_status;
    if (updates.theyve_seen_me !== undefined) dbData.theyveSeenMe = JSON.stringify(updates.theyve_seen_me);
    if (updates.detail !== undefined) dbData.detail = updates.detail;
    if (updates.my_contact_name !== undefined) dbData.myContactName = updates.my_contact_name;
    if (updates.my_contact_email !== undefined) dbData.myContactEmail = updates.my_contact_email;

    await prisma.userSchoolData.upsert({
      where: {
        userId_schoolId: { userId: session.user.id, schoolId },
      },
      update: dbData,
      create: {
        userId: session.user.id,
        schoolId,
        ...dbData,
      },
    });
    synced++;
  }

  return NextResponse.json({ success: true, synced });
}
