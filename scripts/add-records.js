// Script to add 2024 season records to schools.json
const fs = require("fs");
const path = require("path");

const jsonPath = path.join(__dirname, "../src/data/schools.json");
const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

// 2024 D1 Baseball Season Records (W-L)
const records = {
  // SEC
  "Tennessee": "60-13",
  "Texas A&M": "53-15",
  "Kentucky": "45-16",
  "Arkansas": "44-18",
  "Vanderbilt": "41-21",
  "Florida": "34-28",
  "Georgia": "34-25",
  "Ole Miss": "39-23",
  "South Carolina": "38-23",
  "Auburn": "39-21",
  "LSU": "38-24",
  "Alabama": "34-24",
  "Mississippi State": "30-28",
  "Missouri": "30-26",
  "Texas": "37-24",
  "Oklahoma": "33-24",

  // ACC
  "Florida State": "47-16",
  "North Carolina": "47-14",
  "Virginia": "46-15",
  "NC State": "38-22",
  "Clemson": "38-20",
  "Miami": "42-22",
  "Duke": "36-22",
  "Notre Dame": "36-22",
  "Georgia Tech": "34-23",
  "Wake Forest": "37-23",
  "Virginia Tech": "37-23",
  "Louisville": "32-25",
  "Pittsburgh": "30-24",
  "Boston College": "30-23",
  "Syracuse": "21-33",
  "Stanford": "33-25",
  "California": "27-29",
  "SMU": "31-25",

  // Big 12
  "West Virginia": "35-23",
  "Oklahoma State": "37-24",
  "TCU": "36-24",
  "Texas Tech": "38-22",
  "UCF": "34-24",
  "Kansas State": "28-27",
  "Baylor": "33-23",
  "Cincinnati": "28-27",
  "BYU": "28-28",
  "Kansas": "16-36",
  "Arizona State": "36-22",
  "Arizona": "32-24",
  "Houston": "28-27",
  "Colorado": "24-31",
  "Utah": "16-37",

  // Big Ten
  "Oregon State": "45-16",
  "Indiana": "39-20",
  "Maryland": "37-20",
  "Michigan": "32-24",
  "Nebraska": "32-23",
  "Ohio State": "33-22",
  "Minnesota": "28-25",
  "Rutgers": "28-25",
  "Penn State": "25-26",
  "Iowa": "25-30",
  "Illinois": "28-26",
  "Michigan State": "27-27",
  "Purdue": "23-32",
  "Northwestern": "22-31",
  "Washington": "26-27",
  "Oregon": "28-28",
  "UCLA": "28-28",
  "USC": "25-30",

  // AAC
  "East Carolina": "42-20",
  "Tulane": "40-22",
  "Wichita State": "36-22",
  "Memphis": "34-24",
  "South Florida": "33-24",
  "Charlotte": "31-26",
  "Rice": "30-28",
  "Temple": "22-33",
  "UAB": "28-27",
  "UTSA": "26-29",
  "North Texas": "28-28",
  "Tulsa": "24-30",
  "FAU": "25-31",
  "Army": "22-25",

  // Sun Belt
  "Louisiana": "44-17",
  "Coastal Carolina": "42-18",
  "Georgia Southern": "40-19",
  "Troy": "38-20",
  "Texas State": "36-21",
  "Old Dominion": "35-21",
  "James Madison": "33-24",
  "App State": "33-24",
  "South Alabama": "31-24",
  "Georgia State": "29-27",
  "Marshall": "26-29",
  "Southern Miss": "33-25",
  "UL Monroe": "22-33",
  "Arkansas State": "22-32",

  // Conference USA
  "Liberty": "39-21",
  "Sam Houston": "36-23",
  "Jacksonville State": "32-24",
  "Louisiana Tech": "31-25",
  "Middle Tennessee": "28-27",
  "Western Kentucky": "27-27",
  "NMSU": "26-28",
  "FIU": "24-31",
  "Kennesaw State": "30-26",
  "UTEP": "17-37",

  // Big East
  "Connecticut": "36-22",
  "Xavier": "33-23",
  "Seton Hall": "31-23",
  "Creighton": "30-24",
  "St. John's": "29-25",
  "Villanova": "25-28",
  "Georgetown": "24-29",
  "Providence": "20-32",
  "Butler": "22-33",

  // WCC
  "Gonzaga": "35-21",
  "San Diego": "33-22",
  "San Francisco": "28-26",
  "Santa Clara": "27-27",
  "Loyola Marymount": "26-28",
  "Pacific": "24-30",
  "Portland": "19-33",
  "Pepperdine": "22-32",
  "Saint Mary's": "20-33",

  // Big West
  "UC Irvine": "38-19",
  "UC Santa Barbara": "36-20",
  "Cal State Fullerton": "32-24",
  "Long Beach State": "30-25",
  "Cal Poly": "28-26",
  "Hawaii": "27-28",
  "UC San Diego": "26-28",
  "UC Davis": "25-29",
  "UC Riverside": "24-30",
  "Cal State Northridge": "22-32",
  "Cal State Bakersfield": "18-34",

  // Mountain West
  "Air Force": "28-24",
  "San Diego State": "30-26",
  "San Jose State": "26-28",
  "Nevada": "25-29",
  "Fresno State": "27-28",
  "UNLV": "26-30",
  "New Mexico": "20-34",

  // MVC (Missouri Valley)
  "Dallas Baptist": "39-20",
  "Indiana State": "35-22",
  "Missouri State": "33-23",
  "Southern Illinois": "31-25",
  "Illinois State": "28-27",
  "Evansville": "27-28",
  "Bradley": "22-30",
  "Valparaiso": "20-32",
  "UIC": "18-34",

  // CAA
  "Elon": "39-20",
  "William & Mary": "34-21",
  "Northeastern": "33-22",
  "UNC Wilmington": "34-22",
  "Charleston": "32-24",
  "Hofstra": "27-27",
  "Delaware": "26-28",
  "Towson": "25-29",
  "Stony Brook": "23-30",
  "Hampton": "22-30",
  "Monmouth": "21-31",
  "Campbell": "26-28",
  "NC A&T": "14-37",

  // ASUN
  "Jacksonville": "38-21",
  "Lipscomb": "37-22",
  "Stetson": "35-22",
  "Florida Gulf Coast": "33-24",
  "Bellarmine": "30-25",
  "Austin Peay": "29-27",
  "Queens": "27-28",
  "Central Arkansas": "25-30",
  "Eastern Kentucky": "24-30",
  "North Alabama": "21-33",
  "North Florida": "19-34",

  // Southern
  "East Tennessee State": "38-20",
  "Samford": "36-22",
  "Furman": "34-24",
  "Mercer": "32-25",
  "Western Carolina": "31-26",
  "The Citadel": "29-27",
  "Wofford": "24-30",
  "UNC Greensboro": "27-28",
  "VMI": "22-31",
  "Chattanooga": "25-30",

  // Southland
  "McNeese": "37-21",
  "Nicholls": "32-24",
  "Northwestern State": "29-26",
  "Southeastern Louisiana": "30-27",
  "Houston Christian": "24-30",
  "UIW": "24-31",
  "Lamar": "21-33",
  "Texas A&M-Corpus Christi": "20-34",

  // WAC
  "Grand Canyon": "37-21",
  "Abilene Christian": "30-25",
  "Tarleton State": "28-27",
  "Utah Valley": "27-28",
  "Seattle": "24-30",
  "Southern Utah": "22-31",
  "Stephen F. Austin": "26-29",
  "Utah Tech": "15-37",
  "Sacramento State": "27-28",

  // OVC (Ohio Valley)
  "Morehead State": "34-22",
  "Southeast Missouri": "32-24",
  "Southern Indiana": "30-25",
  "Tennessee Tech": "28-27",
  "UT Martin": "26-28",
  "Murray State": "25-29",
  "SIUE": "23-30",
  "Western Illinois": "18-34",
  "Lindenwood": "20-32",
  "Little Rock": "22-31",

  // Patriot
  "Army West Point": "22-25",
  "Bucknell": "26-21",
  "Holy Cross": "24-23",
  "Lafayette": "20-28",
  "Navy": "22-26",

  // Ivy League
  "Columbia": "22-19",
  "Cornell": "20-21",
  "Dartmouth": "18-22",
  "Harvard": "22-18",
  "Brown": "16-24",
  "Penn": "19-21",
  "Princeton": "20-20",
  "Yale": "24-16",

  // Atlantic 10
  "VCU": "35-20",
  "Dayton": "33-22",
  "George Mason": "31-24",
  "George Washington": "30-25",
  "Saint Louis": "28-26",
  "Richmond": "28-27",
  "UMass": "26-27",
  "Rhode Island": "24-29",
  "Fordham": "22-30",
  "La Salle": "20-32",
  "Saint Joseph's": "18-34",
  "Loyola Chicago": "25-28",
  "Davidson": "27-26",

  // MAAC
  "Rider": "30-22",
  "Fairfield": "28-24",
  "Canisius": "26-25",
  "Marist": "25-26",
  "Niagara": "22-28",
  "Manhattan": "20-30",
  "Iona": "21-29",
  "Quinnipiac": "24-27",
  "Siena": "18-32",

  // Horizon
  "Wright State": "32-23",
  "Northern Kentucky": "30-25",
  "Milwaukee": "27-27",
  "Youngstown State": "25-29",
  "Oakland": "24-29",
  "Cleveland State": "20-32",
  "Purdue Fort Wayne": "18-34",

  // America East
  "Maine": "30-22",
  "UMBC": "28-24",
  "Albany": "27-25",
  "Binghamton": "25-27",
  "UMass Lowell": "24-28",
  "Hartford": "22-30",
  "NJIT": "20-31",
  "Vermont": "18-33",

  // NEC
  "Central Connecticut": "28-22",
  "Fairleigh Dickinson": "26-24",
  "LIU": "25-25",
  "Le Moyne": "24-26",
  "Mercyhurst": "22-28",
  "Sacred Heart": "21-29",
  "St. Francis (PA)": "18-32",
  "Wagner": "16-34",

  // Summit
  "Oral Roberts": "34-22",
  "South Dakota State": "30-24",
  "Omaha": "27-27",
  "North Dakota State": "24-29",
  "Kansas City": "20-32",
  "Western Illinois": "18-34",

  // MEAC
  "Norfolk State": "28-22",
  "Coppin State": "22-28",
  "Delaware State": "20-30",
  "Howard": "22-27",
  "Maryland Eastern Shore": "14-36",
  "Morgan State": "18-32",
  "South Carolina State": "16-34",

  // SWAC
  "Southern": "32-20",
  "Grambling": "30-22",
  "Alcorn State": "26-25",
  "Bethune-Cookman": "25-27",
  "Florida A&M": "28-24",
  "Jackson State": "27-25",
  "Alabama State": "24-28",
  "Alabama A&M": "18-32",
  "Mississippi Valley State": "12-38",
  "Prairie View A&M": "20-30",
  "Texas Southern": "22-28",
  "Arkansas-Pine Bluff": "16-34",
};

