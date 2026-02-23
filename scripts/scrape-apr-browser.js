/**
 * NCAA APR Browser Scraper
 *
 * This script is designed to run in your browser's developer console
 * on the NCAA APR search page.
 *
 * INSTRUCTIONS:
 * 1. Go to https://web3.ncaa.org/aprsearch/aprsearch
 * 2. In the search form:
 *    - Select Sport: "Baseball"
 *    - Select Year: "2024" (or most recent available)
 *    - Leave all other fields blank/default
 *    - Click "Search"
 * 3. Wait for results to load
 * 4. Open your browser's Developer Console (F12 → Console tab)
 * 5. Paste this ENTIRE script into the console and press Enter
 * 6. It will extract all APR data from the results table and
 *    download a JSON file called "baseball-apr-2024.json"
 *
 * If results span multiple pages, the script will attempt to
 * navigate through all pages automatically.
 */

(async function scrapeAPR() {
  const results = [];

  function extractFromTable() {
    // Find the results table
    const tables = document.querySelectorAll("table");
    let dataTable = null;

    for (const table of tables) {
      const headers = table.querySelectorAll("th");
      const headerText = Array.from(headers).map(h => h.textContent.trim().toLowerCase());
      if (headerText.some(h => h.includes("apr") || h.includes("institution") || h.includes("school"))) {
        dataTable = table;
        break;
      }
    }

    if (!dataTable) {
      // Try finding by class or id patterns
      dataTable = document.querySelector("table.table, table.dataTable, #results table, .results table, table[class*='result']");
    }

    if (!dataTable) {
      console.log("No data table found. Available tables:", tables.length);
      tables.forEach((t, i) => console.log(`Table ${i}:`, t.className, t.id, t.querySelector("th")?.textContent));
      return 0;
    }

    const headers = Array.from(dataTable.querySelectorAll("thead th, tr:first-child th")).map(h => h.textContent.trim());
    console.log("Found headers:", headers);

    const rows = dataTable.querySelectorAll("tbody tr, tr:not(:first-child)");
    let count = 0;

    for (const row of rows) {
      const cells = row.querySelectorAll("td");
      if (cells.length < 2) continue;

      const rowData = {};
      cells.forEach((cell, i) => {
        const key = headers[i] || `col_${i}`;
        rowData[key] = cell.textContent.trim();
      });

      // Try to extract school name and APR score
      const schoolName = rowData["Institution"] || rowData["School"] || rowData["institution"] || rowData[headers[0]] || "";
      const aprText = rowData["Multi-Year APR"] || rowData["APR"] || rowData["Multiyear Rate"] || rowData["Multi-Year Rate"] || "";
      const apr = parseInt(aprText.replace(/,/g, ""));

      if (schoolName && !isNaN(apr)) {
        results.push({
          school_name: schoolName,
          apr: apr,
          year: "2024",
          raw: rowData
        });
        count++;
      }
    }

    return count;
  }

  // Extract from current page
  let pageCount = extractFromTable();
  console.log(`Extracted ${pageCount} records from current page. Total: ${results.length}`);

  // Check for pagination - try to go through all pages
  async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  let nextButton = document.querySelector("a.next, a[rel='next'], .pagination .next a, a:has(> span:contains('Next')), input[value='Next'], button:contains('Next')");
  // Also try finding by text content
  if (!nextButton) {
    const allLinks = document.querySelectorAll("a, button");
    for (const link of allLinks) {
      if (link.textContent.trim().toLowerCase().includes("next") || link.textContent.trim() === ">" || link.textContent.trim() === ">>") {
        nextButton = link;
        break;
      }
    }
  }

  let pageNum = 1;
  while (nextButton && !nextButton.disabled && !nextButton.classList.contains("disabled")) {
    pageNum++;
    console.log(`Navigating to page ${pageNum}...`);
    nextButton.click();
    await sleep(2000); // Wait for page to load

    pageCount = extractFromTable();
    console.log(`Extracted ${pageCount} records from page ${pageNum}. Total: ${results.length}`);

    if (pageCount === 0) break; // No more data

    // Find next button again (DOM may have changed)
    nextButton = null;
    const allLinks = document.querySelectorAll("a, button");
    for (const link of allLinks) {
      if (link.textContent.trim().toLowerCase().includes("next") || link.textContent.trim() === ">" || link.textContent.trim() === ">>") {
        nextButton = link;
        break;
      }
    }
  }

  console.log(`\nScraping complete! Total records: ${results.length}`);
  console.log("Sample:", results.slice(0, 3));

  // Format for our app
  const aprData = {};
  for (const r of results) {
    aprData[r.school_name] = {
      school_name: r.school_name,
      apr: r.apr,
      year: r.year
    };
  }

  // Download as JSON
  const blob = new Blob([JSON.stringify(aprData, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "baseball-apr-2024.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  console.log("\nJSON file downloaded! Place it at: src/data/baseball-apr.json in your project.");
  console.log("Then the API will use this local data instead of fetching from the NCAA S3 CSV.");

  return results;
})();
