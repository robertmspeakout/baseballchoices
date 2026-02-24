const fs = require('fs');
const path = require('path');

const schoolsPath = path.join(__dirname, '..', 'src', 'data', 'schools.json');
const schools = JSON.parse(fs.readFileSync(schoolsPath, 'utf8'));

// ESPN team ID lookup dictionary
// Each ID has been verified against ESPN's website (espn.com team pages for
// football, men's basketball, or women's basketball).
// Format: "School Name (exact match from schools.json)": ESPN_TEAM_ID
//
// Logo URL: https://a.espncdn.com/i/teamlogos/ncaa/500/{ESPN_TEAM_ID}.png

const espnIds = {
  // =========================================================================
  // D1 (5 missing)
  // =========================================================================
  "Dallas Baptist": 2164,
  "Lindenwood": 2815,
  "Longwood": 2344,
  "Mercyhurst": 2385,
  "Tarleton State": 2627,

  // =========================================================================
  // D2 (159 missing)
  // =========================================================================
  "Albany State": 2013,
  "Anderson (SC)": 380,
  "Arkansas Tech": 2033,
  "Arkansas-Monticello": 2028,
  "Augusta": 2041,
  "Benedict": 490,
  "Bloomsburg": 2071,
  "Bluefield State": 2073,
  "CSU Pueblo": 2570,
  "Cal Poly Pomona": 2914,
  "Cedarville": 2109,
  "Charleston (WV)": 2128,
  "Chico State": 14,
  "Concord": 2148,
  "Concordia St. Paul": 3066,
  "Davis & Elkins": 2167,
  "Eastern New Mexico": 2201,
  "Eckerd": 2204,
  "Embry-Riddle": 520,
  "Emporia State": 2214,
  "Fairmont State": 2986,
  "Flagler": 2228,
  "Glenville State": 2249,
  "Hawaii Pacific": 2269,
  "Hillsdale": 2273,
  "IUP": 2291,
  "Kentucky State": 2310,
  "Kutztown": 2315,
  "Lenoir-Rhyne": 2331,
  "Limestone": 2336,
  "Lincoln (MO)": 2876,
  "Mars Hill": 2369,
  "McKendree": 2816,
  "Millersville": 210,
  "Minnesota Duluth": 134,
  "Minot State": 568,
  "Molloy": 2404,
  "Montevallo": 2409,
  "North Greenville": 2822,
  "Northeastern State": 196,
  "Northwest Nazarene": 2887,
  "Northwestern Oklahoma State": 2823,
  "Ohio Dominican": 2477,
  "Oklahoma Baptist": 319,
  "Ouachita Baptist": 2888,
  "Pace": 2487,
  "SE Oklahoma State": 199,
  "SNHU": 335,
  "SW Oklahoma State": 2927,
  "Saint Leo": 2605,
  "San Francisco State": 22,
  "Shepherd": 2974,
  "Shippensburg": 2559,
  "Slippery Rock": 215,
  "Sonoma State": 2574,
  "Southern Arkansas": 2568,
  "Southern Connecticut": 2583,
  "Southern Nazarene": 200,
  "Stanislaus State": 2616,
  "Texas A&M-Kingsville": 2658,
  "Truman State": 2654,
  "Tusculum": 2839,
  "Tuskegee": 2657,
  "UNC Pembroke": 2882,
  "UT Permian Basin": 110243,
  "Upper Iowa": 389,
  "Valdosta State": 2673,
  "Virginia State": 330,
  "WV State": 2707,
  "WV Wesleyan": 455,
  "Walsh": 2682,
  "Wayne State (MI)": 131,
  "Wayne State (NE)": 2844,
  "West Chester": 223,
  "West Florida": 2697,
  "West Texas A&M": 2704,
  "Western Oregon": 2848,
  "Wheeling": 2719,
  "William Jewell": 2911,
  "Wingate": 351,
  "Winona State": 2851,
  "Young Harris": 3219,

  // Additional D2 schools verified in subsequent searches
  "Barton": 2054,
  "Belmont Abbey": 2058,
  "Biola": 2067,
  "CSU Dominguez Hills": 2092,
  "CSU San Marcos": 3182,
  "Chaminade": 2124,
  "Claflin": 2133,
  "Clark Atlanta": 2805,
  "Coker": 229,
  "Davenport": 110254,
  "Edward Waters": 2206,
  "Fresno Pacific": 2235,
  "Georgia College": 2246,
  "Georgia Southwestern": 3068,
  "Hawaii Hilo": 2267,
  "Lake Erie": 437,
  "Lander": 2322,
  "Lincoln (PA)": 2339,
  "Malone": 556,
  "Metro State Denver": 2389,
  "Miles": 2396,
  "Mount Olive": 2418,
  "Newman": 580,
  "North Georgia": 2455,
  "Palm Beach Atlantic": 2489,
  "Regis": 2518,
  "Shorter": 2560,
  "Trevecca Nazarene": 2906,
  "American International": 2022,
  "Arkansas-Fort Smith": 3157,
  "Bridgeport": 2078,
  "Colorado Christian": 2862,
  "Concordia Irvine": 506,
  "CSU Monterey Bay": 2863,
  "CSU San Bernardino": 2536,
  "Cal State LA": 2345,
  "Cal U (PA)": 2858,
  "D'Youville": 126796,
  "Dominican (NY)": 2179,
  "Goldey-Beacom": 108859,
  "Lubbock Christian": 2878,
  "Mary": 559,
  "Minnesota Crookston": 2772,
  "New Mexico Highlands": 2424,
  "King (TN)": 2312,
  "Mansfield": 2365,
  "Oklahoma Christian": 589,
  "Saint Anselm": 2830,
  "Pitt-Johnstown": 2498,
  "Point Loma": 2500,
  "Southern Wesleyan": 2576,
  "Texas A&M International": 3082,
  "Thomas More": 2646,
  "UAH": 2008,
  "UCCS": 2145,
  "UIS": 542,
  "UT Tyler": 3086,
  "UVA Wise": 2842,
  "Westmont": 2716,
  "Wilmington (DE)": 2732,
  "Wisconsin-Parkside": 2742,

  // =========================================================================
  // D3 (141 missing) - Only schools with verified ESPN IDs
  // =========================================================================
  "Montclair State": 2399,
  "NYU": 2440,
  "St. Thomas (MN)": 2610,
  "SUNY Cortland": 2155,
  "McMurry": 241,

  // =========================================================================
  // JUCO (402 missing) - Most JUCO schools do not have ESPN team pages
  // No verified JUCO ESPN IDs available
  // =========================================================================
};

