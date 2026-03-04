import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: "Verification token is required" }, { status: 400 });
    }

    const record = await prisma.verificationToken.findFirst({
      where: { code: token },
      orderBy: { createdAt: "desc" },
    });

    if (!record) {
      return NextResponse.json({ error: "Invalid or expired verification link. Please request a new one." }, { status: 400 });
    }

    // Mark user as verified
    await prisma.user.update({
      where: { email: record.email },
      data: { emailVerified: true },
    });

    // Clean up used tokens for this email
    await prisma.verificationToken.deleteMany({
      where: { email: record.email },
    });

    return NextResponse.json({ success: true, email: record.email });
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
