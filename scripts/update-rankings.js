/**
 * Fetch the latest D1 baseball rankings and update schools.json.
 *
 * Data source: NCAA website (D1Baseball.com Top 25 poll hosted on ncaa.com).
 * Fallback:    ESPN college baseball scoreboard API.
 *
 * Usage:
 *   node scripts/update-rankings.js          (CLI)
 *   Called via /api/admin/rankings route      (Admin panel)
 */

const fs = require("fs");
const path = require("path");

const SCHOOLS_PATH = path.join(__dirname, "..", "src", "data", "schools.json");

// ESPN team-ID → our school name (reverse of espn.ts map, for the most common D1 teams)
// We match by name rather than ID when possible, but this helps resolve edge cases.
const ESPN_ID_TO_NAME = {
  148: "Alabama", 59: "Arizona State", 60: "Arizona", 58: "Arkansas",
  55: "Auburn", 121: "Baylor", 127: "BYU", 65: "California",
  117: "Clemson", 146: "Coastal Carolina", 69: "Connecticut", 200: "Creighton",
  263: "Dallas Baptist", 93: "Duke", 94: "East Carolina", 304: "ETSU",
  75: "Florida", 163: "Florida Atlantic", 291: "Florida Gulf Coast",
  164: "Florida International", 72: "Florida State", 137: "Fresno State",
  78: "Georgia", 138: "Georgia Southern", 358: "Georgia State", 77: "Georgia Tech",
  287: "Gonzaga", 124: "Houston", 153: "Illinois", 294: "Indiana",
  73: "Jacksonville State", 168: "Kansas", 264: "Kansas State",
  307: "Kennesaw State", 82: "Kentucky", 379: "LIU", 174: "LMU",
  141: "Long Beach State", 83: "Louisville", 85: "LSU", 87: "Maryland",
  386: "Massachusetts", 119: "Memphis", 176: "Miami (FL)", 89: "Michigan",
  90: "Minnesota", 150: "Mississippi State", 91: "Missouri", 197: "Missouri State",
  179: "Navy", 99: "Nebraska", 104: "New Mexico", 103: "New Mexico State",
  96: "North Carolina", 95: "NC State", 411: "Northwestern",
  81: "Notre Dame", 109: "Ohio", 108: "Ohio State", 112: "Oklahoma",
  110: "Oklahoma State", 92: "Ole Miss", 273: "Oregon", 113: "Oregon State",
  415: "Penn", 414: "Penn State", 187: "Pepperdine", 115: "Pittsburgh",
  189: "Purdue", 122: "Rice", 102: "Rutgers", 314: "Sacramento State",
  62: "San Diego State", 267: "San Francisco", 143: "San Diego",
  268: "Seton Hall", 433: "SMU", 57: "South Alabama", 193: "South Carolina",
  76: "South Florida", 194: "Southern", 432: "Southern Illinois",
  192: "Southern Miss", 64: "Stanford", 196: "Stony Brook", 198: "TCU",
  199: "Tennessee", 126: "Texas", 123: "Texas A&M", 201: "Texas Tech",
  147: "Texas State", 203: "Tulane", 66: "UCLA", 160: "UCF",
  182: "UNLV", 68: "USC", 128: "Utah", 120: "Vanderbilt",
  131: "Virginia", 132: "Virginia Tech", 97: "Wake Forest",
  133: "Washington", 134: "Washington State", 136: "West Virginia",
  206: "Wichita State",
  // Additional ESPN IDs
  61: "Cal Poly", 165: "Cal State Fullerton", 185: "Cal State Northridge",
  327: "Cal State Bakersfield", 142: "UC Irvine", 448: "UC Davis",
  67: "UC Riverside", 290: "UC Santa Barbara", 1147: "UC San Diego",
  172: "Liberty", 303: "Elon", 140: "Old Dominion", 111: "Oral Roberts",
  271: "Appalachian State", 63: "San Jose State", 295: "Mercer",
  88: "Michigan State", 186: "Northwestern State", 144: "Louisiana",
  173: "Louisiana Tech", 272: "Louisiana-Monroe", 309: "Southeastern Louisiana",
  151: "Army", 155: "Air Force", 204: "VCU",
};

/**
 * Attempt to fetch rankings from the NCAA website by scraping the rankings page.
 * Returns array of { rank, name } or null on failure.
 */
async function fetchFromNCAA() {
  try {
    const res = await fetch(
      "https://www.ncaa.com/rankings/baseball/d1/d1baseballcom-top-25",
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; ExtraBase/1.0; +https://extrabase.app)",
        },
      }
    );
    if (!res.ok) return null;
    const html = await res.text();

    // Parse the rankings table from HTML
    // NCAA.com format: <td class="rankings-page__rank">1</td> ... <span>School Name</span>
    const rankings = [];
    // Match rank + school name patterns in the HTML table
    const rankRegex =
      /<td[^>]*class="[^"]*rank[^"]*"[^>]*>\s*(\d+)\s*<\/td>[\s\S]*?<span[^>]*>\s*([^<]+?)\s*<\/span>/gi;
    let match;
    while ((match = rankRegex.exec(html)) !== null) {
      rankings.push({ rank: parseInt(match[1]), name: match[2].trim() });
    }

    // Fallback: try a simpler table row pattern
    if (rankings.length === 0) {
      const rowRegex =
        /<tr[^>]*>[\s\S]*?<td[^>]*>\s*(\d+)\s*<\/td>[\s\S]*?<a[^>]*>\s*([^<]+?)\s*<\/a>[\s\S]*?<\/tr>/gi;
      while ((match = rowRegex.exec(html)) !== null) {
        const rank = parseInt(match[1]);
        if (rank >= 1 && rank <= 25) {
          rankings.push({ rank, name: match[2].trim() });
        }
      }
    }

    if (rankings.length >= 20) return rankings;
    return null;
  } catch {
    return null;
  }
}

