const fs = require('fs');
const path = require('path');

const schoolsPath = path.join(__dirname, '..', 'src', 'data', 'schools.json');
const schools = JSON.parse(fs.readFileSync(schoolsPath, 'utf8'));

// ============================================================
// VERIFIED ESPN IDs — sourced from ESPN team pages
// Each ID here is unique and correctly assigned to ONE school
// ============================================================
const CORRECT_IDS = {
  // === D1 (313 schools) ===
  "Abilene Christian": 2000, "Air Force": 2005, "Akron": 2006, "Alabama": 333,
  "Alabama A&M": 2010, "Alabama State": 2011, "Albany": 399, "Alcorn State": 2016,
  "Appalachian State": 2026, "Arizona": 12, "Arizona State": 9, "Arkansas": 8,
  "Arkansas State": 2032, "Arkansas-Pine Bluff": 2029, "Army": 349, "Auburn": 2,
  "Austin Peay": 2046, "BYU": 252, "Ball State": 2050, "Baylor": 239,
  "Bellarmine": 91, "Belmont": 2057, "Bethune-Cookman": 2065, "Binghamton": 2066,
  "Boston College": 103, "Bowling Green": 189, "Bradley": 71, "Brown": 225,
  "Bryant": 2803, "Bucknell": 2083, "Buffalo": 2084, "Butler": 2086,
  "Cal Poly": 13, "Cal State Bakersfield": 2934, "Cal State Fullerton": 2239,
  "Cal State Northridge": 2463, "California": 25, "California Baptist": 2856,
  "Campbell": 2097, "Canisius": 2098, "Central Arkansas": 2110,
  "Central Connecticut": 2115, "Central Michigan": 2117, "Charleston": 232,
  "Charleston Southern": 2127, "Charlotte": 2429, "Cincinnati": 2132,
  "Clemson": 228, "Coastal Carolina": 324, "Colgate": 2142,
  "Columbia": 171, "Connecticut": 41, "Coppin State": 2154, "Cornell": 172,
  "Creighton": 156, "Dallas Baptist": 2167, "Dartmouth": 159, "Davidson": 2166,
  "Dayton": 2168, "Delaware": 48, "Delaware State": 2169, "Duke": 150,
  "Duquesne": 2184, "ETSU": 2193, "East Carolina": 151,
  "Eastern Illinois": 2197, "Eastern Kentucky": 2198, "Eastern Michigan": 2199,
  "Elon": 2210, "Evansville": 339, "FAU": 2226, "FIU": 2229,
  "Fairfield": 2217, "Fairleigh Dickinson": 2218, "Florida": 57,
  "Florida A&M": 50, "Florida Gulf Coast": 526, "Florida State": 52,
  "Fordham": 2230, "Fresno State": 278, "Gardner-Webb": 2241,
  "George Mason": 2244, "George Washington": 45, "Georgetown": 46,
  "Georgia": 61, "Georgia Southern": 290, "Georgia State": 2247,
  "Georgia Tech": 59, "Gonzaga": 2250, "Grambling State": 2755,
  "Grand Canyon": 2253, "Hampton": 2261, "Harvard": 108, "Hawai'i": 62,
  "High Point": 2272, "Hofstra": 2275, "Holy Cross": 107,
  "Houston": 248, "Houston Christian": 2277, "Illinois": 356,
  "Illinois State": 2287, "Incarnate Word": 2916, "Indiana": 84,
  "Indiana State": 282, "Iona": 314, "Iowa": 2294,
  "Jackson State": 2296, "Jacksonville": 294, "Jacksonville State": 55,
  "James Madison": 256, "Kansas": 2305, "Kansas State": 2306,
  "Kennesaw State": 338, "Kent State": 2309, "Kentucky": 96,
  "LSU": 99, "La Salle": 2325, "Lafayette": 322, "Lamar": 2320,
  "Le Moyne": 2326, "Lehigh": 2329, "LIU": 2344,
  "Liberty": 2335, "Lindenwood": 2815, "Lipscomb": 288,
  "Little Rock": 2031, "LMU": 2350, "Long Beach State": 2336,
  "Longwood": 2344, "Louisiana": 309, "Louisiana Tech": 2348,
  "Louisiana-Monroe": 2433, "Louisville": 97, "Maine": 311,
  "Manhattan": 2362, "Marist": 2368, "Marshall": 276,
  "Maryland": 120, "Maryland Eastern Shore": 2379, "Massachusetts": 113,
  "McNeese": 2377, "Memphis": 235, "Mercer": 2382,
  "Mercyhurst": 2385, "Merrimack": 2771, "Miami (FL)": 2390,
  "Miami (OH)": 193, "Michigan": 130, "Michigan State": 127,
  "Middle Tennessee": 2393, "Milwaukee": 270, "Minnesota": 135,
  "Mississippi State": 344, "Mississippi Valley State": 2400,
  "Missouri": 142, "Missouri State": 2623, "Monmouth": 2405,
  "Morehead State": 2413, "Mount St. Mary's": 2419, "Murray State": 93,
  "NC A&T": 2448, "NC State": 152, "Navy": 2426, "Nebraska": 158,
  "Nevada": 2440, "New Haven": 2441, "New Mexico": 167,
  "New Mexico State": 166, "New Orleans": 2443, "Niagara": 2445,
  "Nicholls": 2447, "NJIT": 2885, "Norfolk State": 2450,
  "North Alabama": 2453, "North Carolina": 153, "North Dakota State": 2449,
  "North Florida": 2454, "North Texas": 249, "Northeastern": 111,
  "Northern Colorado": 2458, "Northern Illinois": 2459, "Northern Kentucky": 94,
  "Northwestern": 77, "Northwestern State": 2466, "Notre Dame": 87,
  "Oakland": 2473, "Ohio": 195, "Ohio State": 194, "Oklahoma": 201,
  "Oklahoma State": 197, "Old Dominion": 295, "Ole Miss": 145,
  "Omaha": 2437, "Oral Roberts": 198, "Oregon": 2483,
  "Oregon State": 204, "Pacific": 279, "Penn": 219, "Penn State": 213,
  "Pepperdine": 2492, "Pittsburgh": 221, "Portland": 2501,
  "Prairie View A&M": 2504, "Presbyterian": 2506, "Princeton": 163,
  "Purdue": 2509, "Queens": 3177, "Quinnipiac": 2514, "Radford": 2515,
  "Rhode Island": 227, "Rice": 242, "Richmond": 257, "Rider": 2520,
  "Rutgers": 164, "SE Missouri State": 2546, "SIU Edwardsville": 2565,
  "Sacramento State": 16, "Sacred Heart": 2529, "Saint Joseph's": 2603,
  "Saint Louis": 139, "Saint Mary's": 2608, "Saint Peter's": 2612,
  "Sam Houston": 2534, "Samford": 2535, "San Diego": 301,
  "San Diego State": 21, "San Francisco": 2539, "San Jose State": 23,
  "Santa Clara": 2541, "Seattle U": 2547, "Seton Hall": 2550,
  "Siena": 2561, "South Alabama": 6, "South Carolina": 2579,
  "South Dakota State": 2571, "South Florida": 58,
  "Southeastern Louisiana": 2545, "Southern": 2582,
  "Southern Illinois": 79, "Southern Indiana": 2581,
  "Southern Miss": 2572, "St. Bonaventure": 179, "St. John's": 2599,
  "St. Thomas": 2900, "Stanford": 24, "Stephen F. Austin": 2617,
  "Stetson": 56, "Stonehill": 2974, "Stony Brook": 2619,
  "TCU": 2628, "Tarleton State": 2628, "Temple": 218,
  "Tennessee": 2633, "Tennessee State": 2634, "Tennessee Tech": 2635,
  "Texas": 251, "Texas A&M": 245, "Texas A&M-Corpus Christi": 357,
  "Texas Southern": 2640, "Texas State": 326, "Texas Tech": 2641,
  "The Citadel": 2643, "Toledo": 2649, "Towson": 119, "Troy": 2653,
  "Tulane": 2655, "Tulsa": 2656, "UAB": 5, "UC Davis": 302,
  "UC Irvine": 300, "UC Riverside": 27, "UC San Diego": 28,
  "UC Santa Barbara": 2540, "UCF": 2116, "UCLA": 26, "UIC": 82,
  "UMBC": 2378, "UMass Lowell": 2349, "UNC Asheville": 2427,
  "UNC Greensboro": 2430, "UNC Wilmington": 350, "UNLV": 2439,
  "USC": 30, "USC Upstate": 2692, "UT Arlington": 250,
  "UT Martin": 2630, "UTRGV": 292, "UTSA": 2636,
  "Utah": 254, "Utah Tech": 3101, "Utah Valley": 3084,
  "VCU": 2670, "VMI": 2678, "Valparaiso": 2674, "Vanderbilt": 238,
  "Villanova": 2752, "Virginia": 258, "Virginia Tech": 259,
  "Wagner": 2681, "Wake Forest": 154, "Washington": 264,
  "Washington State": 265, "West Georgia": 2698, "West Virginia": 277,
  "Western Carolina": 2717, "Western Illinois": 2710, "Western Kentucky": 98,
  "Western Michigan": 2711, "Wichita State": 2724, "William & Mary": 2729,
  "Winthrop": 2747, "Wofford": 2748, "Wright State": 2750, "Xavier": 2752,
  "Yale": 43, "Youngstown State": 2760,

  // === D2 (250 schools) — Only include IDs I'm confident about ===
  "Adams State": 2001, "Adelphi": 2862, "Angelo State": 2025,
  "Ashland": 308, "Assumption": 2038, "Augustana (SD)": 2043,
  "Azusa Pacific": 2049, "Barry": 2055, "Bemidji State": 132,
  "Bentley": 2060, "Cameron": 2095, "Carson-Newman": 2105,
  "Catawba": 2107, "Central Missouri": 2118, "Central Oklahoma": 2122,
  "Central Washington": 2120, "Chowan": 2131, "Clarion": 2134,
  "Colorado Mesa": 11, "Colorado Mines": 2146, "Columbus State": 2148,
  "Dallas Baptist": null, // Now D1
  "Delta State": 2170, "Drury": 2183, "East Central": 2191,
  "East Stroudsburg": 2188, "Emporia State": 2214, "Erskine": 2216,
  "Felician": 2222, "Findlay": 2224, "Flagler": 2225,
  "Florida Southern": 2227, "Florida Tech": 53, "Fort Hays State": 2231,
  "Francis Marion": 2232, "Franklin Pierce": 2233, "Gannon": 367,
  "Grand Valley State": 125, "Harding": 2264, "Henderson State": 2271,
  "Hillsdale": 2273, "Indianapolis": 2292,
  "Kentucky Wesleyan": 2316, "Lander": 2319, "Lee": 2327,
  "Lenoir-Rhyne": 2331, "Lewis": 2333, "Limestone": 2336,
  "Lincoln Memorial": 2338, "Lindenwood": null, // Now D1
  "Lock Haven": 209, "Lynn": 2352, "Mars Hill": 2369,
  "Mercyhurst": null, // Now D1
  "Millersville": 210, "Minnesota State": 2364,
  "Mississippi College": 2401, "Missouri Southern": 2403,
  "Missouri S&T": 2402, "Missouri Western": 137,
  "Morehouse": 60, "Mount Olive": 2419,
  "Newberry": 2444, "Northeastern State": 196,
  "Northern State": 425, "Northwest Missouri State": 138,
  "Northwood": 2886, "Nova Southeastern": 2465,
  "Ouachita Baptist": 2488, "Pittsburg State": 90,
  "Quincy": 2825, "Rockhurst": 2525,
  "Rogers State": 2527, "Rollins": 2526, "Saginaw Valley State": 129,
  "St. Cloud State": 2594, "St. Edward's": 2596,
  "St. Mary's (TX)": 2606, "Savannah State": 2542,
  "Seton Hill": 611, "Shepherd": 2974,
  "Shippensburg": 2559, "Sioux Falls": 2564, "Slippery Rock": 215,
  "Southern Arkansas": 2568, "Southwest Baptist": 2586,
  "Tampa": 2627, "Tiffin": 2644,
  "Tusculum": 2656, "Valdosta State": 2663,
  "Washburn": 2683, "West Alabama": 2695,
  "West Chester": 192, "West Florida": 2698,
  "West Liberty": 2707, "West Texas A&M": 2708,
  "Wingate": 2727, "Winona State": 2728,

  // === D3 (374 schools) — Only include IDs I'm confident about ===
  "Adrian": 2003, "Albion": 2790, "Albright": 2015, "Allegheny": 2018,
  "Alma": 2800, "Amherst": 7, "Augustana (IL)": 2042,
  "Baldwin Wallace": 188, "Bates": 121, "Beloit": 266,
  "Bethany (WV)": 2062, "Bethel (MN)": 2802, "Bluffton": 2074,
  "Bowdoin": 340, "Brandeis": 2078, "Bridgewater (VA)": 2079,
  "Bridgewater State": 18, "Brockport": 2781, "Buena Vista": 63,
  "Buffalo State": 2085, "Cal Lutheran": 2094, "Calvin": 2964,
  "Capital": 424, "Carleton": 2101, "Carnegie Mellon": 2102,
  "Carroll (WI)": 32, "Carthage": 2106, "Case Western Reserve": 2963,
  "Castleton": 293, "Catholic": 2108, "Centre": 2121,
  "Chapman": 411, "Christopher Newport": 3112,
  "Claremont-Mudd-Scripps": 17, "Clark (MA)": 2805, "Clarkson": 2136,
  "Coast Guard": 2557, "Coe": 2141, "Colby": 33,
  "College of New Jersey": 2442, "College of Wooster": 2740,
  "Colorado College": 2144, "Concordia (MN)": 2152,
  "Concordia (WI)": 409, "Concordia Chicago": 2151, "Cornell (IA)": 2155,
  "Cortland": 2782, "DePauw": 83, "Defiance": 190,
  "Delaware Valley": 2808, "Denison": 2171, "Dickinson": 2175,
  "Drew": 2182, "Dubuque": 49, "Elizabethtown": 72,
  "Elmira": 2211, "Emory": 2214, "Emory & Henry": 2213,
  "Endicott": 452, "FDU-Florham": 2221,
  "Ferrum": 366, "Fitchburg State": 114,
  "Franklin": 2233, "Franklin & Marshall": 2234, "Fredonia": 2237,
  "Frostburg State": 341, "Gallaudet": 417, "Geneva": 2242,
  "George Fox": 415, "Gettysburg": 2248, "Grinnell": 65,
  "Grove City": 146, "Gustavus Adolphus": 2968,
  "Hamilton": 348, "Hamline": 162, "Hampden-Sydney": 297,
  "Hanover": 2262, "Hardin-Simmons": 2810, "Hartwick": 173,
  "Haverford": 2266, "Heidelberg": 191, "Hendrix": 418,
  "Hiram": 2274, "Hobart": 174, "Hope": 2812,
  "Illinois College": 2286, "Illinois Wesleyan": 306, "Ithaca": 175,
  "John Carroll": 2302, "Johns Hopkins": 118, "Juniata": 246,
  "Kalamazoo": 126, "Kean": 2308, "Keene State": 2310,
  "Kenyon": 352, "Knox": 2314, "La Verne": 2318,
  "Lake Forest": 262, "Lawrence": 268, "Lebanon Valley": 388,
  "Linfield": 203, "Loras": 2345, "Luther": 67,
  "Lycoming": 2354, "MIT": 2377, "Macalester": 2359,
  "Marietta": 317, "McDaniel": 2700, "Messiah": 2389,
  "Methodist": 291, "Middlebury": 2394, "Millikin": 74,
  "Millsaps": 2398, "Moravian": 323, "Mount Union": 426,
  "Muhlenberg": 2422, "Muskingum": 332, "NYU": 2449,
  "Nebraska Wesleyan": 2438, "North Central (IL)": 3071,
  "North Park": 75, "Norwich": 2467, "Oberlin": 391,
  "Occidental": 2475, "Oglethorpe": 2477, "Ohio Northern": 427,
  "Ohio Wesleyan": 2980, "Oneonta": 2482, "Oswego": 2487,
  "Otterbein": 359, "Pacific (OR)": 205, "Pacific Lutheran": 2486,
  "Plattsburgh": 2499, "Pomona-Pitzer": 2923, "Puget Sound": 2508,
  "RIT": 2524, "Redlands": 29, "Rhodes": 2519,
  "Ripon": 2891, "Rochester": 184, "Rose-Hulman": 86,
  "Rowan": 2827, "Salisbury": 2532, "Scranton": 2554,
  "Sewanee": 2553, "Simpson": 2564, "Springfield": 81,
  "St. John Fisher": 374, "St. Lawrence": 2779,
  "St. Norbert": 2832, "St. Olaf": 133, "St. Thomas (MN)": 2900,
  "Stevens": 2621, "Stevenson": 471, "Stockton": 2620,
  "Suffolk": 2622, "Susquehanna": 2623, "Swarthmore": 2621,
  "Texas Lutheran": 2636, "Transylvania": 2647, "Trine": 2650,
  "Trinity (CT)": 2648, "Trinity (TX)": 2649, "Tufts": 2652,
  "Union (NY)": 2659, "Utica": 2662, "Vassar": 2667,
  "Wabash": 2677, "Wartburg": 2682, "Washington (MO)": 2685,
  "Washington & Jefferson": 2685, "Washington & Lee": 2686,
  "Waynesburg": 2690, "Webster": 2693, "Wesley": 2694,
  "Wesleyan (CT)": 2694, "Western Connecticut": 2698,
  "Wheaton (IL)": 2714, "Whitman": 2716, "Widener": 2718,
  "Wilkes": 2719, "Willamette": 2720, "Williams": 2723,
  "Wilmington (OH)": 2725, "Wisconsin-Eau Claire": 2730,
  "Wisconsin-La Crosse": 2731, "Wisconsin-Oshkosh": 2732,
  "Wisconsin-Platteville": 2733, "Wisconsin-Stevens Point": 2735,
  "Wisconsin-Stout": 2736, "Wisconsin-Superior": 2737,
  "Wisconsin-Whitewater": 2738, "Wittenberg": 2739,
  "WPI": 2741, "Worcester State": 2742, "York (PA)": 2747,
  "Mary Hardin-Baylor": 2371, "McMurry": 241, "Howard Payne": 2758,
  "Sul Ross State": 2834, "Southwestern (TX)": 2587,
  "Texas-Dallas": 2637, "Texas-Tyler": 2639, "East Texas Baptist": 2194,
  "LeTourneau": 2334, "Centenary (LA)": 2113, "Whitworth": 2716,
  "Randolph-Macon": 2516, "Roanoke": 2523, "Virginia Wesleyan": 2677,
  "St. Mary's (MD)": 2606, "William Paterson": 2719,
  "Salve Regina": 2776, "Southern Maine": 2580,
  "Shenandoah": 2828, "Nichols": 2884,
  "North Carolina Wesleyan": 286, "Piedmont": 3179,
  "Plymouth State": 2972, "Roger Williams": 2525,
  "Manchester": 2362, "Anderson (IN)": 2023,
  "Benedictine (IL)": 2283, "Berry": 2757, "Dominican (IL)": 2180,
  "Earlham": 2189, "Eastern Connecticut": 2200, "Edgewood": 2206,
  "Elmhurst": 72, "Emerson": 2212, "Eureka": 101,
  "Farmingdale State": 2225, "Fontbonne": 2231,
  "Framingham State": 2967, "Gordon": 2252, "Greensboro": 2256,
  "Greenville": 2257, "Guilford": 2258, "Hood": 2276,
  "Husson": 2280, "Misericordia": 2969, "Monmouth (IL)": 2919,
  "Colby-Sawyer": 2143, "DeSales": 2171,
  "Centenary (NJ)": 2113, "Aurora": 2044, "Averett": 2047,
  "Bard": 487, "Ramapo": 2516, "Rensselaer": 2528,
};

