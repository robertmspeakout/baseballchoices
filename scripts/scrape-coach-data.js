const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'src', 'data', 'schools.json');
const schools = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Throttle concurrent requests
const CONCURRENCY = 5;
const DELAY_MS = 500;
const TIMEOUT_MS = 10000;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch a URL with timeout and browser-like headers.
 */
async function fetchPage(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Extract tenure start year from page text.
 * Looks for patterns like:
 *   "5th Season" / "1st Year" → compute start year
 *   "2019-Present" / "(2019-)" → direct year
 *   "since 2019" → direct year
 */
function extractTenureStart(text, coachName) {
  const currentYear = new Date().getFullYear();
  const nameParts = coachName.toLowerCase().split(/\s+/);
  const lastName = nameParts[nameParts.length - 1];

  // Narrow to text within ~800 chars of the coach's last name
  const lowerText = text.toLowerCase();
  const nameIdx = lowerText.indexOf(lastName);
  if (nameIdx === -1) return null;

  const start = Math.max(0, nameIdx - 400);
  const end = Math.min(text.length, nameIdx + 800);
  const section = text.substring(start, end);

  // Pattern 1: "Xth Season" or "Xth Year" (ordinal + Season/Year)
  const ordinalMatch = section.match(/(\d{1,2})(?:st|nd|rd|th)\s+(?:season|year)/i);
  if (ordinalMatch) {
    const seasonNum = parseInt(ordinalMatch[1]);
    if (seasonNum >= 1 && seasonNum <= 60) {
      return currentYear - seasonNum + 1;
    }
  }

  // Pattern 2: "Year range" like "2019-Present" or "2019-" or "(2019-present)"
  const rangeMatch = section.match(/\b((?:19|20)\d{2})\s*[-–—]\s*(?:present|pres\.?|now|\))/i);
  if (rangeMatch) {
    const year = parseInt(rangeMatch[1]);
    if (year >= 1960 && year <= currentYear) {
      return year;
    }
  }

  // Pattern 3: "since YYYY"
  const sinceMatch = section.match(/since\s+((?:19|20)\d{2})/i);
  if (sinceMatch) {
    const year = parseInt(sinceMatch[1]);
    if (year >= 1960 && year <= currentYear) {
      return year;
    }
  }

  // Pattern 4: "appointed/named/hired in YYYY" or "appointed/named/hired YYYY"
  const appointedMatch = section.match(/(?:appointed|named|hired)(?:\s+(?:head\s+coach|as\s+head\s+coach))?\s+(?:in\s+)?((?:19|20)\d{2})/i);
  if (appointedMatch) {
    const year = parseInt(appointedMatch[1]);
    if (year >= 1960 && year <= currentYear) {
      return year;
    }
  }

  return null;
}

/**
 * Extract career head coaching record from page text.
 * Looks for patterns like:
 *   "Overall Record: 245-123"
 *   "Career Record: 245-123-2"
 *   "Record at School: 100-50"
 *   "123-45 (.732)"
 */
function extractRecord(text, coachName) {
  const nameParts = coachName.toLowerCase().split(/\s+/);
  const lastName = nameParts[nameParts.length - 1];

  const lowerText = text.toLowerCase();
  const nameIdx = lowerText.indexOf(lastName);
  if (nameIdx === -1) return null;

  const start = Math.max(0, nameIdx - 400);
  const end = Math.min(text.length, nameIdx + 1200);
  const section = text.substring(start, end);

  // Pattern 1: Labeled record "Overall/Career/Head Coaching Record: W-L" or "W-L-T"
  const labeledMatch = section.match(/(?:overall|career|head\s+coaching|coaching)\s+record[:\s]+(\d{1,4})\s*[-–]\s*(\d{1,4})(?:\s*[-–]\s*(\d{1,3}))?/i);
  if (labeledMatch) {
    const w = parseInt(labeledMatch[1]);
    const l = parseInt(labeledMatch[2]);
    const t = labeledMatch[3] ? parseInt(labeledMatch[3]) : 0;
    if (w + l >= 5 && w + l <= 5000) {
      return t > 0 ? `${w}-${l}-${t}` : `${w}-${l}`;
    }
  }

  // Pattern 2: "Record at [school]: W-L"
  const atSchoolMatch = section.match(/record\s+at\s+\w[^:]{0,40}[:\s]+(\d{1,4})\s*[-–]\s*(\d{1,4})(?:\s*[-–]\s*(\d{1,3}))?/i);
  if (atSchoolMatch) {
    const w = parseInt(atSchoolMatch[1]);
    const l = parseInt(atSchoolMatch[2]);
    const t = atSchoolMatch[3] ? parseInt(atSchoolMatch[3]) : 0;
    if (w + l >= 5 && w + l <= 5000) {
      return t > 0 ? `${w}-${l}-${t}` : `${w}-${l}`;
    }
  }

  // Pattern 3: W-L near "record" keyword (within a shorter range)
  const recordNearby = section.match(/record[^.]{0,30}?(\d{2,4})\s*[-–]\s*(\d{1,4})(?:\s*[-–]\s*(\d{1,3}))?/i);
  if (recordNearby) {
    const w = parseInt(recordNearby[1]);
    const l = parseInt(recordNearby[2]);
    const t = recordNearby[3] ? parseInt(recordNearby[3]) : 0;
    if (w + l >= 5 && w + l <= 5000) {
      return t > 0 ? `${w}-${l}-${t}` : `${w}-${l}`;
    }
  }

  return null;
}