/**
 * Attempt to fetch rankings from ESPN's college baseball API.
 * Returns array of { rank, name } or null on failure.
 */
async function fetchFromESPN() {
  try {
    const res = await fetch(
      "https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/rankings",
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; ExtraBase/1.0; +https://extrabase.app)",
        },
      }
    );
    if (!res.ok) return null;
    const data = await res.json();

    const rankings = [];
    // ESPN rankings response has a rankings array with multiple polls
    const polls = data.rankings || [];
    // Use the first poll (usually D1Baseball or Coaches)
    const poll = polls[0];
    if (!poll?.ranks) return null;

    for (const entry of poll.ranks) {
      const rank = entry.current;
      const team = entry.team;
      if (!rank || !team) continue;

      // Try to resolve team name from our ID map or use displayName
      const name =
        ESPN_ID_TO_NAME[team.id] ||
        team.location ||
        team.displayName?.replace(/ (Baseball|Volunteers|Crimson Tide|Tigers|Bulldogs|Gators|Seminoles|Wildcats|Bruins|Trojans|Longhorns|Aggies|Razorbacks|Sooners|Cowboys|Bears|Horned Frogs|Cardinals|Demon Deacons|Blue Devils|Cavaliers|Hokies|Tar Heels|Wolfpack|Hurricanes|Fighting Irish|Yellow Jackets|Gamecocks|Rebels|Commodores|Mountaineers|Red Raiders|Mustangs|Golden Eagles|Shockers|Panthers|Pilots|Dons|Aztecs)$/i, "") ||
        team.displayName;
      rankings.push({ rank, name });
    }

    if (rankings.length >= 20) return rankings;
    return null;
  } catch {
    return null;
  }
}

/**
 * Match a ranking name to a school in our data.
 * Handles common name variations.
 */
function findSchool(schools, rankName) {
  const lower = rankName.toLowerCase().trim();

  // Direct name match
  let found = schools.find(
    (s) => s.name.toLowerCase() === lower && s.division === "D1"
  );
  if (found) return found;

  // Common aliases
  const aliases = {
    "texas a&m": "Texas A&M",
    "ole miss": "Ole Miss",
    "miami": "Miami (FL)",
    "miami (fl)": "Miami (FL)",
    "miami hurricanes": "Miami (FL)",
    "uconn": "Connecticut",
    "lsu": "LSU",
    "usc": "USC",
    "ucla": "UCLA",
    "ucf": "UCF",
    "unlv": "UNLV",
    "tcu": "TCU",
    "smu": "SMU",
    "byu": "BYU",
    "vcu": "VCU",
    "unc": "North Carolina",
    "nc state": "NC State",
    "pitt": "Pittsburgh",
    "u of l": "Louisville",
    "wvu": "West Virginia",
    "osu": "Ohio State",
    "fsu": "Florida State",
    "fau": "Florida Atlantic",
    "fiu": "Florida International",
    "etsu": "ETSU",
    "utsa": "UTSA",
  };

  const aliased = aliases[lower];
  if (aliased) {
    found = schools.find(
      (s) => s.name === aliased && s.division === "D1"
    );
    if (found) return found;
  }

  // Partial match (school name starts with ranking name or vice versa)
  found = schools.find(
    (s) =>
      s.division === "D1" &&
      (s.name.toLowerCase().startsWith(lower) ||
        lower.startsWith(s.name.toLowerCase()))
  );
  if (found) return found;

  return null;
}

async function updateRankings() {
  console.log("Fetching latest D1 baseball rankings...");

  // Try NCAA first, then ESPN as fallback
  let rankings = await fetchFromNCAA();
  let source = "NCAA/D1Baseball";

  if (!rankings) {
    console.log("NCAA source unavailable, trying ESPN...");
    rankings = await fetchFromESPN();
    source = "ESPN";
  }

  if (!rankings || rankings.length === 0) {
    const msg = "Could not fetch rankings from any source.";
    console.error(msg);
    return { success: false, error: msg };
  }

  console.log(`Got ${rankings.length} rankings from ${source}`);

  // Load schools data
  const schools = JSON.parse(fs.readFileSync(SCHOOLS_PATH, "utf8"));

  // Clear all existing D1 rankings
  let cleared = 0;
  for (const school of schools) {
    if (school.division === "D1" && school.current_ranking !== null) {
      school.current_ranking = null;
      cleared++;
    }
  }

  // Apply new rankings
  const matched = [];
  const unmatched = [];

  for (const { rank, name } of rankings) {
    const school = findSchool(schools, name);
    if (school) {
      school.current_ranking = rank;
      matched.push({ rank, name, matched: school.name });
    } else {
      unmatched.push({ rank, name });
    }
  }

  // Save
  fs.writeFileSync(SCHOOLS_PATH, JSON.stringify(schools, null, 2));

  const result = {
    success: true,
    source,
    total: rankings.length,
    matched: matched.length,
    unmatched,
    cleared,
    timestamp: new Date().toISOString(),
  };

  console.log(`Updated ${matched.length}/${rankings.length} rankings (cleared ${cleared} previous).`);
  if (unmatched.length > 0) {
    console.log("Unmatched schools:", unmatched.map((u) => `#${u.rank} ${u.name}`).join(", "));
  }

  return result;
}

// CLI execution
if (require.main === module) {
  updateRankings()
    .then((result) => {
      console.log("\nResult:", JSON.stringify(result, null, 2));
      process.exit(result.success ? 0 : 1);
    })
    .catch((err) => {
      console.error("Fatal error:", err);
      process.exit(1);
    });
}

module.exports = { updateRankings };
