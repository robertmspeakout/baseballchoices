import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const profileSchema = z.object({
  gradYear: z.union([z.string(), z.number(), z.null()]).optional(),
  primaryPosition: z.string().max(100).nullable().optional(),
  secondaryPosition: z.string().max(100).nullable().optional(),
  city: z.string().max(200).nullable().optional(),
  state: z.string().max(50).nullable().optional(),
  zipCode: z.string().max(20).nullable().optional(),
  highSchool: z.string().max(200).nullable().optional(),
  travelBall: z.string().max(200).nullable().optional(),
  gpa: z.union([z.string(), z.number(), z.null()]).optional(),
  gpaType: z.string().max(50).nullable().optional(),
  satScore: z.union([z.string(), z.number(), z.null()]).optional(),
  actScore: z.union([z.string(), z.number(), z.null()]).optional(),
  profileComplete: z.boolean().optional(),
  profilePic: z.string().nullable().optional(),
  backgroundPic: z.string().nullable().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json(profile);
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const {
    gradYear, primaryPosition, secondaryPosition,
    city, state, zipCode, highSchool, travelBall,
    gpa, gpaType, satScore, actScore, profileComplete,
    profilePic, backgroundPic,
  } = parsed.data;

  const data = {
    gradYear: gradYear ? parseInt(String(gradYear)) : null,
    primaryPosition, secondaryPosition,
    city, state, zipCode, highSchool, travelBall,
    gpa: gpa != null ? String(gpa) : null,
    gpaType,
    satScore: satScore != null ? String(satScore) : null,
    actScore: actScore != null ? String(actScore) : null,
    profileComplete: profileComplete ?? false,
    ...(profilePic !== undefined ? { profilePic } : {}),
    ...(backgroundPic !== undefined ? { backgroundPic } : {}),
  };

  const profile = await prisma.profile.upsert({
    where: { userId: session.user.id },
    update: data,
    create: { userId: session.user.id, ...data },
  });

  return NextResponse.json(profile);
}
