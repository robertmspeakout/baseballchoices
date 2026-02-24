#!/usr/bin/env node

/**
 * Coach Contact Scraper
 *
 * Visits each school's coaching staff page ({website}/coaches) and extracts
 * real email addresses and phone numbers for the head baseball coach.
 * Updates src/data/schools.json with the found data.
 *
 * Prerequisites:
 *   npm install puppeteer
 *
 * Usage:
 *   node scripts/scrape-coach-contacts.js              # scrape all schools
 *   node scripts/scrape-coach-contacts.js --division D1 # scrape D1 only
 *   node scripts/scrape-coach-contacts.js --start 100   # start from index 100 (resume)
 *   node scripts/scrape-coach-contacts.js --dry-run      # preview without saving
 */

const fs = require("fs");
const path = require("path");

const SCHOOLS_PATH = path.join(__dirname, "..", "src", "data", "schools.json");
const RESULTS_PATH = path.join(__dirname, "..", "scripts", "scrape-results.json");
const CONCURRENCY = 3; // how many pages to scrape at once
const PAGE_TIMEOUT = 20000; // 20 seconds per page
const DELAY_BETWEEN_BATCHES = 2000; // 2s pause between batches to be polite

// Parse CLI args
const args = process.argv.slice(2);
const divisionFilter = args.includes("--division") ? args[args.indexOf("--division") + 1] : null;
const startIndex = args.includes("--start") ? parseInt(args[args.indexOf("--start") + 1]) : 0;
const dryRun = args.includes("--dry-run");

// Phone number regex: matches US phone formats like (205) 348-4029, 205-348-4029, 205.348.4029
const PHONE_REGEX = /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;

// Email regex
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// Generic email patterns to skip
const GENERIC_PATTERNS = [
  /^baseball@/i,
  /^athletics@/i,
  /^sports@/i,
  /^info@/i,
  /^tickets@/i,
  /^compliance@/i,
  /^recruiting@/i,
  /^admissions@/i,
  /^support@/i,
  /^media@/i,
  /^marketing@/i,
  /^noreply@/i,
  /^no-reply@/i,
];

function isGenericEmail(email) {
  return GENERIC_PATTERNS.some((pat) => pat.test(email));
}

function normalizePhone(phone) {
  // Strip to digits
  const digits = phone.replace(/\D/g, "");
  // Format as (XXX) XXX-XXXX
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits[0] === "1") {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phone; // return as-is if we can't normalize
}

async function scrapeCoachesPage(browser, url, coachName) {
  const page = await browser.newPage();
  const result = { email: null, phone: null, allEmails: [], allPhones: [] };

  try {
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    await page.goto(url, { waitUntil: "networkidle2", timeout: PAGE_TIMEOUT });

    // Wait a moment for any Vue.js rendering
    await new Promise((r) => setTimeout(r, 2000));

    // Get all page text content
    const pageContent = await page.evaluate(() => document.body?.innerText || "");
    const pageHTML = await page.evaluate(() => document.body?.innerHTML || "");

    // Extract all emails from the page
    const emailsFromText = pageContent.match(EMAIL_REGEX) || [];
    const emailsFromHTML = pageHTML.match(EMAIL_REGEX) || [];
    const allEmails = [...new Set([...emailsFromText, ...emailsFromHTML])].map((e) => e.toLowerCase());
    result.allEmails = allEmails;

    // Extract all phone numbers
    const phonesFromText = pageContent.match(PHONE_REGEX) || [];
    result.allPhones = phonesFromText.map(normalizePhone);

    // Try to find coach-specific section
    // Strategy: look for the head coach name on the page, then grab nearby emails/phones
    if (coachName) {
      const nameParts = coachName.toLowerCase().split(/\s+/);
      const lastName = nameParts[nameParts.length - 1];
      const firstName = nameParts[0];

      // Look for emails that contain the coach's name
      const personalEmails = allEmails.filter((e) => {
        const local = e.split("@")[0].toLowerCase();
        return (
          !isGenericEmail(e) &&
          (local.includes(lastName) || local.includes(firstName) || (firstName.length > 2 && local.includes(firstName[0] + lastName)))
        );
      });

      if (personalEmails.length > 0) {
        result.email = personalEmails[0];
      }

      // If no name-based email found, try to find the coach section in HTML
      // and grab the first non-generic email near their name
      if (!result.email) {
        const sections = pageHTML.split(/Head Coach|head coach|HEAD COACH/i);
        if (sections.length > 1) {
          // Look in the section after "Head Coach" label
          const coachSection = sections[1].substring(0, 2000); // first 2000 chars after "Head Coach"
          const sectionEmails = (coachSection.match(EMAIL_REGEX) || []).map((e) => e.toLowerCase());
          const nonGeneric = sectionEmails.filter((e) => !isGenericEmail(e));
          if (nonGeneric.length > 0) {
            result.email = nonGeneric[0];
          }
        }
      }

      // If still no email, try any non-generic email on the page
      // (only if there's just one, to avoid grabbing the wrong one)
      if (!result.email) {
        const nonGeneric = allEmails.filter((e) => !isGenericEmail(e));
        if (nonGeneric.length === 1) {
          result.email = nonGeneric[0];
        }
      }

      // For phone: try to find one near the head coach section
      // Look at the full text, find the head coach name, then look for nearby phones
      const textLines = pageContent.split("\n");
      let coachLineIdx = -1;
      for (let i = 0; i < textLines.length; i++) {
        if (textLines[i].toLowerCase().includes(lastName) && (textLines[i].toLowerCase().includes("head coach") || (i > 0 && textLines[i - 1].toLowerCase().includes("head coach")))) {
          coachLineIdx = i;
          break;
        }
      }
      if (coachLineIdx === -1) {
        // fallback: just find the line with the coach's last name
        for (let i = 0; i < textLines.length; i++) {
          if (textLines[i].toLowerCase().includes(lastName)) {
            coachLineIdx = i;
            break;
          }
        }
      }

      if (coachLineIdx >= 0) {
        // Search within 10 lines of the coach's name for a phone number
        const nearbyText = textLines.slice(coachLineIdx, coachLineIdx + 10).join("\n");
        const nearbyPhones = nearbyText.match(PHONE_REGEX) || [];
        if (nearbyPhones.length > 0) {
          result.phone = normalizePhone(nearbyPhones[0]);
        }
      }

      // If no phone found near coach, and there's only one phone on the page, use it
      if (!result.phone && result.allPhones.length === 1) {
        result.phone = result.allPhones[0];
      }
    }
  } catch (err) {
    result.error = err.message;
  } finally {
    await page.close();
  }

  return result;
}

