const fs = require('fs');
const path = require('path');

const schoolsPath = path.join(__dirname, '..', 'src', 'data', 'schools.json');
const schools = JSON.parse(fs.readFileSync(schoolsPath, 'utf8'));

// ── REMOVE: Schools that do NOT have active D1 baseball programs ──
const toRemove = new Set([
  "Southern Utah",       // Dropped baseball after 2011-12
  "UTEP",               // Discontinued baseball in 1985
  "SMU",                // Dropped baseball after 1980
  "Cleveland State",    // Eliminated baseball May 2011
  "Drexel",             // Does not sponsor baseball
  "Vermont",            // Dropped baseball after 2009
  "Kansas City",        // UMKC - no baseball program
  "Chattanooga",        // No varsity baseball, club only
  "Providence",         // Dropped baseball after 1999
  "Purdue Fort Wayne",  // Dropped baseball after 2025
  "Furman",             // Terminated baseball May 2020
]);

const filtered = schools.filter(s => !toRemove.has(s.name));
const removed = schools.length - filtered.length;

// ── ADD: Missing D1 baseball programs ──
let nextId = Math.max(...filtered.map(s => s.id)) + 1;

const newSchools = [
  // Big South Conference
  { name: "Charleston Southern", mascot: "Buccaneers", city: "Charleston", state: "SC", zip: "29423", conference: "Big South", public_private: "Private", tuition: 27740, latitude: 32.897, longitude: -80.064 },
  { name: "Gardner-Webb", mascot: "Runnin' Bulldogs", city: "Boiling Springs", state: "NC", zip: "28017", conference: "Big South", public_private: "Private", tuition: 36680, latitude: 35.247, longitude: -81.667 },
  { name: "High Point", mascot: "Panthers", city: "High Point", state: "NC", zip: "27268", conference: "Big South", public_private: "Private", tuition: 39500, latitude: 35.972, longitude: -80.013 },
  { name: "Longwood", mascot: "Lancers", city: "Farmville", state: "VA", zip: "23909", conference: "Big South", public_private: "Public", tuition: 14154, latitude: 37.297, longitude: -78.395 },
  { name: "Presbyterian", mascot: "Blue Hose", city: "Clinton", state: "SC", zip: "29325", conference: "Big South", public_private: "Private", tuition: 38200, latitude: 34.472, longitude: -81.876 },
  { name: "Radford", mascot: "Highlanders", city: "Radford", state: "VA", zip: "24142", conference: "Big South", public_private: "Public", tuition: 12132, latitude: 37.134, longitude: -80.557 },
  { name: "UNC Asheville", mascot: "Bulldogs", city: "Asheville", state: "NC", zip: "28804", conference: "Big South", public_private: "Public", tuition: 8134, latitude: 35.614, longitude: -82.568 },
  { name: "USC Upstate", mascot: "Spartans", city: "Spartanburg", state: "SC", zip: "29303", conference: "Big South", public_private: "Public", tuition: 12108, latitude: 34.932, longitude: -81.984 },
  { name: "Winthrop", mascot: "Eagles", city: "Rock Hill", state: "SC", zip: "29733", conference: "Big South", public_private: "Public", tuition: 16190, latitude: 34.943, longitude: -81.032 },

  // Mid-American Conference (MAC)
  { name: "Akron", mascot: "Zips", city: "Akron", state: "OH", zip: "44325", conference: "MAC", public_private: "Public", tuition: 12400, latitude: 41.076, longitude: -81.512 },
  { name: "Ball State", mascot: "Cardinals", city: "Muncie", state: "IN", zip: "47306", conference: "MAC", public_private: "Public", tuition: 10800, latitude: 40.206, longitude: -85.409 },
  { name: "Bowling Green", mascot: "Falcons", city: "Bowling Green", state: "OH", zip: "43403", conference: "MAC", public_private: "Public", tuition: 12438, latitude: 41.381, longitude: -83.649 },
  { name: "Central Michigan", mascot: "Chippewas", city: "Mt. Pleasant", state: "MI", zip: "48859", conference: "MAC", public_private: "Public", tuition: 13670, latitude: 43.591, longitude: -84.774 },
  { name: "Eastern Michigan", mascot: "Eagles", city: "Ypsilanti", state: "MI", zip: "48197", conference: "MAC", public_private: "Public", tuition: 13734, latitude: 42.249, longitude: -83.624 },
  { name: "Kent State", mascot: "Golden Flashes", city: "Kent", state: "OH", zip: "44242", conference: "MAC", public_private: "Public", tuition: 12346, latitude: 41.148, longitude: -81.340 },
  { name: "Miami (OH)", mascot: "RedHawks", city: "Oxford", state: "OH", zip: "45056", conference: "MAC", public_private: "Public", tuition: 17571, latitude: 39.508, longitude: -84.735 },
  { name: "Northern Illinois", mascot: "Huskies", city: "DeKalb", state: "IL", zip: "60115", conference: "MAC", public_private: "Public", tuition: 15290, latitude: 41.935, longitude: -88.773 },
  { name: "Ohio", mascot: "Bobcats", city: "Athens", state: "OH", zip: "45701", conference: "MAC", public_private: "Public", tuition: 13352, latitude: 39.324, longitude: -82.101 },
  { name: "Toledo", mascot: "Rockets", city: "Toledo", state: "OH", zip: "43606", conference: "MAC", public_private: "Public", tuition: 12232, latitude: 41.657, longitude: -83.614 },
  { name: "Western Michigan", mascot: "Broncos", city: "Kalamazoo", state: "MI", zip: "49008", conference: "MAC", public_private: "Public", tuition: 14474, latitude: 42.282, longitude: -85.613 },

  // ACC
  { name: "Pittsburgh", mascot: "Panthers", city: "Pittsburgh", state: "PA", zip: "15260", conference: "ACC", public_private: "Public", tuition: 21060, latitude: 40.444, longitude: -79.953 },

  // Ohio Valley
  { name: "Eastern Illinois", mascot: "Panthers", city: "Charleston", state: "IL", zip: "61920", conference: "OVC", public_private: "Public", tuition: 14128, latitude: 39.481, longitude: -88.179 },

  // CAA
  { name: "Campbell", mascot: "Fighting Camels", city: "Buies Creek", state: "NC", zip: "27506", conference: "CAA", public_private: "Private", tuition: 36950, latitude: 35.411, longitude: -78.736 },

  // Summit League
  { name: "St. Thomas", mascot: "Tommies", city: "St. Paul", state: "MN", zip: "55105", conference: "Summit", public_private: "Private", tuition: 50282, latitude: 44.942, longitude: -93.093 },
  { name: "Northern Colorado", mascot: "Bears", city: "Greeley", state: "CO", zip: "80639", conference: "Summit", public_private: "Public", tuition: 11370, latitude: 40.406, longitude: -104.698 },

  // Southland
  { name: "New Orleans", mascot: "Privateers", city: "New Orleans", state: "LA", zip: "70148", conference: "Southland", public_private: "Public", tuition: 9356, latitude: 30.027, longitude: -90.067 },
  { name: "UTRGV", mascot: "Vaqueros", city: "Edinburg", state: "TX", zip: "78539", conference: "WAC", public_private: "Public", tuition: 9490, latitude: 26.307, longitude: -98.171 },

  // MAAC
  { name: "Manhattan", mascot: "Jaspers", city: "Bronx", state: "NY", zip: "10471", conference: "MAAC", public_private: "Private", tuition: 46870, latitude: 40.890, longitude: -73.902 },
  { name: "Mount St. Mary's", mascot: "Mountaineers", city: "Emmitsburg", state: "MD", zip: "21727", conference: "NEC", public_private: "Private", tuition: 43500, latitude: 39.698, longitude: -77.337 },

  // Big Sky / WAC
  { name: "Sacramento State", mascot: "Hornets", city: "Sacramento", state: "CA", zip: "95819", conference: "Big Sky", public_private: "Public", tuition: 7608, latitude: 38.562, longitude: -121.423 },
];

