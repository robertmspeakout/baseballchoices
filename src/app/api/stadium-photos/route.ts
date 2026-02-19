import { NextRequest, NextResponse } from "next/server";

/* eslint-disable @typescript-eslint/no-explicit-any */

export const dynamic = "force-dynamic";

// Fetches stadium photos only from Wikipedia/Wikimedia Commons
export async function GET(request: NextRequest) {
  const school = request.nextUrl.searchParams.get("school");
  const stadium = request.nextUrl.searchParams.get("stadium");

  if (!school) {
    return NextResponse.json({ photos: [] });
  }

  try {
    const photos: { url: string; caption: string }[] = [];

    // Only search for the stadium itself — no generic school/campus images
    if (stadium) {
      const stadiumPhotos = await getStadiumImages(stadium);
      photos.push(...stadiumPhotos);
    }

    // If no stadium name or no results, try "[school] baseball stadium"
    if (photos.length === 0) {
      const fallback = await getStadiumImages(`${school} baseball stadium`);
      photos.push(...fallback);
    }

    return NextResponse.json({ photos: photos.slice(0, 4) });
  } catch {
    return NextResponse.json({ photos: [] });
  }
}

async function getStadiumImages(query: string): Promise<{ url: string; caption: string }[]> {
  try {
    // Search Wikipedia for the query
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=2&format=json&origin=*`;
    const searchRes = await fetch(searchUrl, { signal: AbortSignal.timeout(5000) });
    if (!searchRes.ok) return [];

    const searchData = await searchRes.json();
    const results = searchData?.query?.search || [];
    if (results.length === 0) return [];

    const photos: { url: string; caption: string }[] = [];

    for (const result of results) {
      const title = result.title;

      // Get images from the page
      const imagesUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=images&imlimit=10&format=json&origin=*`;
      const imagesRes = await fetch(imagesUrl, { signal: AbortSignal.timeout(5000) });
      if (!imagesRes.ok) continue;

      const imagesData = await imagesRes.json();
      const pages = imagesData?.query?.pages || {};
      const page = Object.values(pages)[0] as any;
      const images = page?.images || [];

      // Strict filter: ONLY keep images with stadium/field/ballpark keywords
      const stadiumImages = images.filter((img: any) => {
        const name = (img.title || "").toLowerCase();
        // Must be a photo file
        if (!(name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png"))) return false;
        // Exclude UI/wiki assets
        const uiExcludes = ["icon", "logo", "flag", "symbol", "commons-logo", "edit-clear",
          "ambox", "question_book", "wiki", "padlock", "crystal_clear", "nuvola", "gnome",
          "replacement", "cscr-", "disambig", "stub", "template", "info_sign", "red_pog",
          "blue_pog", "map_marker", "locator", "pictogram", "coat_of_arms", "seal_of"];
        if (uiExcludes.some(ex => name.includes(ex))) return false;
        // Exclude non-baseball sports
        const sportExcludes = ["football", "basketball", "soccer", "hockey", "volleyball",
          "lacrosse", "tennis", "golf", "swimming", "track", "wrestling", "gymnast"];
        if (sportExcludes.some(ex => name.includes(ex))) return false;
        // Exclude portraits, headshots, misc
        const miscExcludes = ["portrait", "headshot", "bust_of", "grave", "memorial",
          "plaque", "signature", "autograph", "newspaper", "clipping", "coach", "player",
          "roster", "team_photo", "uniform", "jersey", "cap_insignia", "hat_logo"];
        if (miscExcludes.some(ex => name.includes(ex))) return false;
        // MUST have a stadium/field/venue keyword in the filename
        const stadiumTerms = ["stadium", "field", "ballpark", "diamond", "park", "arena",
          "complex", "facility", "aerial", "panoram", "venue", "dugout", "grandstand",
          "press_box", "scoreboard", "bleacher", "outfield", "infield", "stands"];
        return stadiumTerms.some(t => name.includes(t));
      }).slice(0, 4);

      // Get actual image URLs via imageinfo
      for (const img of stadiumImages) {
        if (photos.length >= 4) break;
        try {
          const infoUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(img.title)}&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=600&format=json&origin=*`;
          const infoRes = await fetch(infoUrl, { signal: AbortSignal.timeout(5000) });
          if (!infoRes.ok) continue;

          const infoData = await infoRes.json();
          const infoPages = infoData?.query?.pages || {};
          const infoPage = Object.values(infoPages)[0] as any;
          const imageInfo = infoPage?.imageinfo?.[0];

          if (imageInfo) {
            const url = imageInfo.thumburl || imageInfo.url;
            const caption = imageInfo.extmetadata?.ImageDescription?.value?.replace(/<[^>]*>/g, "") ||
                          img.title.replace("File:", "").replace(/\.[^.]+$/, "").replace(/_/g, " ");

            if (url) {
              photos.push({ url, caption: caption.slice(0, 100) });
            }
          }
        } catch {
          continue;
        }
      }
    }

    return photos;
  } catch {
    return [];
  }
}
