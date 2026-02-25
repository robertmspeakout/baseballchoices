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

  const d = parsed.data;

  // Only include fields that were actually sent, so partial updates
  // don't overwrite existing data with null
  const data: Record<string, unknown> = {};
  if (d.gradYear !== undefined) data.gradYear = d.gradYear ? parseInt(String(d.gradYear)) : null;
  if (d.primaryPosition !== undefined) data.primaryPosition = d.primaryPosition;
  if (d.secondaryPosition !== undefined) data.secondaryPosition = d.secondaryPosition;
  if (d.city !== undefined) data.city = d.city;
  if (d.state !== undefined) data.state = d.state;
  if (d.zipCode !== undefined) data.zipCode = d.zipCode;
  if (d.highSchool !== undefined) data.highSchool = d.highSchool;
  if (d.travelBall !== undefined) data.travelBall = d.travelBall;
  if (d.gpa !== undefined) data.gpa = d.gpa != null ? String(d.gpa) : null;
  if (d.gpaType !== undefined) data.gpaType = d.gpaType;
  if (d.satScore !== undefined) data.satScore = d.satScore != null ? String(d.satScore) : null;
  if (d.actScore !== undefined) data.actScore = d.actScore != null ? String(d.actScore) : null;
  if (d.profileComplete !== undefined) data.profileComplete = d.profileComplete;
  if (d.profilePic !== undefined) data.profilePic = d.profilePic;
  if (d.backgroundPic !== undefined) data.backgroundPic = d.backgroundPic;

  const profile = await prisma.profile.upsert({
    where: { userId: session.user.id },
    update: data,
    create: { userId: session.user.id, ...data },
  });

  return NextResponse.json(profile);
}
