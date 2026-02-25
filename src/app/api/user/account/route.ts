import { NextResponse } from "next/server";
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
