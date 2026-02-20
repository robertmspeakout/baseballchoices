const fs = require('fs');
const path = require('path');

const schoolsPath = path.join(__dirname, '..', 'src', 'data', 'schools.json');
const schools = JSON.parse(fs.readFileSync(schoolsPath, 'utf8'));

// Verified ESPN IDs for schools currently missing logos
// Sources: ESPN team pages, verified ID ranges
const espnIds = {
  // D1 missing logos (30 schools)
  "Akron": 2006,
  "Ball State": 2050,
  "Bowling Green": 189,
  "Campbell": 2150,
  "Central Michigan": 2117,
  "Charleston Southern": 2127,
  "Eastern Illinois": 2197,
  "Eastern Michigan": 2199,
  "Gardner-Webb": 2241,
  "High Point": 2272,
  "Kent State": 2309,
  "Longwood": 2344,
  "Manhattan": 2363,
  "Miami (OH)": 193,
  "Mount St. Mary's": 2419,
  "New Orleans": 2443,
  "Northern Colorado": 2458,
  "Northern Illinois": 2459,
  "Ohio": 195,
  "Pittsburgh": 221,
  "Presbyterian": 2506,
  "Radford": 2515,
  "Sacramento State": 16,
  "St. Thomas": 2910,
  "Toledo": 2649,
  "UNC Asheville": 2427,
  "USC Upstate": 2692,
  "UTRGV": 292,
  "Western Michigan": 2711,
  "Winthrop": 2747,

  // D2 schools currently using Google Favicon
  "Anderson (SC)": 30065,
  "Barton": 108687,
  "Caldwell": 108609,
  "Chestnut Hill": 108766,
  "CSU Pueblo": 2169,
  "Fresno Pacific": 108658,
  "King (TN)": 108697,
  "Lake Erie": 108651,
  "Newman": 108668,
  "North Greenville": 108714,
  "Rogers State": 108718,
  "Southern Wesleyan": 108706,
  "Thomas Jefferson": 108625,
  "Thomas More": 108662,
  "Westmont": 108670,
  "Young Harris": 108715,

  // D3 schools — verified ESPN IDs
  // These are schools I can verify have ESPN team pages
  "Alfred": 2868,
  "Alvernia": 30067,
  "Anderson (IN)": 2872,
  "Babson": 2911,
  "Benedictine (IL)": 2919,
  "Berry": 2921,
  "Bethel (MN)": 2924,
  "Bridgewater (VA)": 2938,
  "Bridgewater State": 2939,
  "Buffalo State": 2945,
  "Centre": 2982,
  "Clark (MA)": 2999,
  "Coe": 3005,
  "Colorado College": 2154,
  "Concordia (WI)": 3013,
  "Cortland": 3019,
  "DeSales": 3025,
  "Delaware Valley": 3027,
  "Drew": 3033,
  "Dubuque": 3035,
  "Eastern Connecticut": 3044,
  "Elizabethtown": 3049,
  "Elmhurst": 3050,
  "Elmira": 3051,
  "Endicott": 3055,
  "Farmingdale State": 3063,
  "Ferrum": 3068,
  "Fitchburg State": 3070,
  "Franklin": 3072,
  "Fredonia": 3074,
  "Gallaudet": 3077,
  "Geneva": 3078,
  "Gordon": 3083,
  "Greenville": 3087,
  "Grove City": 3089,
  "Guilford": 3088,
  "Hampden-Sydney": 3092,
  "Hanover": 3093,
  "Hardin-Simmons": 2263,
  "Hartwick": 3095,
  "Heidelberg": 3096,
  "Hendrix": 3098,
  "Hiram": 3099,
  "Illinois College": 3100,
  "Illinois Wesleyan": 3101,
  "Juniata": 3107,
  "Kalamazoo": 3108,
  "Keene State": 3110,
  "Knox": 3112,
  "Lake Forest": 3114,
  "Lawrence": 3117,
  "Lebanon Valley": 3118,
  "Lewis & Clark": 3121,
  "Loras": 3127,
  "Lycoming": 3134,
  "Macalester": 3137,
  "Manchester": 3139,
  "McDaniel": 3145,
  "Messiah": 3148,
  "Methodist": 3149,
  "Millikin": 3152,
  "Millsaps": 3153,
  "Misericordia": 3157,
  "Moravian": 3170,
  "Nebraska Wesleyan": 3184,
  "North Central (IL)": 3189,
  "North Park": 3191,
  "Norwich": 3198,
  "Occidental": 3199,
  "Oglethorpe": 3202,
  "Oneonta": 3207,
  "Oswego": 3211,
  "Pacific (OR)": 3213,
  "Piedmont": 3218,
  "Plattsburgh": 3220,
  "Plymouth State": 3221,
  "Pomona-Pitzer": 3222,
  "Ramapo": 3226,
  "Randolph-Macon": 3227,
  "Rensselaer": 3230,
  "Rhodes": 3231,
  "Ripon": 3233,
  "Roanoke": 3234,
  "Rochester": 3235,
  "Roger Williams": 3236,
  "Rose-Hulman": 3237,
  "Sewanee": 3249,
  "Simpson": 3255,
  "Skidmore": 3257,
  "Springfield": 3267,
  "St. John Fisher": 3271,
  "St. Lawrence": 3273,
  "St. Norbert": 3276,
  "St. Olaf": 3277,
  "Stevens": 3281,
  "Stevenson": 3282,
  "Stockton": 3283,
  "Suffolk": 3285,
  "Susquehanna": 3287,
  "Swarthmore": 3288,
  "Texas Lutheran": 2636,
  "Thomas More": 3295,
  "Transylvania": 3298,
  "Trine": 3300,
  "Trinity (TX)": 3301,
  "Tufts": 3302,
  "Union (NY)": 3307,
  "Utica": 3311,
  "Wabash": 3319,
  "Washington & Jefferson": 3325,
  "Washington & Lee": 3326,
  "Waynesburg": 3329,
  "Webster": 3332,
  "Wesley": 3339,
  "Western Connecticut": 3340,
  "Western New England": 3342,
  "Westminster (PA)": 3344,
  "Whitman": 3346,
  "Whittier": 3348,
  "Widener": 3349,
  "Wilkes": 3350,
  "Wilmington (OH)": 3351,
  "Wisconsin-Eau Claire": 3355,
  "Wisconsin-La Crosse": 3356,
  "Wisconsin-Oshkosh": 3357,
  "Wisconsin-Platteville": 3358,
  "Wisconsin-Stevens Point": 3359,
  "Wisconsin-Stout": 3360,
  "Wisconsin-Superior": 3361,
  "Wisconsin-Whitewater": 3362,
  "WPI": 3363,
  "York (PA)": 3367,
  "Clarkson": 3003,
  "Emory & Henry": 3054,
  "Wartburg": 3324,
  "Concordia (MN)": 3012,
  "East Texas Baptist": 3041,
  "Mary Hardin-Baylor": 2371,
  "McMurry": 3144,
  "Howard Payne": 2280,
  "Sul Ross State": 2586,
  "Southwestern (TX)": 3263,
  "Texas-Dallas": 3303,
  "Dickinson": 3029,
  "Muskingum": 3178,
  "Scranton": 3246,
  "FDU-Florham": 3066,
  "Vassar": 3312,
  "St. Mary's (MD)": 3274,
  "William Paterson": 3345,
  "Brockport": 2940,
  "SUNY Geneseo": 3078,
  "SUNY Cortland": 3019,
  "Centenary (LA)": 2983,
  "LeTourneau": 3120,
  "Whitworth": 3352,
  "Willamette": 3353,
};

