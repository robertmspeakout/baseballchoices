import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prefs = await prisma.preferences.findUnique({
    where: { userId: session.user.id },
  });

  if (prefs) {
    return NextResponse.json({
      ...prefs,
      preferredRegions: prefs.preferredRegions ? JSON.parse(prefs.preferredRegions) : [],
      preferredConferences: prefs.preferredConferences ? JSON.parse(prefs.preferredConferences) : [],
      preferredTiers: prefs.preferredTiers ? JSON.parse(prefs.preferredTiers) : [],
    });
  }

  return NextResponse.json(null);
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    divisionPreference, maxDistanceFromHome, preferredRegions,
    maxTuition, schoolSize, highAcademic, competitiveness,
    draftImportance, preferredConferences, preferredTiers,
  } = body;

  const data = {
    divisionPreference,
    maxDistanceFromHome: maxDistanceFromHome ? parseInt(maxDistanceFromHome) : null,
    preferredRegions: preferredRegions ? JSON.stringify(preferredRegions) : null,
    maxTuition: maxTuition ? parseInt(maxTuition) : null,
    schoolSize,
    highAcademic: highAcademic ?? false,
    competitiveness,
    draftImportance,
    preferredConferences: preferredConferences ? JSON.stringify(preferredConferences) : null,
    preferredTiers: preferredTiers ? JSON.stringify(preferredTiers) : null,
  };

  const prefs = await prisma.preferences.upsert({
    where: { userId: session.user.id },
    update: data,
    create: { userId: session.user.id, ...data },
  });

  return NextResponse.json(prefs);
}
