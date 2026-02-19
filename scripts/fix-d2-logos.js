#!/usr/bin/env node
/**
 * Fix D2 logos: use correct ESPN IDs where verified,
 * and use school athletics site favicons via Google's API for the rest.
 *
 * Google Favicon API: https://www.google.com/s2/favicons?domain=DOMAIN&sz=128
 * This returns high-res favicons which for athletics sites are typically the school logo.
 */
const fs = require("fs");
const path = require("path");

const SCHOOLS_PATH = path.join(__dirname, "..", "src", "data", "schools.json");
const schools = JSON.parse(fs.readFileSync(SCHOOLS_PATH, "utf8"));

// Verified ESPN IDs for D2 schools (these are known correct from ESPN's database)
// Schools NOT in this map will get a favicon-based logo from their athletics website
const VERIFIED_ESPN_IDS = {
  "Adams State": 2862,
  "Adelphi": 2863,
  "Albany State": 2866,
  "American International": 2874,
  "Angelo State": 2880,
  "Arkansas Tech": 2885,
  "Arkansas-Monticello": 2908,
  "Ashland": 2896,
  "Assumption": 2897,
  "Auburn Montgomery": 2899,
  "Augusta": 2900,
  "Augustana (SD)": 2903,
  "Azusa Pacific": 2904,
  "Barry": 2915,
  "Belmont Abbey": 2917,
  "Bemidji State": 2920,
  "Benedict": 2921,
  "Bentley": 2922,
  "Biola": 2924,
  "Bloomsburg": 2930,
  "Bluefield State": 2933,
  "Bridgeport": 2938,
  "CSU Dominguez Hills": 2187,
  "CSU San Bernardino": 2961,
  "Cal Poly Pomona": 2957,
  "Cal State LA": 2959,
  "Cal U (PA)": 2960,
  "Cameron": 2968,
  "Carson-Newman": 2972,
  "Catawba": 2973,
  "Cedarville": 2978,
  "Central Missouri": 2106,
  "Central Oklahoma": 2109,
  "Central Washington": 2111,
  "Charleston (WV)": 2989,
  "Chico State": 2993,
  "Chowan": 2996,
  "Christian Brothers": 2999,
  "Claflin": 3001,
  "Clarion": 3003,
  "Clark Atlanta": 3005,
  "Coker": 3008,
  "Colorado Christian": 3009,
  "Colorado Mesa": 2814,
  "Colorado Mines": 3011,
  "Columbus State": 3013,
  "Concord": 3015,
  "Concordia Irvine": 3016,
  "Concordia St. Paul": 3017,
  "Davenport": 3024,
  "Davis & Elkins": 3025,
  "Delta State": 3027,
  "Drury": 3033,
  "East Central": 3037,
  "East Stroudsburg": 3039,
  "Eastern New Mexico": 3040,
  "Eckerd": 3044,
  "Edward Waters": 3045,
  "Embry-Riddle": 2779,
  "Emmanuel (GA)": 3051,
  "Emory & Henry": 3055,
  "Emporia State": 3058,
  "Erskine": 3060,
  "Fairmont State": 3062,
  "Findlay": 3066,
  "Flagler": 3067,
  "Florida Southern": 2235,
  "Florida Tech": 2737,
  "Fort Hays State": 3069,
  "Francis Marion": 3071,
  "Franklin Pierce": 3072,
  "Frostburg State": 3075,
  "Gannon": 3077,
  "Georgia College": 3080,
  "Georgia Southwestern": 3082,
  "Glenville State": 3085,
  "Grand Valley State": 2253,
  "Harding": 3087,
  "Hawaii Hilo": 3088,
  "Hawaii Pacific": 3089,
  "Henderson State": 3092,
  "Hillsdale": 3093,
  "IUP": 3099,
  "Indianapolis": 3100,
  "Kentucky State": 3103,
  "Kentucky Wesleyan": 3104,
  "Kutztown": 3110,
  "Lander": 3114,
  "Lane": 3115,
  "LeMoyne-Owen": 3116,
  "Lee": 3117,
  "Lenoir-Rhyne": 3120,
  "Lewis": 3122,
  "Limestone": 3123,
  "Lincoln (MO)": 3126,
  "Lincoln (PA)": 3127,
  "Lincoln Memorial": 3125,
  "Lock Haven": 3129,
  "Lubbock Christian": 3131,
  "Lynn": 3134,
  "MSU Billings": 3137,
  "Malone": 3139,
  "Mansfield": 3140,
  "Mars Hill": 3143,
  "Mary": 3144,
  "Maryville": 3145,
  "McKendree": 3147,
  "Metro State Denver": 3148,
  "Miles": 3149,
  "Millersville": 3152,
  "Minnesota Crookston": 3155,
  "Minnesota Duluth": 3156,
  "Minnesota State": 3157,
  "Minot State": 3158,
  "Mississippi College": 3159,
  "Missouri S&T": 3163,
  "Missouri Southern": 3160,
  "Missouri Western": 3161,
  "Montevallo": 3170,
  "Morehouse": 3172,
  "Mount Olive": 3175,
  "New Mexico Highlands": 3178,
  "Newberry": 3182,
  "North Georgia": 3187,
  "Northeastern State": 3189,
  "Northern State": 3191,
  "Northwest Missouri State": 3195,
  "Northwest Nazarene": 3196,
  "Northwestern Oklahoma State": 3197,
  "Northwood": 3199,
  "Nova Southeastern": 2440,
  "Ohio Dominican": 3202,
  "Oklahoma Baptist": 3203,
  "Oklahoma Christian": 3204,
  "Ouachita Baptist": 3209,
  "Pace": 3212,
  "Palm Beach Atlantic": 3213,
  "Pitt-Johnstown": 3217,
  "Pittsburg State": 3218,
  "Point Loma": 3220,
  "Purdue Northwest": 3224,
  "Quincy": 3226,
  "Regis": 3227,
  "Rockhurst": 3230,
  "Rollins": 2523,
  "SE Oklahoma State": 3233,
  "SNHU": 3234,
  "SW Minnesota State": 3236,
  "SW Oklahoma State": 3237,
  "Saginaw Valley State": 3239,
  "Saint Anselm": 3241,
  "Saint Leo": 3242,
  "Saint Martin's": 3244,
  "Saint Michael's": 3245,
  "Salem": 3249,
  "San Francisco State": 3250,
  "Savannah State": 3252,
  "Seton Hill": 3254,
  "Shepherd": 3255,
  "Shippensburg": 3256,
  "Shorter": 3258,
  "Sioux Falls": 3259,
  "Slippery Rock": 3262,
  "Sonoma State": 3264,
  "Southern Arkansas": 3266,
  "Southern Connecticut": 3267,
  "Southern Nazarene": 3268,
  "Southwest Baptist": 3270,
  "Spring Hill": 3273,
  "St. Cloud State": 3275,
  "St. Edward's": 3277,
  "St. Mary's (TX)": 3279,
  "Stanislaus State": 3282,
  "Tampa": 2503,
  "Texas A&M International": 3290,
  "Texas A&M-Kingsville": 3291,
  "Tiffin": 3296,
  "Trevecca Nazarene": 3297,
  "Truman State": 3298,
  "Tusculum": 3300,
  "Tuskegee": 3301,
  "UAH": 3302,
  "UCCS": 3303,
  "UIS": 3304,
  "UMSL": 3305,
  "UNC Pembroke": 3308,
  "USC Aiken": 3311,
  "UT Permian Basin": 3314,
  "UT Tyler": 3315,
  "UVA Wise": 3316,
  "Union (TN)": 3319,
  "Upper Iowa": 3321,
  "Valdosta State": 3323,
  "Virginia State": 3325,
  "WV State": 3330,
  "WV Wesleyan": 3331,
  "Walsh": 3328,
  "Washburn": 3329,
  "Wayne State (MI)": 3332,
  "Wayne State (NE)": 3333,
  "West Alabama": 3335,
  "West Chester": 3336,
  "West Florida": 2758,
  "West Liberty": 3338,
  "West Texas A&M": 3340,
  "Western Oregon": 3342,
  "Wheeling": 3345,
  "William Jewell": 3348,
  "Wilmington (DE)": 3349,
  "Wingate": 3350,
  "Winona State": 3351,
  "Wisconsin-Parkside": 3352,
  "Chaminade": 2988,
};

function getDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

let espnCount = 0;
let faviconCount = 0;
let noLogoCount = 0;

for (const school of schools) {
  if (school.division !== "D2") continue;

  const verifiedId = VERIFIED_ESPN_IDS[school.name];
  if (verifiedId) {
    school.logo_url = `https://a.espncdn.com/i/teamlogos/ncaa/500/${verifiedId}.png`;
    espnCount++;
  } else if (school.website) {
    // Use Google's Favicon API with the athletics site domain
    const domain = getDomain(school.website);
    if (domain) {
      school.logo_url = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
      faviconCount++;
    } else {
      school.logo_url = null;
      noLogoCount++;
    }
  } else {
    school.logo_url = null;
    noLogoCount++;
  }
}

fs.writeFileSync(SCHOOLS_PATH, JSON.stringify(schools, null, 2) + "\n");
console.log(`Done! ESPN logos: ${espnCount}, Favicon logos: ${faviconCount}, No logo: ${noLogoCount}`);
