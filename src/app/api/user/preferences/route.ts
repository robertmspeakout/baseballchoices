import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const preferencesSchema = z.object({
  divisionPreference: z.enum(["D1", "D2", "D3", "JUCO", "both", "all"]).optional(),
  preferredDivisions: z.array(z.string()).nullable().optional(),
  maxDistanceFromHome: z.union([z.string(), z.number(), z.null()]).optional(),
  preferredRegions: z.array(z.string()).nullable().optional(),
  maxTuition: z.union([z.string(), z.number(), z.null()]).optional(),
  schoolSize: z.union([
    z.array(z.enum(["any", "small", "medium", "large"])),
    z.enum(["any", "small", "medium", "large"]),
  ]).optional(),
  highAcademic: z.boolean().optional(),
  competitiveness: z.enum(["any", "top25", "postseason"]).optional(),
  draftImportance: z.enum(["no", "some", "high", "yes"]).optional(),
  preferredConferences: z.array(z.string()).nullable().optional(),
  preferredTiers: z.array(z.string()).nullable().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prefs = await prisma.preferences.findUnique({
    where: { userId: session.user.id },
  });

  if (prefs) {
    // Normalize schoolSize: stored as JSON array, legacy as bare string
    let schoolSize: string[] = ["any"];
    if (prefs.schoolSize) {
      try {
        const parsed = JSON.parse(prefs.schoolSize);
        schoolSize = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        schoolSize = [prefs.schoolSize]; // legacy bare string like "small"
      }
    }

    return NextResponse.json({
      ...prefs,
      schoolSize,
      preferredDivisions: prefs.preferredDivisions ? JSON.parse(prefs.preferredDivisions) : [],
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
  const parsed = preferencesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const {
    divisionPreference, preferredDivisions, maxDistanceFromHome, preferredRegions,
    maxTuition, schoolSize, highAcademic, competitiveness,
    draftImportance, preferredConferences, preferredTiers,
  } = parsed.data;

  // Normalize draftImportance: "yes" → "high" for backward compat
  const normalizedDraft = draftImportance === "yes" ? "high" : draftImportance;

  const data = {
    divisionPreference,
    preferredDivisions: preferredDivisions ? JSON.stringify(preferredDivisions) : null,
    maxDistanceFromHome: maxDistanceFromHome ? parseInt(String(maxDistanceFromHome)) : null,
    preferredRegions: preferredRegions ? JSON.stringify(preferredRegions) : null,
    maxTuition: maxTuition ? parseInt(String(maxTuition)) : null,
    schoolSize: schoolSize ? JSON.stringify(Array.isArray(schoolSize) ? schoolSize : [schoolSize]) : null,
    highAcademic: highAcademic ?? false,
    competitiveness,
    draftImportance: normalizedDraft,
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
