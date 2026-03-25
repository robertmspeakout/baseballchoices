import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST — accept a family invite (called after the invited user registers or logs in)
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { token } = await request.json();
  if (!token) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 });
  }

  const familyAccount = await prisma.familyAccount.findUnique({
    where: { inviteToken: token },
    include: { members: true },
  });

  if (!familyAccount) {
    return NextResponse.json({ error: "Invalid invite token" }, { status: 404 });
  }

  if (familyAccount.inviteExpiresAt && familyAccount.inviteExpiresAt < new Date()) {
    return NextResponse.json({ error: "This invite has expired" }, { status: 410 });
  }

  if (familyAccount.members.length >= 2) {
    return NextResponse.json({ error: "This family account is already full" }, { status: 400 });
  }

  // Check the user isn't already in a family
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (user.familyAccountId) {
    return NextResponse.json({ error: "You are already in a family account" }, { status: 400 });
  }

  // Link the user to the family account
  await prisma.user.update({
    where: { id: session.user.id },
    data: { familyAccountId: familyAccount.id },
  });

  // If this user is a parent with an active subscription, make them the owner
  if (user.accountType === "parent" && user.membershipActive) {
    await prisma.familyAccount.update({
      where: { id: familyAccount.id },
      data: { ownerUserId: user.id },
    });
  }

  // Clear the invite token
  await prisma.familyAccount.update({
    where: { id: familyAccount.id },
    data: {
      inviteToken: null,
      inviteEmail: null,
      inviteExpiresAt: null,
    },
  });

  return NextResponse.json({ success: true });
}