for (const ns of newSchools) {
  filtered.push({
    id: nextId++,
    name: ns.name,
    mascot: ns.mascot,
    city: ns.city,
    state: ns.state,
    zip: ns.zip,
    latitude: ns.latitude,
    longitude: ns.longitude,
    division: "D1",
    public_private: ns.public_private,
    conference: ns.conference,
    current_ranking: null,
    tuition: ns.tuition,
    instagram: null,
    x_account: null,
    head_coach_name: null,
    head_coach_email: null,
    assistant_coach_name: null,
    assistant_coach_email: null,
    website: null,
    created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
    last_season_record: null,
    logo_url: null,
    mlb_draft_picks: 0,
    stadium_latitude: ns.latitude,
    stadium_longitude: ns.longitude,
    stadium_name: null,
    stadium_image_url: null,
    enrollment: null,
    acceptance_rate: null,
    graduation_rate: null,
    cws_appearances: 0,
    ncaa_regionals: 0,
    roster_size: 35,
    scholarship_limit: 11.7,
    recruiting_questionnaire_url: null,
  });
}

// Sort by name
filtered.sort((a, b) => a.name.localeCompare(b.name));

fs.writeFileSync(schoolsPath, JSON.stringify(filtered, null, 2) + '\n');

console.log(`Removed ${removed} schools without D1 baseball`);
console.log(`Added ${newSchools.length} missing D1 baseball programs`);
console.log(`Total: ${filtered.length} schools`);
console.log(`\nRemoved: ${[...toRemove].join(', ')}`);
console.log(`\nAdded: ${newSchools.map(s => s.name).join(', ')}`);
