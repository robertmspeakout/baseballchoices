#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const SCHOOLS_PATH = path.join(__dirname, "..", "src", "data", "schools.json");
const schools = JSON.parse(fs.readFileSync(SCHOOLS_PATH, "utf8"));

let nextId = Math.max(...schools.map(s => s.id)) + 1;
const existingD3 = new Set(schools.filter(s => s.division === "D3").map(s => s.name));

const LAST_D3 = [
  ["Oberlin", "Yeomen", "Oberlin", "OH", "NCAC", 41.2940, -82.2157, "44074", "Private", 2900, 61420, 34, 81, "Adrian Abrahamowicz", "aabraha2@oberlin.edu", "https://www.oberlinyeomen.com/sports/baseball", 3200, true, "#C8102E"],
  ["Covenant", "Scots", "Lookout Mountain", "GA", "USA South", 34.9822, -85.3621, "30750", "Private", 1200, 36720, 48, 62, null, null, "https://www.covenantscots.com/sports/baseball", null, false, "#003478"],
  ["Polytechnic", "Engineers", "Brooklyn", "NY", "Skyline", 40.6935, -73.9866, "11201", "Private", 4500, 55984, 57, 70, null, null, null, null, false, "#4B0082"],
  ["Medgar Evers", "Cougars", "Brooklyn", "NY", "CUNYAC", 40.6494, -73.9589, "11225", "Public", 5500, 7340, 100, 15, null, null, "https://www.mecathletics.com/sports/baseball", null, false, "#003478"],
  ["Marymount (VA)", "Saints", "Arlington", "VA", "Atlantic East", 38.8945, -77.1190, "22207", "Private", 2500, 34950, 81, 53, null, null, "https://www.marymountsaints.com/sports/baseball", null, false, "#003478"],
  ["Wesleyan (GA)", "Wolves", "Macon", "GA", "USA South", 32.8562, -83.6293, "31210", "Private", 800, 25750, 44, 38, null, null, "https://www.wesleyansports.com/sports/baseball", null, false, "#4B0082"],
  ["Wentworth", "Leopards", "Boston", "MA", "CCC", 42.3375, -71.0959, "02115", "Private", 4000, 39200, 86, 51, "Ryan Maroney", "maroneyr@wit.edu", "https://www.wentworthathletics.com/sports/baseball", null, false, "#003478"],
  ["Pine Manor", "Gators", "Chestnut Hill", "MA", "GNAC", 42.3233, -71.1693, "02467", "Private", 400, 27225, 70, 20, null, null, null, null, false, "#006633"],
  ["Fisher", "Cardinals", "Rochester", "NY", "Empire 8", 43.1203, -77.5137, "14618", "Private", 3500, 37060, 63, 72, "Tom & Dan O'Meara", "baseball@sjf.edu", "https://www.sjfcardinals.com/sports/baseball", null, false, "#C8102E"],
  ["Hood", "Blazers", "Frederick", "MD", "MAC", 39.4204, -77.4262, "21701", "Private", 1200, 42310, 75, 56, null, null, "https://www.hoodblazers.com/sports/baseball", null, false, "#003478"],
];

let added = 0;
for (const row of LAST_D3) {
  const [name, mascot, city, state, conference, lat, lng, zip, pub_priv, enrollment, tuition, acceptance_rate, graduation_rate, coach, coach_email, website, espn_id, high_academic, primary_color] = row;

  if (existingD3.has(name)) continue;

  let logo_url = null;
  if (espn_id) {
    logo_url = `https://a.espncdn.com/i/teamlogos/ncaa/500/${espn_id}.png`;
  } else if (website) {
    try {
      const domain = new URL(website).hostname;
      logo_url = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    } catch {}
  }

  schools.push({
    id: nextId++,
    name, mascot, city, state, zip,
    latitude: lat, longitude: lng,
    division: "D3", public_private: pub_priv, conference,
    current_ranking: null, tuition,
    instagram: null, x_account: null,
    head_coach_name: coach, head_coach_email: coach_email,
    assistant_coach_name: null, assistant_coach_email: null,
    website, created_at: "2026-02-19 00:00:00",
    last_season_record: null, logo_url,
    mlb_draft_picks: 0,
    stadium_latitude: lat, stadium_longitude: lng,
    stadium_name: null, stadium_image_url: null,
    enrollment, acceptance_rate, graduation_rate,
    cws_appearances: 0, ncaa_regionals: 0,
    roster_size: 40, scholarship_limit: 0,
    recruiting_questionnaire_url: null, nil_url: null,
    high_academic: high_academic || false,
    primary_color: primary_color || "#333333",
  });
  existingD3.add(name);
  added++;
}

fs.writeFileSync(SCHOOLS_PATH, JSON.stringify(schools, null, 2) + "\n");
const d3 = schools.filter(s => s.division === "D3");
console.log(`Added ${added} more. Total D3: ${d3.length}, Total schools: ${schools.length}`);