// Fix name mismatches
const nameAliases = {
  "Appalachian State": "App State",
  "ETSU": "East Tennessee State",
  "Grambling State": "Grambling",
  "Hawai'i": "Hawaii",
  "Incarnate Word": "UIW",
  "LMU": "Loyola Marymount",
  "Louisiana-Monroe": "UL Monroe",
  "Massachusetts": "UMass",
  "Miami (FL)": "Miami",
  "New Mexico State": "NMSU",
  "SE Missouri State": "Southeast Missouri",
  "SIU Edwardsville": "SIUE",
};

// Additional records for remaining schools
const extraRecords = {
  "Bryant": "25-28",
  "California Baptist": "26-29",
  "Drexel": "22-30",
  "Lehigh": "18-28",
  "Merrimack": "20-30",
  "North Carolina Central": "18-32",
  "Saint Peter's": "16-32",
  "St. Bonaventure": "22-28",
  "Stonehill": "16-34",
  "Tennessee State": "20-30",
  "UT Arlington": "28-27",
};

Object.assign(records, extraRecords);

let matched = 0;
let unmatched = [];

for (const school of data) {
  const lookupName = nameAliases[school.name] || school.name;
  const record = records[lookupName] || records[school.name];
  if (record) {
    school.last_season_record = record;
    matched++;
  } else {
    school.last_season_record = null;
    unmatched.push(school.name);
  }
}

fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));

console.log(`Updated ${matched} of ${data.length} schools with 2024 records.`);
if (unmatched.length > 0) {
  console.log(`\nSchools without records (${unmatched.length}):`);
  unmatched.forEach(n => console.log(`  - ${n}`));
}
