import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
  const {
    gradYear, primaryPosition, secondaryPosition,
    city, state, zipCode, highSchool, travelBall,
    gpa, gpaType, satScore, actScore, profileComplete,
  } = body;

  const profile = await prisma.profile.upsert({
    where: { userId: session.user.id },
    update: {
      gradYear: gradYear ? parseInt(gradYear) : null,
      primaryPosition, secondaryPosition,
      city, state, zipCode, highSchool, travelBall,
      gpa, gpaType, satScore, actScore,
      profileComplete: profileComplete ?? false,
    },
    create: {
      userId: session.user.id,
      gradYear: gradYear ? parseInt(gradYear) : null,
      primaryPosition, secondaryPosition,
      city, state, zipCode, highSchool, travelBall,
      gpa, gpaType, satScore, actScore,
      profileComplete: profileComplete ?? false,
    },
  });

  return NextResponse.json(profile);
}
