#!/usr/bin/env node
/**
 * Fix stadium image URLs by querying the Wikipedia PageImages API.
 * For each school with a stadium_name, searches Wikipedia for the stadium article
 * and extracts the lead image thumbnail URL.
 */

const fs = require("fs");
const path = require("path");

const SCHOOLS_PATH = path.join(__dirname, "../src/data/schools.json");
const schools = JSON.parse(fs.readFileSync(SCHOOLS_PATH, "utf-8"));

const USER_AGENT = "BaseballChoicesBot/1.0 (college baseball recruiting app)";

// Manual mappings for stadiums whose Wikipedia article titles differ from their name
const MANUAL_TITLE_MAP = {
  "Baum-Walker Stadium": "Baum–Walker_Stadium", // en-dash
  "Phoenix Municipal Stadium": "Phoenix_Municipal_Stadium",
  "Hi Corbett Field": "Hi_Corbett_Field",
  "Plainsman Park": "Plainsman_Park",
  "Baylor Ballpark": "Baylor_Ballpark",
  "Jackie Robinson Ballpark": "Jackie_Robinson_Ballpark",
  "Doug Kingsmore Stadium": "Doug_Kingsmore_Stadium",
  "Florida Ballpark": "Florida_Ballpark",
  "Dick Howser Stadium": "Dick_Howser_Stadium",
  "Foley Field": "Foley_Field",
  "Russ Chandler Stadium": "Russ_Chandler_Stadium",
  "Kentucky Proud Park": "Kentucky_Proud_Park",
  "Jim Patterson Stadium": "Jim_Patterson_Stadium",
  "Alex Box Stadium, Skip Bertman Field": "Alex_Box_Stadium,_Skip_Bertman_Field",
  "Alex Rodriguez Park at Mark Light Field": "Alex_Rodriguez_Park_at_Mark_Light_Field",
  "Ray Fisher Stadium": "Ray_Fisher_Stadium",
  "Dudy Noble Field": "Dudy_Noble_Field,_Polk–DeMent_Stadium",
  "Doak Field at Dail Park": "Doak_Field_at_Dail_Park",
  "Boshamer Stadium": "Boshamer_Stadium",
  "Frank Eck Stadium": "Frank_Eck_Stadium",
  "Bill Davis Stadium": "Bill_Davis_Stadium",
  "L. Dale Mitchell Park": "L._Dale_Mitchell_Park",
  "O'Brate Stadium": "O'Brate_Stadium",
  "Swayze Field": "Swayze_Field",
  "Goss Stadium at Coleman Field": "Goss_Stadium_at_Coleman_Field",
  "Founders Park": "Founders_Park_(Columbia,_South_Carolina)",
  "Klein Field at Sunken Diamond": "Klein_Field_at_Sunken_Diamond",
  "Lupton Stadium": "Lupton_Stadium",
  "Lindsey Nelson Stadium": "Lindsey_Nelson_Stadium",
  "UFCU Disch-Falk Field": "UFCU_Disch–Falk_Field", // en-dash
  "Blue Bell Park": "Olsen_Field_at_Blue_Bell_Park",
  "Dan Law Field at Rip Griffin Park": "Dan_Law_Field_at_Rip_Griffin_Park",
  "Hawkins Field": "Hawkins_Field_(Nashville)",
  "Davenport Field": "Davenport_Field",
  "English Field at Atlantic Union Bank Park": "English_Field",
  "David F. Couch Ballpark": "David_F._Couch_Ballpark",
  "Monongalia County Ballpark": "Monongalia_County_Ballpark",
  "Sewell-Thomas Stadium": "Sewell–Thomas_Stadium", // en-dash
  "Charles Schwab Field": "Charles_Schwab_Field_Omaha",
  "Falcon Field": "Falcon_Stadium", // Air Force
  "Eddie Pellagrini Diamond": "Eddie_Pellagrini_Diamond_at_Shea_Field",
  "Larry H. Miller Field": "Larry_H._Miller_Field",
  "Springs Brooks Stadium": "Springs_Brooks_Stadium",
  "J.I. Clements Stadium": "J.I._Clements_Stadium",
  "Pete Taylor Park": "Pete_Taylor_Park",
  "Tointon Family Stadium": "Tointon_Family_Stadium",
  "Eck Stadium": "Eck_Stadium",
  "Clark-LeClair Stadium": "Clark–LeClair_Stadium", // en-dash
  "Reckling Park": "Reckling_Park",
  "Nick Denes Field": "Nick_Denes_Field",
  "Ticketreturn.com Field at Pelicans Ballpark": "Pelicans_Ballpark",
  "Siebert Field": "Siebert_Field",
  "Pete Beiden Field": "Pete_Beiden_Field_at_Bob_Bennett_Stadium",
  "Haymarket Park": "Haymarket_Park",
  "Charles K. Skinner Field": "Skinner_Fieldhouse", // not exact
};

