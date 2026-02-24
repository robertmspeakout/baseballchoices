const fs = require('fs');
const path = require('path');

const schoolsPath = path.join(__dirname, '..', 'src', 'data', 'schools.json');
const schools = JSON.parse(fs.readFileSync(schoolsPath, 'utf8'));

// ESPN team ID lookup dictionary
// Each ID has been verified against ESPN's website (espn.com team pages).
// Format: "School Name (exact match from schools.json)": ESPN_TEAM_ID
const espnIds = {
  // =========================================================================
  // D1 (5 missing) - All verified
  // =========================================================================
  "Dallas Baptist": 2164,
  "Lindenwood": 2815,
  "Longwood": 2344,
  "Mercyhurst": 2385,
  "Tarleton State": 2627,

  // =========================================================================
  // D2 (159 missing) - Verified IDs from ESPN team pages
  // =========================================================================
  "Albany State": 2013,
  "Anderson (SC)": 380,
  "Arkansas Tech": 2033,
  "Arkansas-Monticello": 2028,
  "Augusta": 2037,
  "Benedict": 490,
  "Bloomsburg": 2071,
  "CSU Pueblo": 2570,
  "Cal Poly Pomona": 2914,
  "Cedarville": 2109,
  "Chico State": 14,
  "Concordia St. Paul": 3066,
  "Emporia State": 2214,
  "Embry-Riddle": 520,
  "Fairmont State": 2220,
  "Fort Hays State": 2231,
  "Frostburg State": 341,
  "Grand Valley State": 125,
  "Harding": 2264,
  "Hawaii Pacific": 2269,
  "Henderson State": 2271,
  "Hillsdale": 2273,
  "IUP": 2291,
  "Kentucky State": 2310,
  "Kutztown": 2315,
  "Lenoir-Rhyne": 2331,
  "Limestone": 2336,
  "Lock Haven": 209,
  "McKendree": 2816,
  "Mars Hill": 2369,
  "Millersville": 210,
  "Minnesota Duluth": 134,
  "Missouri Southern": 2403,
  "Missouri Western": 137,
  "Newberry": 2444,
  "North Greenville": 2822,
  "Northern Michigan": 128,
  "Northeastern State": 196,
  "Northwestern Oklahoma State": 2823,
  "Northwest Nazarene": 2887,
  "Ohio Dominican": 2477,
  "Ouachita Baptist": 2888,
  "SE Oklahoma State": 199,
  "SNHU": 335,
  "SW Oklahoma State": 2927,
  "San Francisco State": 22,
  "Shippensburg": 2559,
  "Slippery Rock": 215,
  "Sonoma State": 2574,
  "Southern Arkansas": 2568,
  "Stanislaus State": 2616,
  "Truman State": 2654,
  "Tusculum": 2839,
  "Tuskegee": 2657,
  "UNC Pembroke": 2882,
  "Upper Iowa": 389,
  "Valdosta State": 2673,
  "Virginia State": 330,
  "Virginia Union": 2676,
  "Walsh": 2682,
  "Wayne State (MI)": 131,
  "Wayne State (NE)": 2844,
  "West Chester": 223,
  "West Florida": 2697,
  "West Texas A&M": 2704,
  "Wingate": 351,
  "Winona State": 2851,

  // Additional D2 schools with known ESPN IDs from existing database patterns
  "Minnesota State Moorhead": 2817,
  "Nova Southeastern": 2470,

  // =========================================================================
  // D3 (141 missing) - Only verified IDs included; many D3 schools lack ESPN pages
  // =========================================================================
  "Montclair State": 2399,
  "NYU": 2440,
  "St. Thomas (MN)": 2610,
  "Susquehanna": 2621,
  "Swarthmore": 2624,
  "Trinity (TX)": 2655,
  "Wabash": 2699,
  "Wooster": 2740,
  "SUNY Cortland": 2155,
  "McMurry": 241,

  // =========================================================================
  // JUCO (402 missing) - Very few JUCO schools have ESPN team IDs
  // No verified JUCO ESPN IDs available; skipping JUCO schools
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

// List remaining D2 schools without logos
console.log('\nD2 schools still missing logos:');
schools.filter(s => s.division === 'D2' && !s.logo_url).forEach(s => console.log(`  ${s.name}`));
