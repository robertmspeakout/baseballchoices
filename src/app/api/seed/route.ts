import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

const TEST_EMAIL = "testing@extrabase.com";
const SEED_SECRET = process.env.AUTH_SECRET;

export async function GET(request: Request) {
  // Require secret as query param to prevent abuse
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");

  if (!secret || secret !== SEED_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const trial = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    const testHash = await hashPassword("123456789!");

    const user = await prisma.user.upsert({
      where: { email: TEST_EMAIL },
      update: { passwordHash: testHash },
      create: {
        firstName: "John",
        lastName: "Doe",
        email: TEST_EMAIL,
        passwordHash: testHash,
        role: "USER",
        trialExpiresAt: trial,
        profile: { create: {} },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Test account ready: ${TEST_EMAIL}`,
      userId: user.id,
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { error: "Failed to seed", details: String(error) },
      { status: 500 }
    );
  }
}