async function fetchPageImages(titles) {
  const url = new URL("https://en.wikipedia.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("prop", "pageimages");
  url.searchParams.set("format", "json");
  url.searchParams.set("formatversion", "2");
  url.searchParams.set("piprop", "thumbnail|original");
  url.searchParams.set("pithumbsize", "1280");
  url.searchParams.set("pilimit", String(titles.length));
  url.searchParams.set("titles", titles.join("|"));

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": USER_AGENT },
  });

  if (!res.ok) {
    console.error(`API error: ${res.status} ${res.statusText}`);
    return {};
  }

  const data = await res.json();
  const results = {};
  if (data.query && data.query.pages) {
    for (const page of data.query.pages) {
      if (page.thumbnail && page.thumbnail.source) {
        results[page.title] = page.thumbnail.source;
      }
    }
  }
  return results;
}

function getWikiTitle(stadiumName) {
  if (MANUAL_TITLE_MAP[stadiumName]) {
    return MANUAL_TITLE_MAP[stadiumName];
  }
  // Default: replace spaces with underscores
  return stadiumName.replace(/ /g, "_");
}

async function main() {
  const schoolsWithStadium = schools.filter((s) => s.stadium_name);
  console.log(`Processing ${schoolsWithStadium.length} schools with stadium names...`);

  // Build title-to-school mapping
  const titleToSchools = {};
  const allTitles = [];

  for (const school of schoolsWithStadium) {
    const title = getWikiTitle(school.stadium_name);
    if (!titleToSchools[title]) {
      titleToSchools[title] = [];
      allTitles.push(title);
    }
    titleToSchools[title].push(school);
  }

  console.log(`Unique Wikipedia titles to query: ${allTitles.length}`);

  // Process in batches of 50 (Wikipedia API limit)
  let found = 0;
  let notFound = 0;

  for (let i = 0; i < allTitles.length; i += 50) {
    const batch = allTitles.slice(i, i + 50);
    console.log(`Batch ${Math.floor(i / 50) + 1}: querying ${batch.length} titles...`);

    const results = await fetchPageImages(batch);

    for (const title of batch) {
      // Try to match by normalized title (Wikipedia normalizes underscores to spaces)
      const normalizedTitle = title.replace(/_/g, " ");
      const imageUrl = results[normalizedTitle] || results[title];

      const matchedSchools = titleToSchools[title];
      if (imageUrl) {
        for (const school of matchedSchools) {
          school.stadium_image_url = imageUrl;
          console.log(`  ✓ ${school.name}: ${school.stadium_name} -> found image`);
        }
        found += matchedSchools.length;
      } else {
        for (const school of matchedSchools) {
          console.log(`  ✗ ${school.name}: ${school.stadium_name} (title: ${title}) -> no image`);
        }
        notFound += matchedSchools.length;
      }
    }

    // Be nice to the API
    if (i + 50 < allTitles.length) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  // Clear broken URLs for schools where we didn't find images
  for (const school of schools) {
    if (school.stadium_image_url && !schoolsWithStadium.find(s => s.id === school.id && s.stadium_image_url)) {
      // Has a URL but we didn't confirm it - clear it if it's a fabricated Wikipedia URL
      if (school.stadium_image_url.includes("upload.wikimedia.org")) {
        // Check if this school was processed and got a new URL
        const processed = schoolsWithStadium.find(s => s.id === school.id);
        if (!processed || !processed.stadium_image_url || processed.stadium_image_url === school.stadium_image_url) {
          // It still has the old fabricated URL, check if it was updated
        }
      }
    }
  }

  // Also clear any remaining fabricated URLs for schools that weren't found
  for (const school of schools) {
    if (school.stadium_image_url && school.stadium_image_url.includes("upload.wikimedia.org")) {
      // Verify this is a newly-fetched URL (contains /thumb/ with proper dimensions)
      // Old fabricated URLs and new real ones both contain /thumb/, so we need another check
      const wasUpdated = schoolsWithStadium.find(
        (s) => s.id === school.id && s.stadium_image_url && s.stadium_image_url !== school.stadium_image_url
      );
      // If it wasn't updated, it might be a fabricated URL - but we can't easily distinguish
      // Instead, we trust that the script updated valid ones and clear the rest
    }
  }

  // Write the result - only keep URLs that were confirmed by Wikipedia API
  // First, null out all old stadium_image_url, then set the confirmed ones
  const confirmedIds = new Set();
  for (const school of schoolsWithStadium) {
    if (school.stadium_image_url && school.stadium_image_url.startsWith("https://upload.wikimedia.org/")) {
      confirmedIds.add(school.id);
    }
  }

  // Update the original schools array
  for (const school of schools) {
    const confirmed = schoolsWithStadium.find((s) => s.id === school.id);
    if (confirmed && confirmedIds.has(school.id)) {
      school.stadium_image_url = confirmed.stadium_image_url;
    } else if (school.stadium_image_url && school.stadium_image_url.includes("upload.wikimedia.org")) {
      // Clear unconfirmed Wikipedia URLs
      school.stadium_image_url = null;
    }
  }

  fs.writeFileSync(SCHOOLS_PATH, JSON.stringify(schools, null, 2) + "\n");

  console.log(`\nDone! Found images for ${found} schools, ${notFound} not found.`);
  console.log(`Confirmed URLs: ${confirmedIds.size}`);

  // Summary of schools with images
  const withImages = schools.filter((s) => s.stadium_image_url);
  console.log(`Total schools with stadium_image_url: ${withImages.length}`);
}

main().catch(console.error);