async function main() {
  // Dynamically import puppeteer
  let puppeteer;
  try {
    puppeteer = require("puppeteer");
  } catch {
    console.error("ERROR: puppeteer is not installed.");
    console.error("Run: npm install puppeteer");
    console.error("Then try again.");
    process.exit(1);
  }

  // Load schools
  const schools = JSON.parse(fs.readFileSync(SCHOOLS_PATH, "utf-8"));
  console.log(`Loaded ${schools.length} schools`);

  // Filter to schools with websites
  let targets = schools
    .map((s, idx) => ({ ...s, _idx: idx }))
    .filter((s) => s.website && s.head_coach_name);

  if (divisionFilter) {
    targets = targets.filter((s) => s.division === divisionFilter);
    console.log(`Filtered to ${targets.length} ${divisionFilter} schools with websites and coaches`);
  } else {
    console.log(`${targets.length} schools have websites and coach names`);
  }

  targets = targets.slice(startIndex);
  console.log(`Starting from index ${startIndex}, processing ${targets.length} schools`);

  if (dryRun) {
    console.log("DRY RUN: will not save changes");
  }

  // Load previous results if resuming
  let results = {};
  if (fs.existsSync(RESULTS_PATH)) {
    results = JSON.parse(fs.readFileSync(RESULTS_PATH, "utf-8"));
    console.log(`Loaded ${Object.keys(results).length} previous results`);
  }

  // Launch browser
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  let updated = 0;
  let errors = 0;
  let skipped = 0;

  // Process in batches
  for (let i = 0; i < targets.length; i += CONCURRENCY) {
    const batch = targets.slice(i, i + CONCURRENCY);

    const promises = batch.map(async (school) => {
      // Skip if we already have results for this school
      if (results[school.id] && !results[school.id].error) {
        skipped++;
        return;
      }

      const url = `${school.website}/coaches`;
      const tag = `[${i + batch.indexOf(school) + startIndex + 1}/${targets.length + startIndex}]`;

      try {
        console.log(`${tag} Scraping ${school.name} (${school.division}): ${url}`);
        const result = await scrapeCoachesPage(browser, url, school.head_coach_name);

        results[school.id] = {
          name: school.name,
          coach: school.head_coach_name,
          url,
          email: result.email,
          phone: result.phone,
          allEmails: result.allEmails,
          allPhones: result.allPhones,
          error: result.error || null,
          scrapedAt: new Date().toISOString(),
        };

        if (result.email || result.phone) {
          console.log(`  ✓ Found: email=${result.email || "none"}, phone=${result.phone || "none"}`);
          updated++;
        } else if (result.error) {
          console.log(`  ✗ Error: ${result.error}`);
          errors++;
        } else {
          console.log(`  - No personal contact info found (${result.allEmails.length} emails, ${result.allPhones.length} phones on page)`);
        }
      } catch (err) {
        console.log(`  ✗ Failed: ${err.message}`);
        errors++;
      }
    });

    await Promise.all(promises);

    // Save progress after each batch
    if (!dryRun) {
      fs.writeFileSync(RESULTS_PATH, JSON.stringify(results, null, 2));
    }

    // Be polite - wait between batches
    if (i + CONCURRENCY < targets.length) {
      await new Promise((r) => setTimeout(r, DELAY_BETWEEN_BATCHES));
    }
  }

  await browser.close();

  // Summary
  console.log("\n=== SUMMARY ===");
  console.log(`Total processed: ${targets.length}`);
  console.log(`Found contact info: ${updated}`);
  console.log(`Errors: ${errors}`);
  console.log(`Skipped (already scraped): ${skipped}`);

  if (dryRun) {
    console.log("\nDry run complete. No changes saved.");
    return;
  }

  // Save intermediate results
  fs.writeFileSync(RESULTS_PATH, JSON.stringify(results, null, 2));
  console.log(`\nResults saved to ${RESULTS_PATH}`);
  console.log("Run: node scripts/apply-coach-contacts.js  to apply results to schools.json");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
