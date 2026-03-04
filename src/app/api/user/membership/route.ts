import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** GET /api/user/membership — return current subscription status */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      membershipActive: true,
      subscriptionStatus: true,
      stripeCustomerId: true,
      trialExpiresAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    membershipActive: user.membershipActive,
    subscriptionStatus: user.subscriptionStatus,
    hasStripeAccount: !!user.stripeCustomerId,
    trialExpiresAt: user.trialExpiresAt,
  });
}
