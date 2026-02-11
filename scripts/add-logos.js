// Script to add ESPN team IDs (for logo URLs) to schools.json
// Logo URL pattern: https://a.espncdn.com/i/teamlogos/ncaa/500/{id}.png
const fs = require("fs");
const path = require("path");

const jsonPath = path.join(__dirname, "../src/data/schools.json");
const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

// ESPN team IDs (used across all ESPN sports for each school)
const espnIds = {
  // SEC
  "Alabama": 333, "Arkansas": 8, "Auburn": 2, "Florida": 57, "Georgia": 61,
  "Kentucky": 96, "LSU": 99, "Mississippi State": 344, "Missouri": 142,
  "Ole Miss": 145, "South Carolina": 2579, "Tennessee": 2633, "Texas A&M": 245,
  "Vanderbilt": 238, "Oklahoma": 201, "Texas": 251,

  // ACC
  "Boston College": 103, "California": 25, "Clemson": 228, "Duke": 150,
  "Florida State": 52, "Georgia Tech": 59, "Louisville": 97, "Miami (FL)": 2390,
  "NC State": 152, "North Carolina": 153, "Notre Dame": 87, "Pittsburgh": 221,
  "SMU": 2567, "Stanford": 24, "Syracuse": 183, "Virginia": 258,
  "Virginia Tech": 259, "Wake Forest": 154,

  // Big 12
  "Arizona": 12, "Arizona State": 9, "Baylor": 239, "BYU": 252,
  "Cincinnati": 2132, "Colorado": 38, "Houston": 248, "Kansas": 2305,
  "Kansas State": 2306, "Oklahoma State": 197, "TCU": 2628, "Texas Tech": 2641,
  "UCF": 2116, "Utah": 254, "West Virginia": 277,

  // Big Ten
  "Illinois": 356, "Indiana": 84, "Iowa": 2294, "Maryland": 120,
  "Michigan": 130, "Michigan State": 127, "Minnesota": 135, "Nebraska": 158,
  "Northwestern": 77, "Ohio State": 194, "Oregon": 2483, "Oregon State": 204,
  "Penn State": 213, "Purdue": 2509, "Rutgers": 164, "UCLA": 26,
  "USC": 30, "Washington": 264,

  // AAC
  "Army": 349, "Charlotte": 2429, "East Carolina": 151, "FAU": 2226,
  "Memphis": 235, "North Texas": 249, "Rice": 242, "South Florida": 58,
  "Temple": 218, "Tulane": 2655, "Tulsa": 202, "UAB": 5,
  "UTSA": 2636, "Wichita State": 2724,

  // Sun Belt
  "Appalachian State": 2026, "Arkansas State": 2032, "Coastal Carolina": 324,
  "Georgia Southern": 290, "Georgia State": 2247, "James Madison": 256,
  "Louisiana": 309, "Louisiana-Monroe": 2433, "Marshall": 276,
  "Old Dominion": 295, "South Alabama": 6, "Southern Miss": 2572,
  "Texas State": 326, "Troy": 2653,

  // C-USA
  "FIU": 2229, "Jacksonville State": 55, "Kennesaw State": 338,
  "Liberty": 2335, "Louisiana Tech": 2348, "Middle Tennessee": 2393,
  "New Mexico State": 166, "Sam Houston": 2534, "UTEP": 2638,
  "Western Kentucky": 98,

  // Big East
  "Butler": 2086, "Connecticut": 41, "Creighton": 156, "Georgetown": 46,
  "Providence": 2507, "Seton Hall": 2550, "St. John's": 2599,
  "Villanova": 2679, "Xavier": 2752,

  // WCC
  "Gonzaga": 2250, "LMU": 2369, "Pacific": 279, "Pepperdine": 2492,
  "Portland": 2504, "San Diego": 301, "San Francisco": 2539,
  "Santa Clara": 2541, "Saint Mary's": 2608,

  // Big West
  "Cal Poly": 13, "Cal State Bakersfield": 2934, "Cal State Fullerton": 2239,
  "Cal State Northridge": 2463, "Hawai'i": 62, "Long Beach State": 299,
  "UC Davis": 302, "UC Irvine": 300, "UC Riverside": 27,
  "UC San Diego": 2728, "UC Santa Barbara": 2540,

  // Mountain West
  "Air Force": 2005, "Fresno State": 278, "Nevada": 2440, "New Mexico": 167,
  "San Diego State": 21, "San Jose State": 23, "UNLV": 2439,

  // MVC
  "Bradley": 71, "Dallas Baptist": 2169, "Evansville": 339,
  "Illinois State": 2287, "Indiana State": 282, "Missouri State": 2623,
  "Southern Illinois": 79, "UIC": 82, "Valparaiso": 2674,

  // CAA
  "Campbell": 2097, "Charleston": 232, "Delaware": 48, "Drexel": 2182,
  "Elon": 2210, "Hampton": 2261, "Hofstra": 2275, "Monmouth": 2405,
  "NC A&T": 2448, "Northeastern": 111, "Stony Brook": 2619, "Towson": 119,
  "UNC Wilmington": 350, "William & Mary": 2729,

  // ASUN
  "Austin Peay": 2046, "Bellarmine": 91, "Central Arkansas": 2110,
  "Eastern Kentucky": 2198, "Florida Gulf Coast": 526, "Jacksonville": 294,
  "Lipscomb": 288, "North Alabama": 2453, "North Florida": 2454,
  "Stetson": 56,

  // Southern
  "Chattanooga": 236, "ETSU": 2193, "Furman": 231, "Mercer": 2382,
  "Samford": 2535, "The Citadel": 2643, "UNC Greensboro": 2459,
  "VMI": 2681, "Western Carolina": 2717, "Wofford": 2747,

  // Southland
  "Houston Christian": 2277, "Incarnate Word": 2916, "Lamar": 2320,
  "McNeese": 2377, "Nicholls": 2447, "Northwestern State": 2466,
  "SE Missouri State": 2546, "Southeastern Louisiana": 2545,
  "Texas A&M-Corpus Christi": 357,

  // WAC
  "Abilene Christian": 2000, "Grand Canyon": 2253, "Sacramento State": 16,
  "Seattle": 2547, "Southern Utah": 253, "Stephen F. Austin": 2617,
  "Tarleton State": 2627, "Utah Tech": 3101, "Utah Valley": 3084,

  // OVC
  "Lindenwood": 2815, "Little Rock": 2031, "Morehead State": 2413,
  "Murray State": 93, "SIU Edwardsville": 2565, "Southern Indiana": 88,
  "Tennessee State": 2634, "Tennessee Tech": 2635, "UT Martin": 2630,
  "Western Illinois": 2710,

  // Patriot
  "Bucknell": 2083, "Holy Cross": 107, "Lafayette": 322, "Lehigh": 2329,
  "Navy": 2426,

  // Ivy League
  "Brown": 225, "Columbia": 171, "Cornell": 172, "Dartmouth": 159,
  "Harvard": 108, "Penn": 219, "Princeton": 163, "Yale": 43,

  // Atlantic 10
  "Davidson": 2166, "Dayton": 2168, "Fordham": 2230, "George Mason": 2244,
  "George Washington": 45, "La Salle": 2325, "Loyola Chicago": 2361,
  "Massachusetts": 113, "Rhode Island": 227, "Richmond": 257,
  "Saint Joseph's": 2603, "Saint Louis": 139, "St. Bonaventure": 179,
  "VCU": 2670,

  // MAAC
  "Canisius": 2098, "Fairfield": 2217, "Iona": 314, "Manhattan": 2373,
  "Marist": 2374, "Niagara": 2450, "Quinnipiac": 2514, "Rider": 2520,
  "Siena": 2561, "Saint Peter's": 2612,

  // Horizon
  "Cleveland State": 2129, "Milwaukee": 270, "Northern Kentucky": 94,
  "Oakland": 2473, "Purdue Fort Wayne": 2870, "Wright State": 2750,
  "Youngstown State": 2754,

  // America East
  "Albany": 399, "Binghamton": 2066, "Hartford": 42, "Maine": 311,
  "NJIT": 2885, "UMBC": 2378, "UMass Lowell": 2349, "Vermont": 261,

  // NEC
  "Central Connecticut": 2115, "Fairleigh Dickinson": 2218, "LIU": 2344,
  "Sacred Heart": 2529, "Wagner": 2690,

  // Summit
  "Kansas City": 140, "North Dakota State": 2449, "Omaha": 2437,
  "Oral Roberts": 198, "South Dakota State": 2571,

  // MEAC
  "Coppin State": 2154, "Delaware State": 2178, "Howard": 47,
  "Maryland Eastern Shore": 2379, "Morgan State": 2415, "Norfolk State": 2452,
  "North Carolina Central": 2428, "South Carolina State": 2569,

  // SWAC
  "Alabama A&M": 2010, "Alabama State": 2011, "Alcorn State": 2016,
  "Arkansas-Pine Bluff": 2029, "Bethune-Cookman": 2065, "Florida A&M": 50,
  "Grambling State": 2755, "Jackson State": 2296, "Mississippi Valley State": 2400,
  "Prairie View A&M": 2504, "Southern": 2582, "Texas Southern": 2640,
};

let matched = 0;
let unmatched = [];

for (const school of data) {
  const id = espnIds[school.name];
  if (id != null) {
    school.logo_url = `https://a.espncdn.com/i/teamlogos/ncaa/500/${id}.png`;
    matched++;
  } else {
    school.logo_url = null;
    unmatched.push(school.name);
  }
}

fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
console.log(`Added logo URLs for ${matched} of ${data.length} schools.`);
if (unmatched.length > 0) {
  console.log(`\nSchools without ESPN IDs (${unmatched.length}):`);
  unmatched.forEach(n => console.log(`  - ${n}`));
}
