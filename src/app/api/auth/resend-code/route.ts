import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Don't reveal whether the email exists
      return NextResponse.json({ success: true });
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: "Email is already verified" }, { status: 400 });
    }

    // Rate limit: don't send if a token was created in the last 60 seconds
    const recentToken = await prisma.verificationToken.findFirst({
      where: {
        email: email.toLowerCase(),
        createdAt: { gt: new Date(Date.now() - 60 * 1000) },
      },
    });

    if (recentToken) {
      return NextResponse.json({ error: "Please wait a minute before requesting a new email" }, { status: 429 });
    }

    // Clean up old tokens
    await prisma.verificationToken.deleteMany({
      where: { email: email.toLowerCase() },
    });

    const token = randomUUID();
    await prisma.verificationToken.create({
      data: {
        email: email.toLowerCase(),
        code: token,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    await sendVerificationEmail(email.toLowerCase(), token, user.firstName);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
