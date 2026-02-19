import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Fetches a short school description from Wikipedia
export async function GET(request: NextRequest) {
  const school = request.nextUrl.searchParams.get("school");

  if (!school) {
    return NextResponse.json({ description: null });
  }

  try {
    const description = await getSchoolDescription(school);
    return NextResponse.json({ description });
  } catch {
    return NextResponse.json({ description: null });
  }
}

async function getSchoolDescription(schoolName: string): Promise<string | null> {
  try {
    // Search Wikipedia for the school/university
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(schoolName + " university")}&srlimit=3&format=json&origin=*`;
    const searchRes = await fetch(searchUrl, { signal: AbortSignal.timeout(5000) });
    if (!searchRes.ok) return null;

    const searchData = await searchRes.json();
    const results = searchData?.query?.search || [];
    if (results.length === 0) return null;

    // Find the best match - prefer results with the school name in the title
    const normalizedSchool = schoolName.toLowerCase();
    const bestResult = results.find((r: { title: string }) =>
      r.title.toLowerCase().includes(normalizedSchool) ||
      normalizedSchool.includes(r.title.toLowerCase().replace(" university", "").replace(" college", ""))
    ) || results[0];

    const title = bestResult.title;

    // Get the extract (short description) from the Wikipedia page
    const extractUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=extracts&exintro=true&explaintext=true&exsentences=2&format=json&origin=*`;
    const extractRes = await fetch(extractUrl, { signal: AbortSignal.timeout(5000) });
    if (!extractRes.ok) return null;

    const extractData = await extractRes.json();
    const pages = extractData?.query?.pages || {};
    const page = Object.values(pages)[0] as { extract?: string };
    const extract = page?.extract;

    if (!extract || extract.length < 20) return null;

    // Clean up and truncate to a reasonable length
    let description = extract
      .replace(/\s+/g, " ")
      .trim();

    // Limit to ~2 sentences or 300 chars
    if (description.length > 300) {
      const cutoff = description.lastIndexOf(".", 300);
      if (cutoff > 100) {
        description = description.slice(0, cutoff + 1);
      } else {
        description = description.slice(0, 300) + "...";
      }
    }

    return description;
  } catch {
    return null;
  }
}
