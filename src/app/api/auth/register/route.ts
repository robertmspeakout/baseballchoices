import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { sendWelcomeEmail } from "@/lib/email";

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
      return NextResponse.json({ error: "An account with this email already exists. Please sign in or reset your password.", code: "EMAIL_EXISTS" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const trialExpiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 days

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

    // Generate verification token and send welcome email
    const token = randomUUID();
    await prisma.verificationToken.create({
      data: {
        email: user.email,
        code: token,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });
    await sendWelcomeEmail(user.email, token, user.firstName);

    // Create notifications for the user
    await prisma.notification.createMany({
      data: [
        {
          userId: user.id,
          schoolId: 0,
          type: "email_verify",
          title: "Verify your email address",
          body: "Check your email for a verification link to confirm your account.",
          link: `/auth/verify?email=${encodeURIComponent(user.email)}`,
          schoolLogo: null,
        },
        {
          userId: user.id,
          schoolId: 0,
          type: "profile_incomplete",
          title: "Complete your player profile",
          body: "Fill out your profile so we can match you with the best college baseball programs.",
          link: "/auth/profile",
          schoolLogo: null,
        },
      ],
    });

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
