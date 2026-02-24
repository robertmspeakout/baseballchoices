import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ALLOWED_RECRUITING_STATUSES = [
  "", "Researching", "Reached Out", "In Contact", "Mutual Interest", "Offer", "Committed",
];

const schoolDataSchema = z.object({
  schoolId: z.number().int().positive(),
  priority: z.number().int().min(0).max(5).optional(),
  notes: z.string().max(5000).optional(),
  last_contacted: z.string().nullable().optional(),
  recruiting_status: z.string().refine(
    (val) => ALLOWED_RECRUITING_STATUSES.includes(val),
    { message: "Invalid recruiting status" }
  ).optional(),
  theyve_seen_me: z.array(z.string()).optional(),
  detail: z.string().max(5000).optional(),
  my_contact_name: z.string().max(200).optional(),
  my_contact_email: z.string().max(200).optional(),
});

const bulkSyncItemSchema = z.object({
  priority: z.number().int().min(0).max(5).optional(),
  notes: z.string().max(5000).optional(),
  last_contacted: z.string().nullable().optional(),
  recruiting_status: z.string().refine(
    (val) => ALLOWED_RECRUITING_STATUSES.includes(val),
    { message: "Invalid recruiting status" }
  ).optional(),
  theyve_seen_me: z.array(z.string()).optional(),
  detail: z.string().max(5000).optional(),
  my_contact_name: z.string().max(200).optional(),
  my_contact_email: z.string().max(200).optional(),
});

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
  const parsed = schoolDataSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { schoolId, ...updates } = parsed.data;

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

  const body = await request.json();
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid input: expected object" }, { status: 400 });
  }

  let synced = 0;
  for (const [schoolIdStr, updates] of Object.entries(body)) {
    const schoolId = parseInt(schoolIdStr);
    if (isNaN(schoolId) || schoolId <= 0) continue;

    const parsed = bulkSyncItemSchema.safeParse(updates);
    if (!parsed.success) continue;

    const validUpdates = parsed.data;

    // Only sync schools that have meaningful data
    if (!validUpdates.priority && !validUpdates.notes && !validUpdates.recruiting_status) continue;

    const dbData: Record<string, unknown> = {};
    if (validUpdates.priority !== undefined) dbData.priority = validUpdates.priority;
    if (validUpdates.notes !== undefined) dbData.notes = validUpdates.notes;
    if (validUpdates.last_contacted !== undefined) dbData.lastContacted = validUpdates.last_contacted;
    if (validUpdates.recruiting_status !== undefined) dbData.recruitingStatus = validUpdates.recruiting_status;
    if (validUpdates.theyve_seen_me !== undefined) dbData.theyveSeenMe = JSON.stringify(validUpdates.theyve_seen_me);
    if (validUpdates.detail !== undefined) dbData.detail = validUpdates.detail;
    if (validUpdates.my_contact_name !== undefined) dbData.myContactName = validUpdates.my_contact_name;
    if (validUpdates.my_contact_email !== undefined) dbData.myContactEmail = validUpdates.my_contact_email;

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
