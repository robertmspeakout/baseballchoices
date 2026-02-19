const fs = require('fs');
const path = require('path');

// Comprehensive mapping of all 564 NCAA school names to their primary hex color.
// Sources: official brand guides, athletics style guides, and well-known team identities.
const COLOR_MAP = {
  // ===== D1 Schools (alphabetical) =====
  "Abilene Christian": "#4E2683",    // purple - Wildcats
  "Air Force": "#003087",            // blue - Falcons
  "Akron": "#041E42",               // navy - Zips
  "Alabama": "#9E1B32",             // crimson - Crimson Tide
  "Alabama A&M": "#660000",         // maroon - Bulldogs
  "Alabama State": "#C99700",       // gold - Hornets (black & gold)
  "Albany": "#461D7C",              // purple - Great Danes
  "Alcorn State": "#4F2683",        // purple - Braves
  "Appalachian State": "#222222",   // black - Mountaineers (black & gold)
  "Arizona": "#CC0033",             // cardinal red - Wildcats
  "Arizona State": "#8C1D40",       // maroon - Sun Devils
  "Arkansas": "#9D2235",            // cardinal - Razorbacks
  "Arkansas State": "#CC092F",      // scarlet - Red Wolves
  "Arkansas-Pine Bluff": "#EEB111", // gold - Golden Lions
  "Army": "#000000",                // black - Black Knights
  "Auburn": "#0C2340",              // navy blue - Tigers
  "Austin Peay": "#C8102E",         // red - Governors
  "BYU": "#002E5D",                 // navy blue - Cougars
  "Ball State": "#BA0C2F",          // cardinal - Cardinals
  "Baylor": "#003015",              // green - Bears
  "Bellarmine": "#C41230",          // scarlet red - Knights
  "Belmont": "#002469",             // navy blue - Bruins
  "Bethune-Cookman": "#841B2D",     // maroon - Wildcats
  "Binghamton": "#005A43",          // dark green - Bearcats
  "Boston College": "#98002E",      // maroon - Eagles
  "Bowling Green": "#FF7300",       // orange - Falcons
  "Bradley": "#CC0000",             // red - Braves
  "Brown": "#4E3629",               // brown - Bears
  "Bryant": "#000000",              // black - Bulldogs (black & gold)
  "Bucknell": "#E87722",            // orange - Bison
  "Butler": "#13294B",              // navy - Bulldogs
  "Cal Poly": "#154734",            // green - Mustangs
  "Cal State Bakersfield": "#003DA5",// blue - Roadrunners
  "Cal State Fullerton": "#00274C", // navy - Titans
  "Cal State Northridge": "#CE1141",// red - Matadors
  "California": "#003262",          // blue - Golden Bears
  "California Baptist": "#003DA5",  // navy - Lancers
  "Campbell": "#F47920",            // orange - Fighting Camels
  "Canisius": "#0038A8",            // blue - Golden Griffins
  "Central Arkansas": "#4F2D7F",    // purple - Bears
  "Central Connecticut": "#003DA5", // blue - Blue Devils
  "Central Michigan": "#6A0032",    // maroon - Chippewas
  "Charleston": "#800000",          // maroon - Cougars (College of Charleston)
  "Charleston Southern": "#00205B", // navy - Buccaneers
  "Charlotte": "#005035",           // green - 49ers
  "Cincinnati": "#E00122",          // red - Bearcats
  "Clemson": "#F56600",             // orange - Tigers
  "Coastal Carolina": "#006F71",    // teal - Chanticleers
  "Columbia": "#9BCBEB",            // Columbia blue - Lions
  "Connecticut": "#000E2F",         // navy - Huskies
  "Coppin State": "#C8102E",        // red - Eagles
  "Cornell": "#B31B1B",             // carnelian red - Big Red
  "Creighton": "#005CA9",           // blue - Bluejays
  "Dallas Baptist": "#00205B",      // navy - Patriots
  "Dartmouth": "#00693E",           // green - Big Green
  "Davidson": "#CC0000",            // red - Wildcats
  "Dayton": "#CE1141",              // red - Flyers
  "Delaware": "#00539F",            // blue - Blue Hens
  "Delaware State": "#CC0000",      // red - Hornets
  "Duke": "#003087",                // blue - Blue Devils
  "ETSU": "#002D62",                // navy - Buccaneers
  "East Carolina": "#592A8A",       // purple - Pirates
  "Eastern Illinois": "#004B83",    // blue - Panthers
  "Eastern Kentucky": "#611339",    // maroon - Colonels
  "Eastern Michigan": "#006633",    // green - Eagles
  "Elon": "#800000",                // maroon - Phoenix
  "Evansville": "#5F259F",          // purple - Purple Aces
  "FAU": "#003366",                 // navy - Owls (Florida Atlantic)
  "FIU": "#081E3F",                 // navy - Panthers (Florida International)
  "Fairfield": "#CC0000",           // red - Stags
  "Fairleigh Dickinson": "#990033", // maroon - Knights
  "Florida": "#0021A5",             // blue - Gators
  "Florida A&M": "#006747",         // green - Rattlers
  "Florida Gulf Coast": "#007749",  // green - Eagles
  "Florida State": "#782F40",       // garnet - Seminoles
  "Fordham": "#7C2529",             // maroon - Rams
  "Fresno State": "#DB0032",        // red - Bulldogs
  "Gardner-Webb": "#BF0D3E",        // red - Runnin' Bulldogs
  "George Mason": "#006633",        // green - Patriots
  "George Washington": "#004C97",   // blue - Colonials
  "Georgetown": "#041E42",          // navy - Hoyas
  "Georgia": "#BA0C2F",             // red - Bulldogs
  "Georgia Southern": "#011E44",    // navy - Eagles
  "Georgia State": "#0039A6",       // blue - Panthers
  "Georgia Tech": "#B3A369",        // Tech Gold - Yellow Jackets
  "Gonzaga": "#002967",             // navy - Bulldogs
  "Grambling State": "#000000",     // black - Tigers (black & gold)
  "Grand Canyon": "#522D80",        // purple - Antelopes
  "Hampton": "#003DA5",             // blue - Pirates
  "Harvard": "#A51C30",             // crimson - Crimson
  "Hawai'i": "#024731",             // green - Rainbow Warriors
  "High Point": "#330072",          // purple - Panthers
  "Hofstra": "#00529B",             // blue - Pride
  "Holy Cross": "#602D89",          // purple - Crusaders
  "Houston": "#C8102E",             // red - Cougars
  "Houston Christian": "#FF6600",   // orange - Huskies
  "Illinois": "#E84A27",            // orange - Fighting Illini
  "Illinois State": "#CE1126",      // red - Redbirds
  "Incarnate Word": "#CE1126",      // red - Cardinals
  "Indiana": "#990000",             // crimson - Hoosiers
  "Indiana State": "#00609E",       // blue - Sycamores
  "Iona": "#6C1D45",                // maroon - Gaels
  "Iowa": "#FFCD00",                // gold - Hawkeyes
  "Jackson State": "#003DA5",       // blue - Tigers
  "Jacksonville": "#006747",        // green - Dolphins
  "Jacksonville State": "#CC0000",  // red - Gamecocks
  "James Madison": "#450084",       // purple - Dukes
  "Kansas": "#0051BA",              // blue - Jayhawks
  "Kansas State": "#512888",        // purple - Wildcats
  "Kennesaw State": "#FDBB30",      // gold - Owls
  "Kent State": "#002664",          // navy - Golden Flashes
  "Kentucky": "#0033A0",            // blue - Wildcats
  "LIU": "#000000",                 // black - Sharks
  "LMU": "#862633",                 // crimson - Lions (Loyola Marymount)
  "LSU": "#461D7C",                 // purple - Tigers
  "La Salle": "#003DA5",            // blue - Explorers
  "Lafayette": "#98002E",           // maroon - Leopards
  "Lamar": "#CC0000",               // red - Cardinals
  "Le Moyne": "#006633",            // green - Dolphins
  "Lehigh": "#502D0E",              // brown - Mountain Hawks
  "Liberty": "#002D62",             // navy - Flames
  "Lindenwood": "#000000",          // black - Lions
  "Lipscomb": "#2B2171",            // purple - Bisons
  "Little Rock": "#8B0D37",         // maroon - Trojans
  "Long Beach State": "#000000",    // black - Beach (black & gold)
  "Longwood": "#003DA5",            // blue - Lancers
  "Louisiana": "#CE181E",           // vermilion - Ragin' Cajuns
  "Louisiana Tech": "#002F8B",      // blue - Bulldogs
  "Louisiana-Monroe": "#840029",    // maroon - Warhawks
  "Louisville": "#AD0000",          // red - Cardinals
  "Maine": "#003263",               // blue - Black Bears
  "Manhattan": "#006633",           // green - Jaspers
  "Marist": "#C8102E",              // red - Red Foxes
  "Marshall": "#00B140",            // kelly green - Thundering Herd
  "Maryland": "#E03C31",            // red - Terrapins
  "Maryland Eastern Shore": "#8B0D37",// maroon - Hawks
  "Massachusetts": "#881C1C",       // maroon - Minutemen
  "McNeese": "#005EB8",             // blue - Cowboys
  "Memphis": "#003087",             // blue - Tigers
  "Mercer": "#F47920",              // orange - Bears
  "Mercyhurst": "#006747",          // green - Lakers
  "Merrimack": "#003DA5",           // blue - Warriors
  "Miami (FL)": "#F47321",          // orange - Hurricanes
  "Miami (OH)": "#CC0033",          // red - RedHawks
  "Michigan": "#00274C",            // blue - Wolverines
  "Michigan State": "#18453B",      // green - Spartans
  "Middle Tennessee": "#0066CC",    // blue - Blue Raiders
  "Milwaukee": "#000000",           // black - Panthers (black & gold)
  "Minnesota": "#7A0019",           // maroon - Golden Gophers
  "Mississippi State": "#660000",   // maroon - Bulldogs
  "Mississippi Valley State": "#006633",// green - Delta Devils
  "Missouri": "#F1B82D",            // gold - Tigers
  "Missouri State": "#8B0D37",      // maroon - Bears
  "Monmouth": "#003DA5",            // blue - Hawks
  "Morehead State": "#0033A0",      // blue - Eagles
  "Mount St. Mary's": "#003DA5",    // blue - Mountaineers
  "Murray State": "#002B5C",        // navy - Racers
  "NC A&T": "#004684",              // blue - Aggies
  "NC State": "#CC0000",            // red - Wolfpack
  "NJIT": "#CC0000",                // red - Highlanders
  "Navy": "#00205B",                // navy - Midshipmen
  "Nebraska": "#E41C38",            // scarlet - Cornhuskers
  "Nevada": "#003366",              // navy - Wolf Pack
  "New Haven": "#003DA5",           // blue - Chargers
  "New Mexico": "#BA0C2F",          // cherry - Lobos
  "New Mexico State": "#8B0D37",    // crimson - Aggies
  "New Orleans": "#003DA5",         // blue - Privateers
  "Niagara": "#602D89",             // purple - Purple Eagles
  "Nicholls": "#CC0000",            // red - Colonels
  "Norfolk State": "#006633",       // green - Spartans
  "North Alabama": "#46166B",       // purple - Lions
  "North Carolina": "#7BAFD4",      // Carolina blue - Tar Heels
  "North Dakota State": "#006633",  // green - Bison
  "North Florida": "#00457C",       // blue - Ospreys
  "North Texas": "#00853E",         // green - Mean Green
  "Northeastern": "#D41B2C",        // red - Huskies
  "Northern Colorado": "#003366",   // navy - Bears
  "Northern Illinois": "#BA0C2F",   // cardinal - Huskies
  "Northern Kentucky": "#B59A57",   // gold - Norse
  "Northwestern": "#4E2A84",        // purple - Wildcats
  "Northwestern State": "#492F91",  // purple - Demons
  "Notre Dame": "#0C2340",          // navy - Fighting Irish
  "Oakland": "#B89B5B",             // gold - Golden Grizzlies
  "Ohio": "#00694E",                // green - Bobcats
  "Ohio State": "#BB0000",          // scarlet - Buckeyes
  "Oklahoma": "#841617",            // crimson - Sooners
  "Oklahoma State": "#FF6600",      // orange - Cowboys
  "Old Dominion": "#003057",        // blue - Monarchs
  "Ole Miss": "#CE1126",            // red - Rebels
  "Omaha": "#000000",               // black - Mavericks (crimson & black)
  "Oral Roberts": "#002E5D",        // navy - Golden Eagles
  "Oregon": "#154733",              // green - Ducks
  "Oregon State": "#DC4405",        // orange - Beavers
  "Pacific": "#F47920",             // orange - Tigers
  "Penn": "#011F5B",                // blue - Quakers
  "Penn State": "#041E42",          // navy - Nittany Lions
  "Pepperdine": "#00205B",          // blue - Waves
  "Pittsburgh": "#003594",          // blue - Panthers
  "Portland": "#5B2C82",            // purple - Pilots
  "Prairie View A&M": "#4F2683",    // purple - Panthers
  "Presbyterian": "#00205B",        // blue - Blue Hose
  "Princeton": "#E77500",           // orange - Tigers
  "Purdue": "#CEB888",              // old gold - Boilermakers
  "Queens": "#002B5C",              // navy - Royals
  "Quinnipiac": "#002B5C",          // navy - Bobcats
  "Radford": "#CC0000",             // red - Highlanders
  "Rhode Island": "#75B2DD",        // Keaney blue - Rams
  "Rice": "#002469",                // blue - Owls
  "Richmond": "#990000",            // red - Spiders
  "Rider": "#C41E3A",               // cranberry - Broncs
  "Rutgers": "#CC0033",             // scarlet - Scarlet Knights
  "SE Missouri State": "#CC0000",   // red - Redhawks
  "SIU Edwardsville": "#CC0000",    // red - Cougars
  "Sacramento State": "#006341",    // green - Hornets
  "Sacred Heart": "#CC0000",        // red - Pioneers
  "Saint Joseph's": "#9D2235",      // crimson - Hawks
  "Saint Louis": "#003DA5",         // blue - Billikens
  "Saint Mary's": "#D2232A",        // red - Gaels
  "Saint Peter's": "#003087",       // blue - Peacocks
  "Sam Houston": "#F68B1F",         // orange - Bearkats
  "Samford": "#003366",             // navy - Bulldogs
  "San Diego": "#002B5C",           // navy - Toreros
  "San Diego State": "#A6192E",     // scarlet - Aztecs
  "San Francisco": "#006633",       // green - Dons
  "San Jose State": "#0055A2",      // blue - Spartans
  "Santa Clara": "#862633",         // bronco red - Broncos
  "Seattle U": "#AA0000",           // red - Redhawks
  "Seton Hall": "#004488",          // blue - Pirates
  "Siena": "#006633",               // green - Saints
  "South Alabama": "#00205B",       // navy - Jaguars
  "South Carolina": "#73000A",      // garnet - Gamecocks
  "South Dakota State": "#0033A0",  // blue - Jackrabbits
  "South Florida": "#006747",       // green - Bulls
  "Southeastern Louisiana": "#006747",// green - Lions
  "Southern": "#003DA5",            // blue - Jaguars (Southern University)
  "Southern Illinois": "#720000",   // maroon - Salukis
  "Southern Indiana": "#C8102E",    // red - Screaming Eagles
  "Southern Miss": "#FFB81C",       // gold - Golden Eagles
  "St. Bonaventure": "#7B3F00",     // brown - Bonnies
  "St. John's": "#BA0C2F",          // red - Red Storm
  "St. Thomas": "#5B2C82",          // purple - Tommies
  "Stanford": "#8C1515",            // cardinal - Cardinal
  "Stephen F. Austin": "#3E2B84",   // purple - Lumberjacks
  "Stetson": "#006747",             // green - Hatters
  "Stonehill": "#5E2D91",           // purple - Skyhawks
  "Stony Brook": "#990000",         // red - Seawolves
  "TCU": "#4D1979",                 // purple - Horned Frogs
  "Tarleton State": "#4F2D7F",      // purple - Texans
  "Temple": "#9D2235",              // cherry - Owls
  "Tennessee": "#FF8200",           // orange - Volunteers
  "Tennessee State": "#003DA5",     // blue - Tigers
  "Tennessee Tech": "#4F2683",      // purple - Golden Eagles
  "Texas": "#BF5700",               // burnt orange - Longhorns
  "Texas A&M": "#500000",           // maroon - Aggies
  "Texas A&M-Corpus Christi": "#006A4E",// green - Islanders
  "Texas Southern": "#8B0D37",      // maroon - Tigers
  "Texas State": "#501214",         // maroon - Bobcats
  "Texas Tech": "#CC0000",          // scarlet - Red Raiders
  "The Citadel": "#0055B7",         // blue - Bulldogs
  "Toledo": "#003366",              // midnight blue - Rockets
  "Towson": "#FFB81C",              // gold - Tigers
  "Troy": "#8B2332",                // cardinal - Trojans
  "Tulane": "#006747",              // green - Green Wave
  "Tulsa": "#002D62",               // navy - Golden Hurricane
  "UAB": "#1E6B52",                 // green - Blazers
  "UC Davis": "#002855",            // navy - Aggies
  "UC Irvine": "#0064A4",           // blue - Anteaters
  "UC Riverside": "#003DA5",        // blue - Highlanders
  "UC San Diego": "#182B49",        // navy - Tritons
  "UC Santa Barbara": "#003660",    // blue - Gauchos
  "UCF": "#BA9B37",                 // gold - Knights
  "UCLA": "#2774AE",                // True Blue - Bruins
  "UIC": "#001E62",                 // navy - Flames
  "UMBC": "#000000",                // black - Retrievers
  "UMass Lowell": "#2D68C4",        // blue - River Hawks
  "UNC Asheville": "#003DA5",       // blue - Bulldogs
  "UNC Greensboro": "#003DA5",      // navy - Spartans
  "UNC Wilmington": "#006666",      // teal - Seahawks
  "UNLV": "#CF0A2C",                // scarlet - Rebels
  "USC": "#990000",                 // cardinal - Trojans
  "USC Upstate": "#005030",         // green - Spartans
  "UT Arlington": "#0064B1",        // blue - Mavericks
  "UT Martin": "#FF8200",           // orange - Skyhawks
  "UTRGV": "#F47920",               // orange - Vaqueros
  "UTSA": "#0C2340",                // navy - Roadrunners
  "Utah": "#CC0000",                // crimson - Utes
  "Utah Tech": "#BA0C2F",           // red - Trailblazers
  "Utah Valley": "#275D38",         // green - Wolverines
  "VCU": "#000000",                 // black - Rams (black & gold)
  "VMI": "#CC0000",                 // red - Keydets
  "Valparaiso": "#613318",          // brown - Beacons
  "Vanderbilt": "#866D4B",          // gold - Commodores
  "Villanova": "#003366",           // navy - Wildcats
  "Virginia": "#232D4B",            // navy - Cavaliers
  "Virginia Tech": "#861F41",       // maroon - Hokies
  "Wagner": "#006633",              // green - Seahawks
  "Wake Forest": "#9E7E38",         // old gold - Demon Deacons
  "Washington": "#4B2E83",          // purple - Huskies
  "Washington State": "#981E32",    // crimson - Cougars
  "West Georgia": "#C8102E",        // red - Wolves
  "West Virginia": "#002855",       // blue - Mountaineers
  "Western Carolina": "#592A8A",    // purple - Catamounts
  "Western Illinois": "#663399",    // purple - Leathernecks
  "Western Kentucky": "#C8102E",    // red - Hilltoppers
  "Western Michigan": "#6C4023",    // brown - Broncos
  "Wichita State": "#000000",       // black - Shockers
  "William & Mary": "#115740",      // green - Tribe
  "Winthrop": "#872434",            // crimson - Eagles
  "Wofford": "#917B4C",             // old gold - Terriers
  "Wright State": "#007A33",        // green - Raiders
  "Xavier": "#0C2340",              // navy - Musketeers
  "Yale": "#00356B",                // Yale Blue - Bulldogs
  "Youngstown State": "#CC0000",    // red - Penguins

  // ===== D2 & Other Division Schools (alphabetical) =====
  "Academy of Art": "#C8102E",      // red - Urban Knights
  "Adams State": "#006747",         // green - Grizzlies
  "Adelphi": "#5C4033",             // brown - Panthers
  "Albany State": "#003DA5",        // blue - Golden Rams
  "American International": "#FFCD00",// yellow - Yellow Jackets
  "Anderson (SC)": "#000000",       // black - Trojans (black & gold)
  "Angelo State": "#003DA5",        // blue - Rams
  "Arkansas Tech": "#006747",       // green - Wonder Boys
  "Arkansas-Fort Smith": "#003DA5", // blue - Lions
  "Arkansas-Monticello": "#006747", // green - Boll Weevils
  "Ashland": "#5E2D91",             // purple - Eagles
  "Assumption": "#003DA5",          // blue - Greyhounds
  "Auburn Montgomery": "#003DA5",   // navy - Warhawks
  "Augusta": "#003DA5",             // blue - Jaguars
  "Augustana (SD)": "#002F6C",      // blue - Vikings
  "Azusa Pacific": "#C8102E",       // red - Cougars
  "Barry": "#C8102E",               // red - Buccaneers
  "Barton": "#003DA5",              // blue - Bulldogs
  "Belmont Abbey": "#C8102E",       // red - Crusaders
  "Bemidji State": "#006747",       // green - Beavers
  "Benedict": "#5B2C82",            // purple - Tigers
  "Bentley": "#003DA5",             // blue - Falcons
  "Biola": "#C8102E",               // red - Eagles
  "Bloomfield": "#800000",          // maroon - Deacons
  "Bloomsburg": "#800000",          // maroon - Huskies
  "Bluefield State": "#003DA5",     // blue - Big Blues
  "Bridgeport": "#5B2C82",          // purple - Purple Knights
  "CSU Dominguez Hills": "#003DA5", // blue - Toros
  "CSU East Bay": "#CE1141",        // red - Pioneers
  "CSU Monterey Bay": "#003DA5",    // blue - Otters
  "CSU Pueblo": "#CC0000",          // red - ThunderWolves
  "CSU San Bernardino": "#003DA5",  // blue - Coyotes
  "CSU San Marcos": "#003DA5",      // blue - Cougars
  "Cal Poly Pomona": "#006747",     // green - Broncos
  "Cal State LA": "#C8102E",        // red - Golden Eagles
  "Cal U (PA)": "#C8102E",          // red - Vulcans
  "Caldwell": "#5B2C82",            // purple - Cougars
  "Cameron": "#000000",             // black - Aggies (black & gold)
  "Carson-Newman": "#F37321",       // orange - Eagles
  "Catawba": "#003DA5",             // blue - Indians
  "Cedarville": "#003DA5",          // blue - Yellow Jackets
  "Central Missouri": "#C8102E",    // red - Mules
  "Central Oklahoma": "#003DA5",    // blue - Bronchos
  "Central Washington": "#C8102E",  // crimson - Wildcats
  "Chaminade": "#003DA5",           // blue - Silverswords
  "Charleston (WV)": "#800000",     // maroon - Golden Eagles
  "Chestnut Hill": "#800000",       // maroon - Griffins
  "Chico State": "#C8102E",         // cardinal red - Wildcats
  "Chowan": "#003DA5",              // blue - Hawks
  "Christian Brothers": "#C8102E",  // red - Buccaneers
  "Claflin": "#F37321",             // orange - Panthers
  "Clarion": "#003DA5",             // blue - Golden Eagles
  "Clark Atlanta": "#C8102E",       // red - Panthers
  "Coker": "#003DA5",               // blue - Cobras
  "Colorado Christian": "#003DA5",  // blue - Cougars
  "Colorado Mesa": "#800000",       // maroon - Mavericks
  "Colorado Mines": "#003DA5",      // blue - Orediggers
  "Columbus State": "#C8102E",      // red - Cougars
  "Concord": "#800000",             // maroon - Mountain Lions
  "Concordia Irvine": "#006747",    // green - Eagles
  "Concordia St. Paul": "#003DA5",  // blue - Golden Bears
  "D'Youville": "#C8102E",          // red - Saints
  "Davenport": "#C8102E",           // red - Panthers
  "Davis & Elkins": "#C8102E",      // red - Senators
  "Delta State": "#006633",         // green - Statesmen
  "Dominican (NY)": "#003DA5",      // blue - Chargers
  "Drury": "#C8102E",               // scarlet - Panthers
  "East Central": "#000000",        // black - Tigers (black & gold)
  "East Stroudsburg": "#C8102E",    // red - Warriors
  "Eastern New Mexico": "#006747",  // green - Greyhounds
  "Eckerd": "#003DA5",              // blue - Tritons
  "Edward Waters": "#5B2C82",       // purple - Tigers
  "Embry-Riddle": "#003DA5",        // blue - Eagles
  "Emmanuel (GA)": "#003DA5",       // blue - Lions
  "Emory & Henry": "#003DA5",       // navy - Wasps
  "Emporia State": "#000000",       // black - Hornets (black & gold)
  "Erskine": "#FFB81C",             // gold - Fleet
  "Fairmont State": "#800000",      // maroon - Falcons
  "Felician": "#FFB81C",            // gold - Golden Falcons
  "Findlay": "#F37321",             // orange - Oilers
  "Flagler": "#C8102E",             // crimson - Saints
  "Florida Southern": "#CC0033",    // scarlet - Moccasins
  "Florida Tech": "#990000",        // crimson - Panthers
  "Fort Hays State": "#000000",     // black - Tigers (black & gold)
  "Francis Marion": "#C8102E",      // red - Patriots
  "Franklin Pierce": "#C8102E",     // crimson - Ravens
  "Fresno Pacific": "#003DA5",      // blue - Sunbirds
  "Frostburg State": "#C8102E",     // red - Bobcats
  "Gannon": "#800000",              // maroon - Golden Knights
  "Georgia College": "#006747",     // green - Bobcats
  "Georgia Southwestern": "#003DA5",// blue - Hurricanes
  "Georgian Court": "#003DA5",      // blue - Lions
  "Glenville State": "#003DA5",     // blue - Pioneers
  "Goldey-Beacom": "#003DA5",       // blue - Lightning
  "Grand Valley State": "#0065A4",  // blue - Lakers
  "Harding": "#000000",             // black - Bisons (black & gold)
  "Hawaii Hilo": "#C8102E",         // red - Vulcans
  "Hawaii Pacific": "#003DA5",      // blue - Sharks
  "Henderson State": "#C8102E",     // red - Reddies
  "Hillsdale": "#003DA5",           // blue - Chargers
  "Holy Family": "#003DA5",         // blue - Tigers
  "IUP": "#7E0C33",                 // crimson - Crimson Hawks
  "Indianapolis": "#C8102E",        // crimson - Greyhounds
  "Jamestown": "#F37321",           // orange - Jimmies
  "Kentucky State": "#006747",      // green - Thorobreds
  "Kentucky Wesleyan": "#5B2C82",   // purple - Panthers
  "King (TN)": "#C8102E",           // red - Tornado
  "Kutztown": "#6D0022",            // maroon - Golden Bears
  "Lake Erie": "#006747",           // green - Storm
  "Lander": "#003DA5",              // blue - Bearcats
  "Lane": "#800000",                // maroon - Dragons
  "LeMoyne-Owen": "#800000",        // maroon - Magicians
  "Lee": "#C8102E",                 // crimson - Flames
  "Lenoir-Rhyne": "#C8102E",        // red - Bears
  "Lewis": "#C8102E",               // scarlet - Flyers
  "Limestone": "#003DA5",           // blue - Saints
  "Lincoln (MO)": "#003DA5",        // blue - Blue Tigers
  "Lincoln (PA)": "#F37321",        // orange - Lions
  "Lincoln Memorial": "#003DA5",    // blue - Railsplitters
  "Lock Haven": "#8B0D37",          // crimson - Bald Eagles
  "Lubbock Christian": "#003DA5",    // blue - Chaparrals
  "Lynn": "#003DA5",                // blue - Fighting Knights
  "MSU Billings": "#FFB81C",        // yellow - Yellowjackets
  "Malone": "#C8102E",              // red - Pioneers
  "Mansfield": "#C8102E",           // red - Mountaineers
  "Mars Hill": "#003DA5",           // blue - Lions
  "Mary": "#003DA5",                // blue - Marauders
  "Maryville": "#C8102E",           // red - Saints
  "McKendree": "#5B2C82",           // purple - Bearcats
  "Menlo": "#003DA5",               // blue - Oaks
  "Mercy": "#003DA5",               // blue - Mavericks
  "Metro State Denver": "#003DA5",  // blue - Roadrunners
  "Miles": "#5B2C82",               // purple - Golden Bears
  "Millersville": "#000000",        // black - Marauders (black & gold)
  "Minnesota Crookston": "#800000", // maroon - Golden Eagles
  "Minnesota Duluth": "#800000",    // maroon - Bulldogs
  "Minnesota State": "#5B2C82",     // purple - Mavericks
  "Minot State": "#006747",         // green - Beavers
  "Mississippi College": "#003DA5", // blue - Choctaws
  "Missouri S&T": "#006747",        // green - Miners
  "Missouri Southern": "#006747",   // green - Lions
  "Missouri Western": "#000000",    // black - Griffons
  "Molloy": "#003DA5",              // blue - Lions
  "Montevallo": "#5B2C82",          // purple - Falcons
  "Morehouse": "#800000",           // maroon - Maroon Tigers
  "Mount Olive": "#006747",         // green - Trojans
  "New Mexico Highlands": "#5B2C82",// purple - Cowboys
  "Newberry": "#C8102E",            // scarlet - Wolves
  "Newman": "#003DA5",              // blue - Jets
  "North Georgia": "#003DA5",       // blue - Nighthawks
  "North Greenville": "#C8102E",    // red - Crusaders
  "Northeastern State": "#006747",  // green - RiverHawks
  "Northern State": "#800000",      // maroon - Wolves
  "Northwest Missouri State": "#006747",// green - Bearcats
  "Northwest Nazarene": "#F37321",  // orange - Nighthawks
  "Northwestern Oklahoma State": "#000000",// black - Rangers
  "Northwood": "#003DA5",           // blue - Timberwolves
  "Nova Southeastern": "#003DA5",   // blue - Sharks
  "Ohio Dominican": "#000000",      // black - Panthers
  "Oklahoma Baptist": "#006747",    // green - Bison
  "Oklahoma Christian": "#800000",  // maroon - Eagles
  "Ouachita Baptist": "#5B2C82",    // purple - Tigers
  "Pace": "#003DA5",                // blue - Setters
  "Palm Beach Atlantic": "#003DA5", // blue - Sailfish
  "Pitt-Johnstown": "#003594",      // blue - Mountain Cats
  "Pittsburg State": "#C8102E",     // crimson - Gorillas
  "Point Loma": "#006633",          // green - Sea Lions
  "Point Park": "#000000",          // black - Pioneers
  "Post": "#003DA5",                // blue - Eagles
  "Purdue Northwest": "#000000",    // black - Pride
  "Quincy": "#800000",              // maroon - Hawks
  "Regis": "#003DA5",               // blue - Rangers
  "Rockhurst": "#003DA5",           // blue - Hawks
  "Rogers State": "#003DA5",        // blue - Hillcats
  "Rollins": "#002C6A",             // navy - Tars
  "Roosevelt": "#006747",           // green - Lakers
  "SE Oklahoma State": "#003DA5",   // blue - Savage Storm
  "SNHU": "#003DA5",                // blue - Penmen
  "SW Minnesota State": "#800000",  // maroon - Mustangs
  "SW Oklahoma State": "#003DA5",   // blue - Bulldogs
  "Saginaw Valley State": "#C8102E",// red - Cardinals
  "Saint Anselm": "#003DA5",        // blue - Hawks
  "Saint Leo": "#006747",           // green - Lions
  "Saint Martin's": "#C8102E",      // red - Saints
  "Saint Michael's": "#5B2C82",     // purple - Purple Knights
  "Salem": "#006747",               // green - Tigers
  "San Francisco State": "#51284F", // purple - Gators
  "Savannah State": "#003DA5",      // blue - Tigers
  "Seton Hill": "#C8102E",          // crimson - Griffins
  "Shepherd": "#003DA5",            // blue - Rams
  "Shippensburg": "#00205B",        // navy - Raiders
  "Shorter": "#003DA5",             // blue - Hawks
  "Sioux Falls": "#5B2C82",         // purple - Cougars
  "Slippery Rock": "#006633",       // green - The Rock
  "Sonoma State": "#003DA5",        // blue - Seawolves
  "Southern Arkansas": "#003DA5",   // blue - Muleriders
  "Southern Connecticut": "#003DA5",// blue - Owls
  "Southern Nazarene": "#C8102E",   // crimson - Crimson Storm
  "Southern Wesleyan": "#003DA5",   // blue - Warriors
  "Southwest Baptist": "#5B2C82",   // purple - Bearcats
  "Spring Hill": "#000000",         // black - Badgers
  "St. Cloud State": "#C8102E",     // red - Huskies
  "St. Edward's": "#003DA5",        // blue - Hilltoppers
  "St. Mary's (TX)": "#003DA5",     // blue - Rattlers
  "St. Thomas Aquinas": "#003DA5",  // blue - Spartans
  "Stanislaus State": "#C8102E",    // red - Warriors
  "Tampa": "#CC0000",               // red - Spartans
  "Texas A&M International": "#800000",// maroon - Dustdevils
  "Texas A&M-Kingsville": "#003DA5",// blue - Javelinas
  "Thomas Jefferson": "#003DA5",    // blue - Rams
  "Thomas More": "#003DA5",         // blue - Saints
  "Tiffin": "#006747",              // green - Dragons
  "Trevecca Nazarene": "#003DA5",   // blue - Trojans
  "Truman State": "#5B2C82",        // purple - Bulldogs
  "Tusculum": "#F37321",            // orange - Pioneers
  "Tuskegee": "#800000",            // maroon - Golden Tigers
  "UAH": "#003DA5",                 // blue - Chargers
  "UCCS": "#000000",                // black - Mountain Lions
  "UIS": "#003DA5",                 // blue - Prairie Stars
  "UMSL": "#C8102E",                // red - Tritons
  "UNC Pembroke": "#000000",        // black - Braves
  "USC Aiken": "#C8102E",           // cardinal - Pacers
  "USC Beaufort": "#006747",        // green - Sand Sharks
  "UT Permian Basin": "#F37321",    // orange - Falcons
  "UT Tyler": "#003DA5",            // blue - Patriots
  "UVA Wise": "#232D4B",            // navy - Cavaliers
  "Union (TN)": "#C8102E",          // cardinal - Bulldogs
  "Upper Iowa": "#003DA5",          // blue - Peacocks
  "Valdosta State": "#CC0000",      // red - Blazers
  "Virginia State": "#F37321",      // orange - Trojans
  "WV State": "#FFB81C",            // yellow - Yellow Jackets
  "WV Wesleyan": "#F37321",         // orange - Bobcats
  "Walsh": "#800000",               // maroon - Cavaliers
  "Washburn": "#003DA5",            // blue - Ichabods
  "Wayne State (MI)": "#006747",    // green - Warriors
  "Wayne State (NE)": "#000000",    // black - Wildcats
  "West Alabama": "#C8102E",        // scarlet - Tigers
  "West Chester": "#660066",        // purple - Golden Rams
  "West Florida": "#003DA5",        // navy - Argonauts
  "West Liberty": "#000000",        // black - Hilltoppers
  "West Texas A&M": "#800000",      // maroon - Buffaloes
  "Western Oregon": "#C8102E",      // red - Wolves
  "Westmont": "#003DA5",            // blue - Warriors
  "Wheeling": "#800000",            // maroon - Cardinals
  "William Jessup": "#003DA5",      // blue - Warriors
  "William Jewell": "#C8102E",      // red - Cardinals
  "Wilmington (DE)": "#006747",     // green - Wildcats
  "Wingate": "#003DA5",             // blue - Bulldogs
  "Winona State": "#5B2C82",        // purple - Warriors
  "Wisconsin-Parkside": "#006747",  // green - Rangers
  "Young Harris": "#C8102E",        // red - Mountain Lions
};

const DEFAULT_COLOR = "#1e3a5f"; // dark navy fallback

const filePath = path.join(__dirname, '..', 'src', 'data', 'schools.json');
const raw = fs.readFileSync(filePath, 'utf-8');
const schools = JSON.parse(raw);

let mapped = 0;
let defaulted = 0;
const unmappedNames = [];

schools.forEach(school => {
  if (COLOR_MAP[school.name]) {
    school.primary_color = COLOR_MAP[school.name];
    mapped++;
  } else {
    school.primary_color = DEFAULT_COLOR;
    defaulted++;
    unmappedNames.push(school.name);
  }
});

fs.writeFileSync(filePath, JSON.stringify(schools, null, 2) + '\n');

console.log(`Updated ${schools.length} schools total.`);
console.log(`  Mapped: ${mapped}`);
console.log(`  Using default color: ${defaulted}`);

if (unmappedNames.length > 0) {
  console.log(`\nSchools using default color "${DEFAULT_COLOR}":`);
  unmappedNames.forEach(name => console.log(`  - ${name}`));
}
