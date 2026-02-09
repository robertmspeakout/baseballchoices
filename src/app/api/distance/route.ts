import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { haversineDistance, geocodeZip } from "@/lib/geo";

export async function GET(request: NextRequest) {
  const zip = request.nextUrl.searchParams.get("zip");
  if (!zip || !/^\d{5}$/.test(zip)) {
    return NextResponse.json(
      { error: "Valid 5-digit zip code required" },
      { status: 400 }
    );
  }

  const coords = await geocodeZip(zip);
  if (!coords) {
    return NextResponse.json(
      { error: "Could not geocode zip code" },
      { status: 400 }
    );
  }

  const db = getDb();
  const schools = db
    .prepare("SELECT id, latitude, longitude FROM schools WHERE latitude IS NOT NULL AND longitude IS NOT NULL")
    .all() as { id: number; latitude: number; longitude: number }[];

  const distances: Record<number, number> = {};
  for (const school of schools) {
    distances[school.id] = haversineDistance(
      coords.lat,
      coords.lng,
      school.latitude,
      school.longitude
    );
  }

  return NextResponse.json({ zip, lat: coords.lat, lng: coords.lng, distances });
}
