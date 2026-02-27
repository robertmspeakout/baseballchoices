import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const AUTHORIZED_EMAIL = "testing@extrabase.com";

function isAuthorized(user: { role: string; email: string }) {
  return user.role === "ADMIN" || user.role === "OWNER" || user.email === AUTHORIZED_EMAIL;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only ADMIN, OWNER, or authorized email can access
  const currentUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!currentUser || !isAuthorized(currentUser)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    include: { profile: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users.map(u => ({
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    role: u.role,
    trialExpiresAt: u.trialExpiresAt,
    membershipActive: u.membershipActive,
    createdAt: u.createdAt,
    gradYear: u.profile?.gradYear,
    position: u.profile?.primaryPosition,
    state: u.profile?.state,
    profileComplete: u.profile?.profileComplete ?? false,
  })));
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const currentUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!currentUser || !isAuthorized(currentUser)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { userId, role, trialExpiresAt, membershipActive } = body;

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Role change permissions
  const hasOwnerPrivileges = currentUser.role === "OWNER" || currentUser.email === AUTHORIZED_EMAIL;
  if (role !== undefined && role !== targetUser.role) {
    // Only OWNER (or authorized email) can set OWNER role
    if (role === "OWNER" && !hasOwnerPrivileges) {
      return NextResponse.json({ error: "Only an Owner can grant Owner status" }, { status: 403 });
    }
    // ADMIN can only set USER or ADMIN (but authorized email has full access)
    if (!hasOwnerPrivileges && currentUser.role === "ADMIN" && (role === "OWNER" || targetUser.role === "OWNER")) {
      return NextResponse.json({ error: "Admins cannot modify Owner accounts" }, { status: 403 });
    }
  }

  const updateData: Record<string, unknown> = {};
  if (role !== undefined) updateData.role = role;
  if (trialExpiresAt !== undefined) updateData.trialExpiresAt = new Date(trialExpiresAt);
  if (membershipActive !== undefined) updateData.membershipActive = membershipActive;

  const updated = await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  return NextResponse.json({
    id: updated.id,
    role: updated.role,
    trialExpiresAt: updated.trialExpiresAt,
    membershipActive: updated.membershipActive,
  });
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const currentUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!currentUser || !isAuthorized(currentUser)) {
    return NextResponse.json({ error: "Only Owners can delete users" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  if (userId === currentUser.id) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
  }

  await prisma.user.delete({ where: { id: userId } });

  return NextResponse.json({ success: true });
}
