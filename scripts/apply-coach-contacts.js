#!/usr/bin/env node

/**
 * Apply Coach Contacts
 *
 * Reads the scrape results from scrape-results.json and applies them
 * to src/data/schools.json. Also adds the head_coach_phone field.
 *
 * Usage:
 *   node scripts/apply-coach-contacts.js              # apply all results
 *   node scripts/apply-coach-contacts.js --dry-run     # preview changes without saving
 *   node scripts/apply-coach-contacts.js --report       # show summary report only
 */

const fs = require("fs");
const path = require("path");

const SCHOOLS_PATH = path.join(__dirname, "..", "src", "data", "schools.json");
const RESULTS_PATH = path.join(__dirname, "scrape-results.json");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const reportOnly = args.includes("--report");

// Generic email patterns
const GENERIC_PATTERNS = [
  /^baseball@/i,
  /^athletics@/i,
  /^sports@/i,
  /^info@/i,
  /^tickets@/i,
  /^compliance@/i,
  /^recruiting@/i,
];

function isGenericEmail(email) {
  return GENERIC_PATTERNS.some((pat) => pat.test(email));
}

function main() {
  if (!fs.existsSync(RESULTS_PATH)) {
    console.error(`ERROR: ${RESULTS_PATH} not found.`);
    console.error("Run the scraper first: node scripts/scrape-coach-contacts.js");
    process.exit(1);
  }

  const schools = JSON.parse(fs.readFileSync(SCHOOLS_PATH, "utf-8"));
  const results = JSON.parse(fs.readFileSync(RESULTS_PATH, "utf-8"));

  console.log(`Schools: ${schools.length}`);
  console.log(`Scrape results: ${Object.keys(results).length}`);

  let emailsUpdated = 0;
  let phonesAdded = 0;
  let emailsSkipped = 0;
  const changes = [];

  for (const school of schools) {
    const result = results[school.id];
    if (!result) continue;

    let emailChanged = false;
    let phoneChanged = false;

    // Update email if we found a better (non-generic) one
    if (result.email) {
      const currentEmail = school.head_coach_email || "";
      const isCurrentGeneric = !currentEmail || isGenericEmail(currentEmail);
      const isNewGeneric = isGenericEmail(result.email);

      if (isCurrentGeneric && !isNewGeneric) {
        if (!reportOnly && !dryRun) {
          school.head_coach_email = result.email;
        }
        emailChanged = true;
        emailsUpdated++;
        changes.push({
          school: school.name,
          field: "email",
          old: currentEmail || "(none)",
          new: result.email,
        });
      } else if (!isCurrentGeneric) {
        emailsSkipped++;
      }
    }

    // Add phone if found
    if (result.phone) {
      if (!school.head_coach_phone) {
        if (!reportOnly && !dryRun) {
          school.head_coach_phone = result.phone;
        }
        phoneChanged = true;
        phonesAdded++;
        changes.push({
          school: school.name,
          field: "phone",
          old: "(none)",
          new: result.phone,
        });
      }
    }
  }

  // Print changes
  if (changes.length > 0) {
    console.log(`\n=== CHANGES (${changes.length}) ===\n`);
    for (const c of changes) {
      console.log(`${c.school}: ${c.field} "${c.old}" -> "${c.new}"`);
    }
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Emails updated (generic -> personal): ${emailsUpdated}`);
  console.log(`Phone numbers added: ${phonesAdded}`);
  console.log(`Emails skipped (already personal): ${emailsSkipped}`);

  if (reportOnly) {
    console.log("\nReport only mode — no changes saved.");
    return;
  }

  if (dryRun) {
    console.log("\nDry run — no changes saved.");
    return;
  }

  // Save updated schools.json
  fs.writeFileSync(SCHOOLS_PATH, JSON.stringify(schools, null, 2) + "\n");
  console.log(`\nUpdated ${SCHOOLS_PATH}`);
  console.log("Don't forget to commit the changes!");
}

main();
