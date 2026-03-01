import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

// Peek at the same AI rate limiter store (shared in-memory by name)
const aiLimiter = rateLimit({
  name: "ai-match",
  max: 20,
  windowMs: 30 * 24 * 60 * 60 * 1000,
});

export const dynamic = "force-dynamic";

// GET — generate notifications for the current user
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user has notifications enabled; also grab trial/membership info
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { notificationsEnabled: true, trialExpiresAt: true, membershipActive: true },
  });
  if (!user?.notificationsEnabled) {
    return NextResponse.json({ generated: 0, message: "Notifications disabled" });
  }

  // Get existing notifications from the last 24 hours to avoid duplicates
  const oneDayAgo = new Date();
  oneDayAgo.setHours(oneDayAgo.getHours() - 24);
  const recentNotifications = await prisma.notification.findMany({
    where: {
      userId: session.user.id,
      createdAt: { gte: oneDayAgo },
    },
    select: { type: true, schoolId: true, title: true },
  });
  const recentKeys = new Set(recentNotifications.map((n) => `${n.type}:${n.schoolId}:${n.title}`));

  const newNotifications: {
    userId: string;
    schoolId: number;
    type: string;
    title: string;
    body: string;
    link: string | null;
    schoolLogo: string | null;
  }[] = [];

  // --- Account-level notifications ---

  // AI Scout messages running low (fewer than 5 remaining)
  const { remaining } = aiLimiter.peek(session.user.id);
  if (remaining < 5 && remaining > 0) {
    const title = `${remaining} AI Scout message${remaining === 1 ? "" : "s"} left`;
    const key = `ai_messages_low:0:${title}`;
    if (!recentKeys.has(key)) {
      newNotifications.push({
        userId: session.user.id,
        schoolId: 0,
        type: "ai_messages_low",
        title,
        body: `You have ${remaining} of 20 AI Scout messages remaining this month.`,
        link: "/ai-match",
        schoolLogo: null,
      });
    }
  }

  // Trial expiring within 48 hours (only if not a paid member)
  if (!user.membershipActive && user.trialExpiresAt) {
    const now = Date.now();
    const expiresAt = new Date(user.trialExpiresAt).getTime();
    const hoursLeft = (expiresAt - now) / (1000 * 60 * 60);
    if (hoursLeft > 0 && hoursLeft <= 48) {
      const hrsRounded = Math.round(hoursLeft);
      const title = hrsRounded <= 24
        ? "Your free trial expires today"
        : "Your free trial expires tomorrow";
      const key = `trial_expiring:0:${title}`;
      if (!recentKeys.has(key)) {
        newNotifications.push({
          userId: session.user.id,
          schoolId: 0,
          type: "trial_expiring",
          title,
          body: `Your free trial period ends in about ${hrsRounded} hour${hrsRounded === 1 ? "" : "s"}. Upgrade to keep full access.`,
          link: "/auth/account",
          schoolLogo: null,
        });
      }
    }
  }

  // Batch insert all new notifications
  if (newNotifications.length > 0) {
    await prisma.notification.createMany({ data: newNotifications });
  }

  // Clean up old notifications (older than 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  await prisma.notification.deleteMany({
    where: {
      userId: session.user.id,
      createdAt: { lt: thirtyDaysAgo },
    },
  });

  return NextResponse.json({ generated: newNotifications.length });
}
