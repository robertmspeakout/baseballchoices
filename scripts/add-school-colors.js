const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'data', 'schools.json');
const schools = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Comprehensive NCAA school primary colors
const colorMap = {
  // SEC
  "Alabama": "#9E1B32", "Auburn": "#0C2340", "Arkansas": "#9D2235", "Florida": "#0021A5",
  "Georgia": "#BA0C2F", "Kentucky": "#0033A0", "LSU": "#461D7C", "Mississippi State": "#660000",
  "Missouri": "#F1B82D", "Ole Miss": "#CE1126", "South Carolina": "#73000A", "Tennessee": "#FF8200",
  "Texas A&M": "#500000", "Vanderbilt": "#866D4B", "Oklahoma": "#841617", "Texas": "#BF5700",
  // ACC
  "Boston College": "#98002E", "Clemson": "#F56600", "Duke": "#003087", "Florida State": "#782F40",
  "Georgia Tech": "#B3A369", "Louisville": "#AD0000", "Miami (FL)": "#F47321", "NC State": "#CC0000",
  "North Carolina": "#7BAFD4", "Notre Dame": "#0C2340", "Pittsburgh": "#003594", "Syracuse": "#F76900",
  "Virginia": "#232D4B", "Virginia Tech": "#861F41", "Wake Forest": "#9E7E38", "Stanford": "#8C1515",
  "California": "#003262", "SMU": "#CC0035",
  // Big Ten
  "Illinois": "#E84A27", "Indiana": "#990000", "Iowa": "#FFCD00", "Maryland": "#E03C31",
  "Michigan": "#00274C", "Michigan State": "#18453B", "Minnesota": "#7A0019", "Nebraska": "#E41C38",
  "Northwestern": "#4E2A84", "Ohio State": "#BB0000", "Penn State": "#041E42", "Purdue": "#CEB888",
  "Rutgers": "#CC0033", "Wisconsin": "#C5050C", "Oregon": "#154733", "Oregon State": "#DC4405",
  "Washington": "#4B2E83", "UCLA": "#2774AE", "USC": "#990000",
  // Big 12
  "Baylor": "#154734", "BYU": "#002E5D", "Cincinnati": "#E00122", "Houston": "#C8102E",
  "Iowa State": "#C8102E", "Kansas": "#0051BA", "Kansas State": "#512888", "Oklahoma State": "#FF6600",
  "TCU": "#4D1979", "Texas Tech": "#CC0000", "UCF": "#BA9B37", "West Virginia": "#002855",
  "Arizona": "#CC0033", "Arizona State": "#8C1D40", "Colorado": "#CFB87C", "Utah": "#CC0000",
  // Pac-12/West
  "Washington State": "#981E32",
  // AAC/Other
  "East Carolina": "#592A8A", "Memphis": "#003087", "Navy": "#00205B", "Temple": "#9D2235",
  "Tulane": "#006747", "Tulsa": "#002D62", "UTSA": "#0C2340", "FAU": "#003366",
  "Charlotte": "#005035", "North Texas": "#00853E", "Rice": "#002469", "UAB": "#1E6B52",
  "South Florida": "#006747",
  // Sun Belt
  "Appalachian State": "#222222", "Coastal Carolina": "#006F71", "Georgia Southern": "#011E44",
  "Georgia State": "#0039A6", "Louisiana": "#CE181E", "Louisiana-Monroe": "#840029",
  "South Alabama": "#00205B", "Texas State": "#501214", "Troy": "#8B2332",
  "Arkansas State": "#CC092F", "James Madison": "#450084", "Marshall": "#00B140",
  "Old Dominion": "#003057", "Southern Miss": "#FFB81C",
  // Mountain West
  "Air Force": "#003087", "Fresno State": "#DB0032", "Nevada": "#003366", "New Mexico": "#BA0C2F",
  "San Diego State": "#A6192E", "San Jose State": "#0055A2", "UNLV": "#CF0A2C", "Utah State": "#0F2439",
  "Wyoming": "#492F24",
  // Missouri Valley
  "Dallas Baptist": "#00205B", "Evansville": "#5F259F", "Illinois State": "#CE1126",
  "Indiana State": "#00609E", "Missouri State": "#8B0D37", "Southern Illinois": "#720000",
  "Valparaiso": "#613318",
  // WCC
  "Gonzaga": "#002967", "Pepperdine": "#00205B", "Portland": "#5B2C82", "San Diego": "#002B5C",
  "San Francisco": "#006633", "Santa Clara": "#862633", "Saint Mary's": "#D2232A", "LMU": "#862633",
  "Pacific": "#F47920",
  // Colonial/CAA
  "Delaware": "#00539F", "Elon": "#800000", "Hofstra": "#00529B", "Northeastern": "#D41B2C",
  "Stony Brook": "#990000", "Towson": "#FFB81C", "William & Mary": "#115740", "UNCW": "#006666",
  // Patriot
  "Army": "#000000", "Bucknell": "#E87722", "Holy Cross": "#602D89", "Lafayette": "#98002E",
  "Lehigh": "#502D0E", "Navy": "#00205B",
  // Big East
  "Butler": "#13294B", "Creighton": "#005CA9", "Georgetown": "#041E42", "Seton Hall": "#004488",
  "St. John's": "#BA0C2F", "UConn": "#000E2F", "Villanova": "#003366", "Xavier": "#0C2340",
  // A10
  "Davidson": "#CC0000", "Dayton": "#CE1141", "Fordham": "#7C2529", "George Mason": "#006633",
  "George Washington": "#004C97", "La Salle": "#003DA5", "Rhode Island": "#75B2DD",
  "Richmond": "#990000", "Saint Joseph's": "#9D2235", "Saint Louis": "#003DA5", "VCU": "#000000",
  // Ivy
  "Brown": "#4E3629", "Columbia": "#9BCBEB", "Cornell": "#B31B1B", "Dartmouth": "#00693E",
  "Harvard": "#A51C30", "Penn": "#011F5B", "Princeton": "#E77500", "Yale": "#00356B",
  // Conference USA
  "FIU": "#081E3F", "Liberty": "#002D62", "Jacksonville State": "#CC0000",
  "Kennesaw State": "#FDBB30", "New Mexico State": "#8B0D37", "Sam Houston": "#F68B1F",
  "Middle Tennessee": "#0066CC",
  // ASUN
  "Bellarmine": "#C41230", "Central Arkansas": "#4F2D7F", "Eastern Kentucky": "#611339",
  "Florida Gulf Coast": "#007749", "Jacksonville": "#006747", "Lipscomb": "#2B2171",
  "North Alabama": "#46166B", "North Florida": "#00457C", "Stetson": "#006747",
  "Queens": "#B8860B",
  // Big South
  "Campbell": "#F47920", "Charleston Southern": "#00205B", "Gardner-Webb": "#BF0D3E",
  "High Point": "#330072", "Longwood": "#003DA5", "Presbyterian": "#00205B",
  "Radford": "#CC0000", "USC Upstate": "#005030", "Winthrop": "#872434",
  // Horizon
  "Northern Kentucky": "#B59A57", "Oakland": "#B89B5B", "Wright State": "#007A33",
  "Milwaukee": "#000000", "Purdue Fort Wayne": "#000000",
  // MAAC
  "Canisius": "#0038A8", "Fairfield": "#CC0000", "Iona": "#6C1D45", "Manhattan": "#006633",
  "Marist": "#C8102E", "Monmouth": "#003DA5", "Niagara": "#602D89", "Quinnipiac": "#002B5C",
  "Rider": "#C41E3A", "Saint Peter's": "#003087", "Siena": "#006633",
  // Southern
  "The Citadel": "#0055B7", "Furman": "#582C83", "Mercer": "#F47920", "Samford": "#003366",
  "UNC Greensboro": "#003DA5", "VMI": "#CC0000", "Wofford": "#917B4C", "ETSU": "#002D62",
  "Chattanooga": "#00386B",
  // Ohio Valley
  "Belmont": "#002469", "Eastern Illinois": "#004B83", "Lindenwood": "#000000",
  "Morehead State": "#0033A0", "Murray State": "#002B5C", "SE Missouri State": "#CC0000",
  "Tennessee State": "#003DA5", "Tennessee Tech": "#4F2683", "UT Martin": "#FF8200",
  "Austin Peay": "#CC0000", "Little Rock": "#8B0D37",
  // Southland
  "Houston Christian": "#FF6600", "Incarnate Word": "#CE1126", "Lamar": "#CC0000",
  "McNeese": "#005EB8", "New Orleans": "#003DA5", "Nicholls": "#CC0000",
  "Northwestern State": "#492F91", "Southeastern Louisiana": "#006747", "Stephen F. Austin": "#3E2B84",
  "Tarleton State": "#4F2D7F", "Texas A&M-Corpus Christi": "#006A4E",
  // Summit
  "North Dakota State": "#006633", "Omaha": "#000000", "Oral Roberts": "#002E5D",
  "South Dakota State": "#0033A0", "Western Illinois": "#663399",
  // America East
  "Albany": "#46166B", "Binghamton": "#005C3C", "Hartford": "#CC0000", "Maine": "#003263",
  "NJIT": "#CC0000", "UMBC": "#000000", "UMass Lowell": "#2D68C4", "Vermont": "#003300",
  // Northeast
  "Bryant": "#000000", "Central Connecticut": "#003DA5", "Fairleigh Dickinson": "#990033",
  "Le Moyne": "#006633", "LIU": "#000000", "Merrimack": "#003DA5", "Mount St. Mary's": "#003DA5",
  "Sacred Heart": "#CC0000", "Stonehill": "#5E2D91", "Wagner": "#006633",
  // WAC
  "Abilene Christian": "#4F2D7F", "California Baptist": "#003DA5", "Grand Canyon": "#522D80",
  "Seattle U": "#AA0000", "Stephen F. Austin": "#3E2B84", "Tarleton State": "#4F2D7F",
  "Utah Tech": "#BA0C2F", "Utah Valley": "#275D38",
  // Misc D1
  "Ball State": "#BA0C2F", "Bowling Green": "#4F2C1D", "Central Michigan": "#6A0032",
  "Eastern Michigan": "#006633", "Kent State": "#002664", "Miami (OH)": "#CC0033",
  "Northern Illinois": "#BA0C2F", "Ohio": "#00694E", "Toledo": "#003366",
  "Western Michigan": "#6C4023", "Akron": "#041E42",
  "Connecticut": "#000E2F", "Massachusetts": "#881C1C",
  "Coppin State": "#C8102E", "Delaware State": "#CC0000", "Florida A&M": "#006747",
  "Hampton": "#003DA5", "Howard": "#003A63", "Maryland Eastern Shore": "#8B0D37",
  "Morgan State": "#F47920", "Norfolk State": "#006633", "NC A&T": "#004684",
  "South Carolina State": "#6D2C3C",
  "Alabama A&M": "#660000", "Alabama State": "#C99700", "Alcorn State": "#4F2683",
  "Arkansas-Pine Bluff": "#000000", "Bethune-Cookman": "#660000", "Grambling State": "#000000",
  "Jackson State": "#003DA5", "Mississippi Valley State": "#006633",
  "Prairie View A&M": "#4F2683", "Southern": "#003DA5", "Texas Southern": "#8B0D37",
  "Cal Poly": "#154734", "Cal State Bakersfield": "#003DA5", "Cal State Fullerton": "#00274C",
  "Cal State Northridge": "#CC0033", "Hawai'i": "#024731", "Long Beach State": "#000000",
  "UC Davis": "#002855", "UC Irvine": "#0064A4", "UC Riverside": "#003DA5",
  "UC San Diego": "#182B49", "UC Santa Barbara": "#003660",
  "Sacramento State": "#006341", "San Francisco State": "#51284F",
  "Wichita State": "#000000", "Bradley": "#CC0000",
  "Charleston": "#800000", "UNC Asheville": "#003DA5", "UNC Wilmington": "#006666",
  "North Florida": "#00457C",
  // More D1
  "Cal State LA": "#C8102E", "Fresno Pacific": "#003DA5", "Point Loma": "#006633",
  "FIU": "#081E3F", "Florida Tech": "#990000",
  // Common D2 schools
  "Tampa": "#CC0000", "Nova Southeastern": "#003DA5", "Lynn": "#003DA5",
  "Rollins": "#002C6A", "Florida Southern": "#CC0033", "Embry-Riddle": "#003DA5",
  "West Florida": "#003DA5", "Valdosta State": "#CC0000", "Delta State": "#006633",
  "Grand Valley State": "#0065A4", "Ashland": "#5E2D91",
  "Slippery Rock": "#006633", "West Chester": "#660066", "Millersville": "#000000",
  "Shippensburg": "#00205B", "Kutztown": "#6D0022", "IUP": "#7E0C33",
  "Clarion": "#003DA5", "Lock Haven": "#8B0D37",
};

// Default color for schools not in the map
const DEFAULT_COLOR = "#1e3a5f";

let mapped = 0;
let defaulted = 0;

schools.forEach(school => {
  if (colorMap[school.name]) {
    school.primary_color = colorMap[school.name];
    mapped++;
  } else {
    school.primary_color = DEFAULT_COLOR;
    defaulted++;
  }
});

fs.writeFileSync(filePath, JSON.stringify(schools, null, 2) + '\n');
console.log(`Done! ${mapped} mapped, ${defaulted} defaulted to ${DEFAULT_COLOR}`);
console.log(`Total: ${schools.length} schools`);
