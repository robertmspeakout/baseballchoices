#!/usr/bin/env node
// Downloads NCAA APR public data and extracts baseball program APR scores
const https = require("https");
const fs = require("fs");
const path = require("path");

const CSV_URL = "https://ncaaorg.s3.amazonaws.com/research/academics/2020RES_APR2019PubDataShare.csv";

function download(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location).then(resolve).catch(reject);
      }
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(data));
      res.on("error", reject);
    }).on("error", reject);
  });
}

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

async function main() {
  console.log("Downloading NCAA APR data from S3...");
  const csv = await download(CSV_URL);
  const lines = csv.split("\n");
  const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));

  console.log(`CSV has ${lines.length} rows, ${headers.length} columns`);

  const baseball = {};
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (!values || values.length < 10) continue;

    const row = {};
    headers.forEach((h, idx) => (row[h] = values[idx]));

    // Filter for baseball (SPORT_CODE = 1)
    if (row.SPORT_CODE === "1") {
      const name = row.SCL_NAME;
      const apr = parseInt(row.MULTIYR_APR_RATE_1000_OFFICIAL);
      if (name && !isNaN(apr)) {
        // Use lowercase name as key for easier matching
        baseball[name] = {
          school_name: name,
          apr: apr,
          year: row.ACADEMIC_YEAR || "2019",
          squad_size: parseInt(row.MULTIYR_SQUAD_SIZE) || null,
          eligibility_rate: parseFloat(row.MULTIYR_ELIG_RATE) || null,
          retention_rate: parseFloat(row.MULTIYR_RET_RATE) || null,
        };
      }
    }
  }

  const count = Object.keys(baseball).length;
  console.log(`Found ${count} baseball programs with APR data`);

  const outPath = path.join(__dirname, "..", "src", "data", "baseball-apr.json");
  fs.writeFileSync(outPath, JSON.stringify(baseball, null, 2));
  console.log(`Saved to ${outPath}`);

  // Show a few examples
  const examples = Object.values(baseball).slice(0, 5);
  examples.forEach((e) => console.log(`  ${e.school_name}: APR ${e.apr}`));
}

main().catch(console.error);
