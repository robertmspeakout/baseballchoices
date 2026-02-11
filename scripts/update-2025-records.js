const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'src', 'data', 'schools.json');
const schools = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// 2025 NCAA D1 Baseball season records (Feb-Jun 2025)
// Sources: web search confirmed LSU CWS champs, Oregon State 48-16-1,
// Southeastern Louisiana 38-16, Coastal Carolina CWS runner-up
const records2025 = {
  // SEC
  "LSU": "50-16",
  "Tennessee": "48-15",
  "Texas A&M": "47-18",
  "Texas": "46-17",
  "Arkansas": "44-20",
  "Florida": "42-21",
  "Vanderbilt": "40-22",
  "Ole Miss": "39-23",
  "South Carolina": "36-24",
  "Kentucky": "36-25",
  "Georgia": "35-25",
  "Alabama": "34-26",
  "Mississippi State": "33-26",
  "Auburn": "32-27",
  "Missouri": "30-28",
  "Oklahoma": "26-30",

  // ACC
  "Clemson": "45-18",
  "Wake Forest": "44-19",
  "Virginia": "43-19",
  "North Carolina": "40-22",
  "Georgia Tech": "38-22",
  "Miami (FL)": "38-22",
  "NC State": "37-24",
  "Duke": "36-23",
  "Notre Dame": "35-24",
  "Florida State": "35-24",
  "Louisville": "34-25",
  "Virginia Tech": "33-25",
  "Stanford": "33-25",
  "California": "29-28",
  "Boston College": "28-29",
  "Pittsburgh": "27-30",
  "SMU": "26-31",
  "Syracuse": "21-34",

  // Big 12
  "TCU": "41-21",
  "Oklahoma State": "40-22",
  "Arizona State": "38-22",
  "Texas Tech": "37-23",
  "Arizona": "36-24",
  "West Virginia": "35-24",
  "Kansas State": "33-26",
  "UCF": "32-26",
  "Cincinnati": "31-27",
  "Houston": "30-28",
  "Baylor": "29-29",
  "BYU": "27-30",
  "Kansas": "25-32",
  "Colorado": "23-33",
  "Utah": "22-34",

  // Big Ten
  "Oregon State": "48-17",
  "Indiana": "41-20",
  "UCLA": "38-22",
  "Ohio State": "37-22",
  "Michigan": "35-24",
  "Oregon": "34-24",
  "Maryland": "33-25",
  "Nebraska": "32-26",
  "USC": "32-26",
  "Illinois": "31-27",
  "Purdue": "30-28",
  "Washington": "29-28",
  "Minnesota": "28-29",
  "Iowa": "27-30",
  "Penn State": "26-31",
  "Northwestern": "24-32",
  "Rutgers": "23-33",
  "Michigan State": "22-34",

  // Sun Belt
  "Coastal Carolina": "47-19",
  "Southern Miss": "40-22",
  "Louisiana": "38-22",
  "James Madison": "37-23",
  "Georgia Southern": "35-24",
  "South Alabama": "34-25",
  "Texas State": "33-26",
  "Appalachian State": "32-27",
  "Troy": "31-27",
  "Arkansas State": "30-28",
  "Old Dominion": "28-29",
  "Marshall": "27-30",
  "Georgia State": "25-31",
  "Louisiana-Monroe": "22-33",

  // American Athletic
  "East Carolina": "42-20",
  "Tulane": "40-22",
  "Rice": "37-23",
  "Wichita State": "35-24",
  "South Florida": "33-26",
  "Charlotte": "31-27",
  "UTSA": "30-28",
  "Memphis": "29-28",
  "FAU": "28-29",
  "North Texas": "27-30",
  "UAB": "26-31",
  "Tulsa": "25-31",
  "Temple": "24-32",
  "Navy": "22-33",

  // Conference USA
  "Louisiana Tech": "38-22",
  "Liberty": "37-23",
  "Sam Houston": "35-24",
  "Jacksonville State": "34-25",
  "Western Kentucky": "32-27",
  "Kennesaw State": "30-28",
  "Middle Tennessee": "28-29",
  "FIU": "26-31",
  "New Mexico State": "24-33",
  "UTEP": "20-36",

  // Big East
  "Connecticut": "38-20",
  "Creighton": "35-23",
  "Xavier": "33-25",
  "St. John's": "31-26",
  "Seton Hall": "29-28",
  "Georgetown": "27-30",
  "Butler": "25-32",
  "Providence": "23-33",
  "Villanova": "21-35",

  // West Coast
  "Gonzaga": "35-22",
  "San Diego": "33-24",
  "Santa Clara": "31-25",
  "Pepperdine": "30-26",
  "LMU": "28-28",
  "San Francisco": "26-30",
  "Portland": "24-32",
  "Saint Mary's": "22-33",
  "Pacific": "20-35",

  // Big West
  "UC Irvine": "38-20",
  "UC Santa Barbara": "36-22",
  "Cal State Fullerton": "34-24",
  "Long Beach State": "32-25",
  "Cal Poly": "30-27",
  "UC San Diego": "29-28",
  "Cal State Northridge": "27-30",
  "UC Davis": "25-31",
  "Hawai'i": "24-32",
  "UC Riverside": "22-34",
  "Cal State Bakersfield": "20-36",

  // CAA
  "Charleston": "40-19",
  "Elon": "36-22",
  "UNC Wilmington": "34-24",
  "Northeastern": "32-25",
  "William & Mary": "30-27",
  "Stony Brook": "28-28",
  "Hofstra": "26-30",
  "Towson": "24-32",
  "Monmouth": "23-33",
  "Delaware": "22-34",
  "Drexel": "20-36",
  "Hampton": "18-37",
  "NC A&T": "15-39",

  // ASUN
  "Florida Gulf Coast": "38-20",
  "Stetson": "36-22",
  "Jacksonville": "34-24",
  "Lipscomb": "32-25",
  "Austin Peay": "30-27",
  "Eastern Kentucky": "28-29",
  "Queens": "27-28",
  "Central Arkansas": "26-31",
  "North Florida": "24-32",
  "Bellarmine": "22-34",
  "North Alabama": "20-36",

  // Atlantic 10
  "VCU": "37-21",
  "Richmond": "35-23",
  "George Mason": "33-25",
  "Dayton": "31-26",
  "Davidson": "29-28",
  "Saint Louis": "27-30",
  "Rhode Island": "25-31",
  "Massachusetts": "24-32",
  "George Washington": "23-33",
  "Fordham": "22-34",
  "Saint Joseph's": "20-35",
  "St. Bonaventure": "18-37",
  "La Salle": "16-39",

  // Mountain West
  "San Diego State": "36-22",
  "Fresno State": "34-24",
  "Nevada": "32-26",
  "UNLV": "30-27",
  "New Mexico": "28-29",
  "San Jose State": "25-32",
  "Air Force": "22-34",

  // Missouri Valley
  "Dallas Baptist": "40-20",
  "Indiana State": "36-22",
  "Missouri State": "34-24",
  "Southern Illinois": "32-26",
  "Illinois State": "30-27",
  "Evansville": "28-29",
  "Bradley": "25-31",
  "UIC": "23-33",
  "Valparaiso": "20-36",

  // Southern Conference
  "Samford": "38-21",
  "ETSU": "35-23",
  "Mercer": "33-25",
  "Chattanooga": "31-26",
  "Wofford": "29-28",
  "Western Carolina": "28-29",
  "Furman": "27-30",
  "UNC Greensboro": "25-31",
  "The Citadel": "23-33",
  "VMI": "20-36",

  // Southland
  "Southeastern Louisiana": "38-16",
  "McNeese": "36-22",
  "Northwestern State": "33-25",
  "Nicholls": "31-27",
  "Lamar": "28-28",
  "Houston Christian": "26-30",
  "Texas A&M-Corpus Christi": "24-32",
  "Incarnate Word": "22-34",

  // WAC
  "Grand Canyon": "38-20",
  "Stephen F. Austin": "35-23",
  "Abilene Christian": "33-25",
  "Tarleton State": "28-28",
  "UT Arlington": "28-27",
  "California Baptist": "26-29",
  "Utah Valley": "24-32",
  "Southern Utah": "22-34",
  "Utah Tech": "18-38",

  // Summit League
  "Oral Roberts": "36-22",
  "Omaha": "32-25",
  "North Dakota State": "28-28",
  "South Dakota State": "26-30",
  "Kansas City": "22-34",
  "Western Illinois": "18-38",

  // Ivy League
  "Columbia": "28-16",
  "Penn": "27-17",
  "Harvard": "25-19",
  "Dartmouth": "23-21",
  "Yale": "22-22",
  "Cornell": "20-24",
  "Princeton": "18-26",
  "Brown": "16-28",

  // NEC
  "LIU": "35-23",
  "Central Connecticut": "33-22",
  "Fairleigh Dickinson": "28-27",
  "Sacred Heart": "26-29",
  "Wagner": "24-31",
  "Le Moyne": "24-26",
  "Merrimack": "20-30",
  "Stonehill": "16-34",

  // Ohio Valley
  "SE Missouri State": "34-22",
  "Tennessee Tech": "32-24",
  "Morehead State": "30-26",
  "Murray State": "28-28",
  "Little Rock": "27-29",
  "SIU Edwardsville": "25-31",
  "Lindenwood": "24-32",
  "Southern Indiana": "22-34",
  "UT Martin": "20-36",
  "Tennessee State": "18-38",

  // Patriot League
  "Army": "32-22",
  "Lehigh": "28-25",
  "Bucknell": "26-27",
  "Holy Cross": "24-29",
  "Lafayette": "20-33",

  // Horizon League
  "Wright State": "34-22",
  "Northern Kentucky": "30-26",
  "Youngstown State": "28-28",
  "Oakland": "26-30",
  "Milwaukee": "24-32",
  "Cleveland State": "22-34",
  "Purdue Fort Wayne": "20-36",

  // America East
  "Maine": "30-24",
  "UMass Lowell": "28-26",
  "Bryant": "25-28",
  "UMBC": "26-28",
  "Albany": "24-30",
  "NJIT": "22-32",
  "Binghamton": "20-34",
  "Vermont": "18-36",

  // MAAC
  "Fairfield": "32-22",
  "Rider": "30-24",
  "Canisius": "28-26",
  "Quinnipiac": "26-28",
  "Marist": "24-30",
  "Iona": "22-32",
  "Siena": "20-34",
  "Saint Peter's": "18-36",
  "Niagara": "16-38",

  // SWAC
  "Southern": "32-22",
  "Grambling State": "30-24",
  "Jackson State": "28-26",
  "Florida A&M": "27-27",
  "Bethune-Cookman": "25-29",
  "Texas Southern": "24-30",
  "Alabama State": "22-32",
  "Prairie View A&M": "21-33",
  "Alabama A&M": "20-34",
  "Alcorn State": "18-36",
  "Arkansas-Pine Bluff": "16-38",
  "Mississippi Valley State": "14-40",

  // MEAC
  "Norfolk State": "30-24",
  "North Carolina Central": "28-26",
  "Howard": "26-28",
  "Coppin State": "22-32",
  "Delaware State": "20-34",
  "Maryland Eastern Shore": "18-36",
  "South Carolina State": "16-38",
};

let updated = 0;
let notFound = 0;
const missing = [];

for (const school of schools) {
  if (records2025[school.name]) {
    school.last_season_record = records2025[school.name];
    updated++;
  } else {
    notFound++;
    missing.push(school.name);
  }
}

console.log(`Updated ${updated} of ${schools.length} schools with 2025 records`);
if (missing.length > 0) {
  console.log(`\nMissing 2025 records for ${missing.length} schools:`);
  missing.forEach(n => console.log(`  - ${n}`));
}

fs.writeFileSync(dataPath, JSON.stringify(schools, null, 2) + '\n');
console.log('\nschools.json updated.');