let updated = 0;
const updatedSchools = [];
for (const school of schools) {
  if (school.logo_url) continue;
  const id = espnIds[school.name];
  if (id) {
    school.logo_url = `https://a.espncdn.com/i/teamlogos/ncaa/500/${id}.png`;
    updated++;
    updatedSchools.push(`  ${school.division}: ${school.name} (ID: ${id})`);
  }
}

fs.writeFileSync(schoolsPath, JSON.stringify(schools, null, 2) + '\n');

console.log(`Updated ${updated} schools with ESPN logos.\n`);
console.log('Schools updated:');
updatedSchools.forEach(s => console.log(s));

// Show remaining gaps
console.log('\nRemaining gaps by division:');
const divisions = ['D1', 'D2', 'D3', 'JUCO'];
for (const div of divisions) {
  const total = schools.filter(s => s.division === div).length;
  const missing = schools.filter(s => s.division === div && !s.logo_url).length;
  const hasLogo = total - missing;
  console.log(`  ${div}: ${hasLogo}/${total} have logos (${missing} still missing)`);
}

// List remaining schools without logos (D1 and D2 only)
const d1Missing = schools.filter(s => s.division === 'D1' && !s.logo_url);
if (d1Missing.length > 0) {
  console.log('\nD1 schools still missing logos:');
  d1Missing.forEach(s => console.log(`  ${s.name}`));
}

const d2Missing = schools.filter(s => s.division === 'D2' && !s.logo_url);
if (d2Missing.length > 0) {
  console.log('\nD2 schools still missing logos:');
  d2Missing.forEach(s => console.log(`  ${s.name}`));
}
