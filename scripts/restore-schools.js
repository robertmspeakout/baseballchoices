const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'src', 'data', 'schools.json');
const schools = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Schools to restore (from git history)
const restore = [
  {
    "id": 48, "name": "Utah", "mascot": "Utes", "city": "Salt Lake City", "state": "UT",
    "zip": "84112", "latitude": 40.765, "longitude": -111.842, "division": "D1",
    "public_private": "Public", "conference": "Big 12", "current_ranking": null,
    "tuition": 9222, "instagram": "@utahbaseball", "x_account": "@Utah_Baseball",
    "head_coach_name": "Gary Henderson", "head_coach_email": "baseball@utah.edu",
    "assistant_coach_name": "Adam Pavkovich", "assistant_coach_email": "baseball@utah.edu",
    "website": "https://utahutes.com/sports/baseball", "created_at": "2026-02-10 16:55:29",
    "last_season_record": "22-34", "logo_url": "https://a.espncdn.com/i/teamlogos/ncaa/500/254.png"
  },
  {
    "id": 66, "name": "Washington", "mascot": "Huskies", "city": "Seattle", "state": "WA",
    "zip": "98195", "latitude": 47.655, "longitude": -122.304, "division": "D1",
    "public_private": "Public", "conference": "Big Ten", "current_ranking": null,
    "tuition": 12076, "instagram": "@uw_baseball", "x_account": "@UW_Baseball",
    "head_coach_name": "Jason Kelly", "head_coach_email": "baseball@uw.edu",
    "assistant_coach_name": "Elliott Cribby", "assistant_coach_email": "baseball@uw.edu",
    "website": "https://gohuskies.com/sports/baseball", "created_at": "2026-02-10 16:55:29",
    "last_season_record": "29-28", "logo_url": "https://a.espncdn.com/i/teamlogos/ncaa/500/264.png"
  }
];

for (const s of restore) {
  if (!schools.find(x => x.id === s.id)) {
    schools.push(s);
    console.log(`Restored: ${s.name}`);
  } else {
    console.log(`Already exists: ${s.name}`);
  }
}

// Sort by name for consistency
schools.sort((a, b) => a.name.localeCompare(b.name));

fs.writeFileSync(dataPath, JSON.stringify(schools, null, 2) + '\n');
console.log(`Total schools: ${schools.length}`);
