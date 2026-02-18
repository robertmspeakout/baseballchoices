import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

const OWNER_EMAIL = "robertjmunsoniii@gmail.com";

export async function POST(request: NextRequest) {
  try {
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

    const passwordHash = await hash(password, 12);
    const trialExpiresAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // 5 days

    // Check if this is the owner email
    const role = email.toLowerCase() === OWNER_EMAIL.toLowerCase() ? "OWNER" : "USER";

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

    return NextResponse.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      role: user.role,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