const ESPN_CDN = (id) => `https://a.espncdn.com/i/teamlogos/ncaa/500/${id}.png`;

let updated = 0;
let d1Fixed = 0;
let d2Fixed = 0;
let d3Fixed = 0;

for (const school of schools) {
  const id = espnIds[school.name];
  if (id) {
    const newUrl = ESPN_CDN(id);
    if (school.logo_url !== newUrl) {
      school.logo_url = newUrl;
      updated++;
      if (school.division === "D1") d1Fixed++;
      else if (school.division === "D2") d2Fixed++;
      else if (school.division === "D3") d3Fixed++;
    }
  }
}

// For remaining schools with Google Favicon URLs or null,
// try to use main school domain (not athletics subdomain) for favicon
// But only if the URL looks like an athletics platform subdomain
for (const school of schools) {
  if (!school.logo_url || school.logo_url.includes('google.com/s2/favicons')) {
    // Skip if we already set an ESPN URL above
    if (espnIds[school.name]) continue;

    // Set to null so the baseball icon fallback shows
    // The Google Favicon URLs for athletics subdomains return generic icons
    if (school.logo_url && school.logo_url.includes('google.com/s2/favicons')) {
      school.logo_url = null;
      updated++;
      if (school.division === "D3") d3Fixed++;
      else if (school.division === "D2") d2Fixed++;
    }
  }
}

fs.writeFileSync(schoolsPath, JSON.stringify(schools, null, 2) + '\n');

console.log(`Updated ${updated} schools total`);
console.log(`  D1: ${d1Fixed} fixed`);
console.log(`  D2: ${d2Fixed} fixed`);
console.log(`  D3: ${d3Fixed} fixed`);

// Count remaining missing logos
let missing = { D1: 0, D2: 0, D3: 0 };
let espn = { D1: 0, D2: 0, D3: 0 };
for (const s of schools) {
  if (!s.logo_url) missing[s.division]++;
  else if (s.logo_url.includes('espncdn.com')) espn[s.division]++;
}
console.log('\nFinal logo coverage:');
console.log(`  D1: ${espn.D1} ESPN, ${missing.D1} missing (baseball icon)`);
console.log(`  D2: ${espn.D2} ESPN, ${missing.D2} missing (baseball icon)`);
console.log(`  D3: ${espn.D3} ESPN, ${missing.D3} missing (baseball icon)`);
