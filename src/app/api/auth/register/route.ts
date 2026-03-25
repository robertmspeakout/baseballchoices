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
    const { firstName, lastName, email, password, gradYear, position, state, accountType: rawAccountType } = body;
    const accountType = rawAccountType === "parent" ? "parent" : "player";

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
    const trialExpiresAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // 5 days

    // Check if this is the owner email
    const ownerEmail = process.env.OWNER_EMAIL || "";
    const role = ownerEmail && email.toLowerCase() === ownerEmail.toLowerCase() ? "OWNER" : "USER";

    // Build user creation data based on account type
    const userData: Parameters<typeof prisma.user.create>[0]["data"] = {
      firstName,
      lastName,
      email: email.toLowerCase(),
      passwordHash,
      role,
      accountType,
      trialExpiresAt,
    };

    // Only create a profile for players
    if (accountType === "player") {
      userData.profile = {
        create: {
          gradYear: gradYear ? parseInt(gradYear) : null,
          primaryPosition: position || null,
          state: state || null,
        },
      };
    }

    const user = await prisma.user.create({
      data: userData,
      include: { profile: true },
    });

    // For parents, create a FamilyAccount and link them to it
    if (accountType === "parent") {
      const familyAccount = await prisma.familyAccount.create({
        data: {
          ownerUserId: user.id,
          members: { connect: { id: user.id } },
        },
      });

      // Update user with familyAccountId (already connected via relation, but store the ID)
      await prisma.user.update({
        where: { id: user.id },
        data: { familyAccountId: familyAccount.id },
      });
    }

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
    const notifications = [
      {
        userId: user.id,
        schoolId: 0,
        type: "email_verify",
        title: "Verify your email address",
        body: "Check your email for a verification link to confirm your account.",
        link: `/auth/verify?email=${encodeURIComponent(user.email)}`,
        schoolLogo: null,
      },
    ];

    if (accountType === "player") {
      notifications.push({
        userId: user.id,
        schoolId: 0,
        type: "profile_incomplete",
        title: "Complete your player profile",
        body: "Fill out your profile so we can match you with the best college baseball programs.",
        link: "/auth/profile",
        schoolLogo: null,
      });
    } else {
      notifications.push({
        userId: user.id,
        schoolId: 0,
        type: "family_invite",
        title: "Invite your player",
        body: "Send an invite to your player so they can access their recruiting profile.",
        link: "/family/invite",
        schoolLogo: null,
      });
    }

    await prisma.notification.createMany({ data: notifications });

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
