import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      trialExpiresAt: true,
      membershipActive: true,
      notificationsEnabled: true,
      createdAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Compute membership status
  const now = new Date();
  const trialExpires = new Date(user.trialExpiresAt);
  const trialActive = trialExpires > now;
  const daysRemaining = trialActive
    ? Math.ceil((trialExpires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return NextResponse.json({
    ...user,
    trialActive,
    daysRemaining,
  });
}

// PUT — update account settings (e.g. notifications toggle)
export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const updates: Record<string, unknown> = {};

  if (typeof body.notificationsEnabled === "boolean") {
    updates.notificationsEnabled = body.notificationsEnabled;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: updates,
  });

  return NextResponse.json({ success: true });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Prevent OWNER from accidentally deleting their own account
  if (user.role === "OWNER") {
    return NextResponse.json(
      { error: "Owner accounts cannot be self-cancelled. Please contact support." },
      { status: 403 }
    );
  }

  // Cascade delete removes Profile, Preferences, and UserSchoolData
  await prisma.user.delete({ where: { id: session.user.id } });

  return NextResponse.json({ success: true });
}
