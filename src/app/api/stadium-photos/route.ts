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
      const photoImages = images
        .filter((img: any) => {
          const name = (img.title || "").toLowerCase();
          return (
            (name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png")) &&
            !name.includes("icon") &&
            !name.includes("logo") &&
            !name.includes("flag") &&
            !name.includes("symbol") &&
            !name.includes("commons-logo") &&
            !name.includes("edit-clear") &&
            !name.includes("ambox") &&
            !name.includes("question_book") &&
            !name.includes("wiki") &&
            !name.includes("padlock") &&
            !name.includes("crystal_clear") &&
            !name.includes("nuvola") &&
            !name.includes("gnome") &&
            !name.includes("replacement")
          );
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
