import { NextRequest, NextResponse } from "next/server";

/* eslint-disable @typescript-eslint/no-explicit-any */

export const dynamic = "force-dynamic";

// Fetches stadium/facilities photos from Wikipedia/Wikimedia Commons
export async function GET(request: NextRequest) {
  const school = request.nextUrl.searchParams.get("school");
  const stadium = request.nextUrl.searchParams.get("stadium");

  if (!school) {
    return NextResponse.json({ photos: [] });
  }

  try {
    const photos: { url: string; caption: string }[] = [];

    // Strategy 1: Search Wikipedia for the stadium page and get images
    if (stadium) {
      const stadiumPhotos = await getWikipediaImages(stadium);
      photos.push(...stadiumPhotos);
    }

    // Strategy 2: Search for "[school] baseball" Wikipedia page
    if (photos.length < 3) {
      const schoolPhotos = await getWikipediaImages(`${school} baseball`);
      for (const p of schoolPhotos) {
        if (photos.length >= 4) break;
        if (!photos.some((existing) => existing.url === p.url)) {
          photos.push(p);
        }
      }
    }

    // Strategy 3: Search for the school itself
    if (photos.length < 2) {
      const campusPhotos = await getWikipediaImages(school);
      for (const p of campusPhotos) {
        if (photos.length >= 4) break;
        if (!photos.some((existing) => existing.url === p.url)) {
          photos.push(p);
        }
      }
    }

    return NextResponse.json({ photos: photos.slice(0, 4) });
  } catch {
    return NextResponse.json({ photos: [] });
  }
}

async function getWikipediaImages(query: string): Promise<{ url: string; caption: string }[]> {
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

      // Filter for actual photos (not icons, logos, or SVGs)
      // Also exclude non-baseball content (football, basketball, portraits, B&W historical)
      const photoImages = images
        .filter((img: any) => {
          const name = (img.title || "").toLowerCase();
          if (!(name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png"))) return false;
          // Exclude UI/wiki assets
          const uiExcludes = ["icon", "logo", "flag", "symbol", "commons-logo", "edit-clear",
            "ambox", "question_book", "wiki", "padlock", "crystal_clear", "nuvola", "gnome",
            "replacement", "cscr-", "disambig", "stub", "template", "info_sign", "red_pog",
            "blue_pog", "map_marker", "locator", "pictogram", "coat_of_arms", "seal_of"];
          if (uiExcludes.some(ex => name.includes(ex))) return false;
          // Exclude other sports and irrelevant content
          const sportExcludes = ["football", "basketball", "soccer", "hockey", "volleyball",
            "lacrosse", "tennis", "golf", "swimming", "track", "wrestling", "gymnast"];
          if (sportExcludes.some(ex => name.includes(ex))) return false;
          // Exclude portraits, headshots, historical black & white photos
          const miscExcludes = ["portrait", "headshot", "bust_of", "grave", "memorial",
            "plaque", "signature", "autograph", "newspaper", "clipping"];
          if (miscExcludes.some(ex => name.includes(ex))) return false;
          return true;
        })
        // Prioritize images with baseball/stadium keywords
        .sort((a: any, b: any) => {
          const nameA = (a.title || "").toLowerCase();
          const nameB = (b.title || "").toLowerCase();
          const baseballTerms = ["baseball", "stadium", "field", "ballpark", "diamond", "dugout", "campus", "aerial", "panoram"];
          const scoreA = baseballTerms.some(t => nameA.includes(t)) ? 1 : 0;
          const scoreB = baseballTerms.some(t => nameB.includes(t)) ? 1 : 0;
          return scoreB - scoreA;
        })
        .slice(0, 4);

      // Get actual image URLs via imageinfo
      for (const img of photoImages) {
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
            // Use the thumbnail URL (scaled to 600px) if available, otherwise the full URL
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