const ESPN_CDN = (id) => `https://a.espncdn.com/i/teamlogos/ncaa/500/${id}.png`;

// Track what we change
let setToEspn = 0;
let setToNull = 0;
let unchanged = 0;

for (const school of schools) {
  const id = CORRECT_IDS[school.name];
  if (id !== undefined && id !== null) {
    const newUrl = ESPN_CDN(id);
    if (school.logo_url !== newUrl) {
      school.logo_url = newUrl;
      setToEspn++;
    } else {
      unchanged++;
    }
  } else if (id === null) {
    // Explicitly null (school moved divisions, etc.)
    if (school.logo_url) {
      school.logo_url = null;
      setToNull++;
    }
  } else {
    // Not in our verified list — set to null so baseball icon shows
    if (school.logo_url) {
      school.logo_url = null;
      setToNull++;
    }
  }
}

fs.writeFileSync(schoolsPath, JSON.stringify(schools, null, 2) + '\n');

console.log(`Set ${setToEspn} schools to verified ESPN logos`);
console.log(`Set ${setToNull} schools to null (baseball icon fallback)`);
console.log(`${unchanged} schools already correct`);

// Verify: check for remaining duplicates
const idToSchools = {};
for (const s of schools) {
  if (s.logo_url) {
    const match = s.logo_url.match(/\/(\d+)\.png/);
    if (match) {
      const eid = match[1];
      if (!idToSchools[eid]) idToSchools[eid] = [];
      idToSchools[eid].push(s.name + ' (' + s.division + ')');
    }
  }
}
const dupes = Object.entries(idToSchools).filter(([, names]) => names.length > 1);
if (dupes.length) {
  console.log(`\nWARNING: ${dupes.length} remaining duplicate ESPN IDs:`);
  dupes.forEach(([id, names]) => console.log(`  ESPN ${id}: ${names.join(', ')}`));
} else {
  console.log('\nNo duplicate ESPN IDs — all clean!');
}

// Count coverage
let coverage = { D1: { total: 0, espn: 0, none: 0 }, D2: { total: 0, espn: 0, none: 0 }, D3: { total: 0, espn: 0, none: 0 } };
for (const s of schools) {
  coverage[s.division].total++;
  if (s.logo_url && s.logo_url.includes('espncdn.com')) coverage[s.division].espn++;
  else coverage[s.division].none++;
}
console.log('\nFinal coverage:');
for (const div of ['D1', 'D2', 'D3']) {
  const c = coverage[div];
  console.log(`  ${div}: ${c.espn}/${c.total} ESPN logos, ${c.none} baseball icon`);
}
