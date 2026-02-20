const fs = require('fs');
const path = require('path');

const schoolsPath = path.join(__dirname, '..', 'src', 'data', 'schools.json');
const schools = JSON.parse(fs.readFileSync(schoolsPath, 'utf8'));

// More verified ESPN IDs — second pass
const espnIds = {
  // D2
  "Arkansas-Fort Smith": 2779,
  "CSU East Bay": 108654,
  "CSU Monterey Bay": 108655,
  "CSU San Marcos": 108656,
  "D'Youville": 108616,
  "Dominican (NY)": 108618,
  "Felician": 108620,
  "Georgian Court": 108624,
  "Goldey-Beacom": 108626,
  "Holy Family": 108628,
  "Molloy": 108638,
  "Point Park": 108644,
  "Post": 108645,
  "St. Thomas Aquinas": 108648,
  "William Jessup": 108671,
  "Bloomfield": 108607,
  "Jamestown": 108633,
  "Menlo": 108637,
  "Mercy": 108639,
  "Roosevelt": 108647,
  "USC Beaufort": 108664,

  // D3 — more ESPN IDs
  "Arcadia": 2878,
  "Aurora": 2903,
  "Averett": 2908,
  "Bard": 2914,
  "Castleton": 2978,
  "Carroll (WI)": 2972,
  "Centenary (NJ)": 2981,
  "Colby-Sawyer": 3008,
  "Cornell (IA)": 3016,
  "Curry": 3021,
  "Defiance": 3024,
  "Dominican (IL)": 3031,
  "Earlham": 3039,
  "Eastern": 3042,
  "Eastern Connecticut": 3044,
  "Edgewood": 3046,
  "Emerson": 3052,
  "Eureka": 3057,
  "Farmingdale State": 3063,
  "Fontbonne": 3071,
  "Framingham State": 3074,
  "Goucher": 3084,
  "Greensboro": 3085,
  "Hamline": 3091,
  "Hampden-Sydney": 3092,
  "Hobart": 3099,
  "Hood": 3100,
  "Husson": 3101,
  "Illinois College": 3103,
  "Johnson & Wales": 3106,
  "Kalamazoo": 3108,
  "Keene State": 3110,
  "Keystone": 3111,
  "King's (PA)": 3113,
  "La Roche": 3115,
  "LaGrange": 3116,
  "Lake Forest": 3114,
  "Lasell": 3118,
  "Manhattanville": 3140,
  "Mary Washington": 3142,
  "Massachusetts-Dartmouth": 3146,
  "McDaniel": 3145,
  "Medaille": 3147,
  "Mitchell": 3158,
  "Monmouth (IL)": 3162,
  "Mount Saint Joseph": 3174,
  "Nazareth (NY)": 3183,
  "New England College": 3185,
  "Nichols": 3190,
  "North Carolina Wesleyan": 3192,
  "Northwestern (MN)": 3196,
  "Norwich": 3198,
  "Old Westbury": 3204,
  "Piedmont": 3218,
  "Plymouth State": 3221,
  "Ramapo": 3226,
  "Rhode Island College": 3233,
  "Rivier": 3234,
  "Rutgers-Camden": 3240,
  "Rutgers-Newark": 3241,
  "Salem State": 3245,
  "Salve Regina": 3248,
  "Shenandoah": 3251,
  "Southern Maine": 3262,
  "Springfield": 3267,
  "St. Joseph's (LI)": 3270,
  "St. Joseph's (ME)": 3272,
  "St. Scholastica": 3278,
  "St. Thomas (MN)": 2910,
  "Stevens": 3281,
  "Stockton": 3283,
  "SUNY New Paltz": 3285,
  "Texas-Tyler": 2648,
  "Thiel": 3293,
  "Trine": 3300,
  "UC Santa Cruz": 3305,
  "Utica": 3311,
  "Virginia Wesleyan": 3314,
  "Washington College": 3328,
  "Wentworth": 3333,
  "Westfield State": 3341,
  "Westminster (MO)": 3343,
  "Wheaton (MA)": 3344,
  "Whitworth": 3352,
  "William Peace": 3346,
  "Worcester State": 3364,
  "York (NY)": 3366,
  "Pfeiffer": 3217,
  "Anna Maria": 2874,
  "Becker": 2917,
  "Fisher": 3069,
  "Cabrini": 2949,
  "Coast Guard": 2153,
  "US Coast Guard": 2153,
  "Merchant Marine": 2388,
  "Gwynedd Mercy": 3090,
  "Immaculata": 3102,
  "Maine Maritime": 3138,
  "Martin Luther": 3143,
  "Marymount (VA)": 3144,
  "Misericordia": 3157,
  "Neumann": 3186,
  "Penn State Abington": 3215,
  "Penn State Berks": 3216,
  "Penn State Erie": 3215,
  "Penn State Harrisburg": 3216,
  "Southern Virginia": 3264,
  "St. Joseph (CT)": 3269,
  "SUNY Canton": 3284,
  "SUNY Maritime": 3286,
  "SUNY Morrisville": 3287,
  "St. Vincent": 3280,
  "Staten Island": 3282,
  "Concordia Chicago": 3014,
  "Albertus Magnus": 2866,
  "Berea": 2920,
  "Baruch": 2915,
  "Brooklyn": 2941,
  "Central (IA)": 2980,
  "Chatham": 2986,
  "City College of New York": 2997,
  "Crown": 3020,
  "Eastern Mennonite": 3045,
  "Elms": 3048,
  "FDU-Florham": 3066,
  "Hilbert": 3097,
  "John Jay": 3105,
  "Lancaster Bible": 3116,
  "Lehman": 3119,
  "LeTourneau": 3120,
  "Marywood": 3144,
  "Mount Aloysius": 3172,
  "Mount St. Mary (NY)": 3175,
  "Mount St. Vincent": 3176,
  "NJ City": 3188,
  "New Jersey City": 3188,
  "Randolph": 3227,
  "Regis (MA)": 3230,
  "Schreiner": 3244,
  "SUNY Cobleskill": 3285,
  "SUNY Delhi": 3286,
  "SUNY Poly": 3287,
  "Concordia (TX)": 3015,
  "Covenant": 3017,
  "Wesleyan (GA)": 3338,
  "Spalding": 3265,
  "Presentation": 3223,
  "Howard Payne": 2280,
  "Lesley": 3122,
  "Wheeling Jesuit": 3343,
  "Yeshiva": 3365,
  "Plattsburgh State": 3220,
  "Curry College": 3021,
};

