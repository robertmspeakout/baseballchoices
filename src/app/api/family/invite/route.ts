import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendFamilyInviteEmail, sendFamilyLinkedEmail } from "@/lib/email";

// GET — check an invite token's validity
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Token required" }, { status: 400 });
  }

  const family = await prisma.familyAccount.findUnique({
    where: { inviteToken: token },
    include: { members: { select: { firstName: true, accountType: true } } },
  });

  if (!family || (family.inviteExpiresAt && family.inviteExpiresAt < new Date())) {
    return NextResponse.json({ error: "Invalid or expired invite" }, { status: 404 });
  }

  // Figure out what role is being invited
  const existingTypes = family.members.map((m) => m.accountType);
  const invitedAs = existingTypes.includes("player") ? "parent" : "player";
  const inviterName = family.members[0]?.firstName || "Someone";

  return NextResponse.json({
    invitedAs,
    inviterName,
    email: family.inviteEmail,
  });
}

// POST — send an invite to a family member
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { email } = await request.json();
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Can't invite yourself
  if (normalizedEmail === session.user.email.toLowerCase()) {
    return NextResponse.json({ error: "You can't invite yourself" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      familyAccount: { include: { members: true } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Check if the invited email is already registered
  const existingInvitee = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  let familyAccount = user.familyAccount;

  // If user has no family account yet (solo player inviting a parent), create one
  if (!familyAccount) {
    const created = await prisma.familyAccount.create({
      data: {
        ownerUserId: user.id,
        members: { connect: { id: user.id } },
      },
    });
    await prisma.user.update({
      where: { id: user.id },
      data: { familyAccountId: created.id },
    });
    // Refetch with members included
    familyAccount = await prisma.familyAccount.findUnique({
      where: { id: created.id },
      include: { members: true },
    });
  }

  if (!familyAccount) {
    return NextResponse.json({ error: "Failed to create family account" }, { status: 500 });
  }

  // Check family isn't already full (max 2 members)
  if (familyAccount.members && familyAccount.members.length >= 2) {
    return NextResponse.json({ error: "Family account already has two members" }, { status: 400 });
  }

  // If the invitee already has an account, link them directly
  if (existingInvitee) {
    if (existingInvitee.familyAccountId) {
      return NextResponse.json({ error: "That person is already in a family account" }, { status: 400 });
    }

    // Link them to this family account
    await prisma.user.update({
      where: { id: existingInvitee.id },
      data: { familyAccountId: familyAccount.id },
    });

    // If the invitee is a parent and has a Stripe subscription, make them the owner
    if (existingInvitee.accountType === "parent" && existingInvitee.membershipActive) {
      await prisma.familyAccount.update({
        where: { id: familyAccount.id },
        data: { ownerUserId: existingInvitee.id },
      });
    }

    // Notify the linked person via email
    const needsToSubscribe = existingInvitee.accountType === "parent" && !existingInvitee.membershipActive;
    await sendFamilyLinkedEmail(
      existingInvitee.email,
      existingInvitee.firstName,
      user.firstName,
      existingInvitee.accountType === "parent" ? "parent" : "player",
      needsToSubscribe,
    );

    return NextResponse.json({ linked: true, firstName: existingInvitee.firstName });
  }

  // Invitee doesn't have an account — generate invite token and send email
  const inviteToken = randomUUID();
  await prisma.familyAccount.update({
    where: { id: familyAccount.id },
    data: {
      inviteToken,
      inviteEmail: normalizedEmail,
      inviteExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  // Determine what we're inviting them as
  const invitedAs = user.accountType === "player" ? "parent" : "player";

  await sendFamilyInviteEmail(normalizedEmail, user.firstName, inviteToken, invitedAs);

  return NextResponse.json({ invited: true, invitedAs });
}
