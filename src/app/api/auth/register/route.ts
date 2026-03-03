import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { sendVerificationEmail } from "@/lib/email";

const registerLimiter = rateLimit({
  name: "register",
  max: 5,
  windowMs: 60 * 60 * 1000, // 1 hour
});

export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP: max 5 registrations per IP per hour
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { allowed } = registerLimiter.check(ip);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { firstName, lastName, email, password, gradYear, position, state } = body;

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const trialExpiresAt = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000); // effectively indefinite

    // Check if this is the owner email
    const ownerEmail = process.env.OWNER_EMAIL || "";
    const role = ownerEmail && email.toLowerCase() === ownerEmail.toLowerCase() ? "OWNER" : "USER";

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email: email.toLowerCase(),
        passwordHash,
        role,
        trialExpiresAt,
        profile: {
          create: {
            gradYear: gradYear ? parseInt(gradYear) : null,
            primaryPosition: position || null,
            state: state || null,
          },
        },
      },
      include: { profile: true },
    });

    // Send email verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await prisma.verificationToken.create({
      data: {
        email: user.email,
        code,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      },
    });
    await sendVerificationEmail(user.email, code, user.firstName);

    return NextResponse.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      role: user.role,
      requiresVerification: true,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