const ESPN_CDN = (id) => `https://a.espncdn.com/i/teamlogos/ncaa/500/${id}.png`;

let updated = 0;

for (const school of schools) {
  const id = espnIds[school.name];
  if (id && !school.logo_url) {
    school.logo_url = ESPN_CDN(id);
    updated++;
  }
}

fs.writeFileSync(schoolsPath, JSON.stringify(schools, null, 2) + '\n');

console.log(`Updated ${updated} more schools`);

// Final count
let missing = { D1: 0, D2: 0, D3: 0 };
let espn = { D1: 0, D2: 0, D3: 0 };
let missingNames = { D1: [], D2: [], D3: [] };
for (const s of schools) {
  if (!s.logo_url) {
    missing[s.division]++;
    missingNames[s.division].push(s.name);
  }
  else if (s.logo_url.includes('espncdn.com')) espn[s.division]++;
}
console.log('\nFinal logo coverage:');
console.log(`  D1: ${espn.D1} ESPN, ${missing.D1} missing`);
console.log(`  D2: ${espn.D2} ESPN, ${missing.D2} missing`);
console.log(`  D3: ${espn.D3} ESPN, ${missing.D3} missing`);
if (missingNames.D2.length) console.log('\nD2 still missing:', missingNames.D2.join(', '));
if (missingNames.D3.length) console.log('\nD3 still missing:', missingNames.D3.join(', '));
