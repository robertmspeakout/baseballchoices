import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { sendPasswordResetEmail } from "@/lib/email";

const forgotPasswordLimiter = rateLimit({
  name: "forgot-password",
  max: 3,
  windowMs: 60 * 60 * 1000, // 1 hour
});

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase();

    // Rate limit by email
    const { allowed } = forgotPasswordLimiter.check(normalizedEmail);
    if (!allowed) {
      // Still return success to avoid user enumeration
      return NextResponse.json({ success: true });
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      // Don't reveal whether the email exists
      return NextResponse.json({ success: true });
    }

    // Rate limit: don't send if a code was created in the last 60 seconds
    const recentToken = await prisma.passwordResetToken.findFirst({
      where: {
        email: normalizedEmail,
        createdAt: { gt: new Date(Date.now() - 60 * 1000) },
      },
    });

    if (recentToken) {
      return NextResponse.json({ error: "Please wait a minute before requesting a new code" }, { status: 429 });
    }

    // Clean up old tokens
    await prisma.passwordResetToken.deleteMany({
      where: { email: normalizedEmail },
    });

    const code = generateCode();
    await prisma.passwordResetToken.create({
      data: {
        email: normalizedEmail,
        code,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      },
    });

    await sendPasswordResetEmail(normalizedEmail, code, user.firstName);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
