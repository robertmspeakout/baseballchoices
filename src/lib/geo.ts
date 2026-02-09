// Zip code to lat/lng lookup for distance calculation
// Contains ~42,000 US zip codes
// We'll use a subset and the Haversine formula

export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

// We'll use a free API to geocode zip codes at runtime
// and cache results in the database
export async function geocodeZip(
  zip: string
): Promise<{ lat: number; lng: number } | null> {
  try {
    const resp = await fetch(
      `https://api.zippopotam.us/us/${zip}`
    );
    if (!resp.ok) return null;
    const data = await resp.json();
    const place = data.places?.[0];
    if (!place) return null;
    return {
      lat: parseFloat(place.latitude),
      lng: parseFloat(place.longitude),
    };
  } catch {
    return null;
  }
}