/**
 * Strip HTML tags and decode basic entities to get plain text.
 */
function htmlToText(html) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&ndash;/g, '-')
    .replace(/&mdash;/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Process a single school: fetch coaches page, extract data.
 */
async function processSchool(school) {
  if (!school.website || !school.head_coach_name) {
    return { name: school.name, tenure: null, record: null, skipped: true };
  }

  const baseUrl = school.website.replace(/\/$/, '');

  // Try multiple URL patterns for the coaches page
  const urls = [
    `${baseUrl}/coaches`,
    `${baseUrl}/roster/coaches`,
    `${baseUrl}/coaches/`,
  ];

  for (const url of urls) {
    const html = await fetchPage(url);
    if (!html) continue;

    const text = htmlToText(html);
    const tenure = extractTenureStart(text, school.head_coach_name);
    const record = extractRecord(text, school.head_coach_name);

    if (tenure || record) {
      return { name: school.name, tenure, record, url };
    }
  }

  // Fallback: try the main sport page itself (some sites have coach info there)
  const mainHtml = await fetchPage(baseUrl);
  if (mainHtml) {
    const text = htmlToText(mainHtml);
    const tenure = extractTenureStart(text, school.head_coach_name);
    const record = extractRecord(text, school.head_coach_name);
    if (tenure || record) {
      return { name: school.name, tenure, record, url: baseUrl };
    }
  }

  return { name: school.name, tenure: null, record: null };
}

/**
 * Process schools in batches with throttling.
 */
async function processAll() {
  console.log(`Processing ${schools.length} schools...\n`);

  let updated = 0;
  let tenureFound = 0;
  let recordFound = 0;
  let errors = 0;

  for (let i = 0; i < schools.length; i += CONCURRENCY) {
    const batch = schools.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map(s => processSchool(s)));

    for (let j = 0; j < results.length; j++) {
      const result = results[j];
      const school = batch[j];

      if (result.skipped) continue;

      if (result.tenure) {
        school.head_coach_tenure_start = result.tenure;
        tenureFound++;
      }
      if (result.record) {
        school.head_coach_record = result.record;
        recordFound++;
      }

      if (result.tenure || result.record) {
        updated++;
        console.log(`  ✓ ${school.name}: tenure=${result.tenure || 'N/A'}, record=${result.record || 'N/A'} (${result.url})`);
      }
    }

    const processed = Math.min(i + CONCURRENCY, schools.length);
    if (processed % 50 === 0 || processed === schools.length) {
      console.log(`\n  [${processed}/${schools.length}] ${tenureFound} tenures, ${recordFound} records found so far\n`);
    }

    if (i + CONCURRENCY < schools.length) {
      await sleep(DELAY_MS);
    }
  }

  // Write updated data
  fs.writeFileSync(dataPath, JSON.stringify(schools, null, 2) + '\n');

  console.log(`\n--- Results ---`);
  console.log(`Schools processed: ${schools.length}`);
  console.log(`Schools updated:   ${updated}`);
  console.log(`Tenures found:     ${tenureFound}`);
  console.log(`Records found:     ${recordFound}`);
  console.log(`\nData saved to ${dataPath}`);
}

processAll().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
