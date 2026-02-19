#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const SCHOOLS_PATH = path.join(__dirname, "..", "src", "data", "schools.json");
const schools = JSON.parse(fs.readFileSync(SCHOOLS_PATH, "utf8"));

let nextId = Math.max(...schools.map(s => s.id)) + 1;
const existingD3 = new Set(schools.filter(s => s.division === "D3").map(s => s.name));

const FINAL_D3 = [
  ["Baruch", "Bearcats", "New York", "NY", "CUNYAC", 40.7404, -73.9836, "10010", "Public", 15000, 7340, 29, 67, null, null, "https://www.baruchathletics.com/sports/baseball", null, false, "#003478"],
  ["Centenary (LA)", "Gents", "Shreveport", "LA", "SCAC", 32.4617, -93.7119, "71104", "Private", 500, 27780, 55, 45, null, null, "https://www.gocentenary.com/sports/baseball", null, false, "#8B0000"],
  ["Clarkson", "Golden Knights", "Potsdam", "NY", "Liberty League", 44.6611, -74.9844, "13699", "Private", 3500, 55418, 64, 76, "Luke Iannuzzi", "liannuzz@clarkson.edu", "https://www.clarksonathletics.com/sports/baseball", null, false, "#006633"],
  ["Connecticut College", "Camels", "New London", "CT", "NESCAC", 41.3793, -72.1051, "06320", "Private", 1800, 60615, 37, 86, "Curt Luciani", "cluciani@conncoll.edu", "https://www.camelathletics.com/sports/baseball", 3014, true, "#003478"],
  ["Concordia (MN)", "Cobbers", "Moorhead", "MN", "MIAC", 46.8729, -96.7608, "56562", "Private", 1800, 44500, 67, 69, "Bucky Burgau", "burgau@cord.edu", "https://www.cobberathletics.com/sports/baseball", null, false, "#8B0000"],
  ["Corcoran", "Colonels", "Union", "TN", "SAA", 37.6437, -84.7723, "40422", "Private", 1500, 47400, 69, 79, null, null, null, null, false, "#FFD700"],
  ["Delaware Valley", "Aggies", "Doylestown", "PA", "MAC", 40.3419, -75.1146, "18901", "Private", 2100, 42510, 71, 55, "Bill Schellhas", "bill.schellhas@delval.edu", "https://www.delvalathletics.com/sports/baseball", null, false, "#006633"],
  ["East Texas Baptist", "Tigers", "Marshall", "TX", "ASC", 32.5447, -94.3547, "75670", "Private", 1500, 30720, 50, 40, "Cory Okan", "cokan@etbu.edu", "https://www.etbutigers.com/sports/baseball", null, false, "#003478"],
  ["Emory & Henry", "Wasps", "Emory", "VA", "ODAC", 36.7819, -81.8354, "24327", "Private", 1200, 37500, 71, 52, "Dan Corbin", "dcorbin@ehc.edu", "https://www.ehcwasps.com/sports/baseball", null, false, "#003478"],
  ["George Fox", "Bruins", "Newberg", "OR", "NWC", 45.3022, -122.9584, "97132", "Private", 2500, 40290, 81, 63, "Marty Hunter", "mhunter@georgefox.edu", "https://www.georgefoxbruins.com/sports/baseball", 3079, false, "#003478"],
  ["Hampden-Sydney", "Tigers", "Hampden-Sydney", "VA", "ODAC", 37.2391, -78.7161, "23943", "Private", 1000, 49480, 50, 66, "Pete Summer", "psummer@hsc.edu", "https://www.hscathletics.com/sports/baseball", null, false, "#8B0000"],
  ["Howard Payne", "Yellow Jackets", "Brownwood", "TX", "ASC", 31.7099, -98.9914, "76801", "Private", 1000, 29370, 53, 30, "T.J. Clanton", "tjclanton@hputx.edu", "https://www.hpujackets.com/sports/baseball", null, false, "#FFD700"],
  ["Hunter", "Hawks", "New York", "NY", "CUNYAC", 40.7685, -73.9653, "10065", "Public", 17000, 7340, 29, 51, null, null, "https://www.hunterhawks.com/sports/baseball", null, false, "#4B0082"],
  ["John Jay", "Bloodhounds", "New York", "NY", "CUNYAC", 40.7703, -73.9882, "10019", "Public", 12000, 7340, 37, 41, null, null, "https://www.johnjayathletics.com/sports/baseball", null, false, "#C8102E"],
  ["Lancaster Bible", "Chargers", "Lancaster", "PA", "Colonial States", 40.0732, -76.3428, "17601", "Private", 1200, 26810, 80, 60, null, null, "https://www.lbcchargers.com/sports/baseball", null, false, "#003478"],
  ["Marywood", "Pacers", "Scranton", "PA", "Atlantic East", 41.4353, -75.6510, "18509", "Private", 1900, 37930, 73, 55, null, null, "https://www.marywoodpacers.com/sports/baseball", null, false, "#006633"],
  ["Mount Aloysius", "Mounties", "Cresson", "PA", "AMCC", 40.4621, -78.5870, "16630", "Private", 1200, 24370, 63, 41, null, null, "https://www.mountaloysius.edu/athletics/baseball", null, false, "#003478"],
  ["Mount St. Vincent", "Dolphins", "Bronx", "NY", "Skyline", 40.9003, -73.9047, "10471", "Private", 1600, 39940, 72, 55, null, null, "https://www.msvcdolphins.com/sports/baseball", null, false, "#003478"],
  ["Sewanee", "Tigers", "Sewanee", "TN", "SAA", 35.2028, -85.9221, "37375", "Private", 1700, 52910, 49, 74, "David Jenkins", "dmjenkin@sewanee.edu", "https://www.sewaneetigers.com/sports/baseball", null, true, "#4B0082"],
  ["Southwestern (TX)", "Pirates", "Georgetown", "TX", "SCAC", 30.6361, -97.6776, "78626", "Private", 1400, 45960, 43, 67, "Bobby Galvan", "galvanb@southwestern.edu", "https://www.southwesternpirates.com/sports/baseball", null, false, "#FFD700"],
  ["St. Vincent", "Bearcats", "Latrobe", "PA", "PAC", 40.2981, -79.3910, "15650", "Private", 1600, 37616, 71, 54, "Dan Sullivan", "dsullivan@stvincent.edu", "https://www.stvincentbearcats.com/sports/baseball", null, false, "#006633"],
  ["Staten Island", "Dolphins", "Staten Island", "NY", "CUNYAC", 40.6015, -74.1502, "10314", "Public", 12000, 7340, 100, 43, "Michael Mauro", "michael.mauro@csi.cuny.edu", "https://www.csidolphins.com/sports/baseball", null, false, "#003478"],
  ["SUNY Cortland", "Red Dragons", "Cortland", "NY", "SUNYAC", 42.6007, -76.1810, "13045", "Public", 6500, 8868, 69, 72, "Joe Brown", "joe.brown@cortland.edu", "https://www.cortlandreddragons.com/sports/baseball", null, false, "#C8102E"],
  ["SUNY Geneseo", "Knights", "Geneseo", "NY", "SUNYAC", 42.7959, -77.8187, "14454", "Public", 4800, 8868, 54, 79, "David Cracker", "crackerd@geneseo.edu", "https://www.geneseoknights.com/sports/baseball", null, true, "#003478"],
  ["SUNY Maritime", "Privateers", "Throggs Neck", "NY", "Skyline", 40.8070, -73.7970, "10465", "Public", 1800, 8868, 67, 59, null, null, "https://www.sunymaritimeathletics.com/sports/baseball", null, false, "#003478"],
  ["Texas-Dallas", "Comets", "Richardson", "TX", "ASC", 32.9886, -96.7480, "75080", "Public", 22000, 13806, 81, 68, "Jeff Oller", "joller@utdallas.edu", "https://www.utdcomets.com/sports/baseball", null, false, "#FF6600"],
  ["Trinity Bible", "Lions", "Ellendale", "ND", "NCCAA", 46.0044, -98.5227, "58436", "Private", 200, 17200, 44, 30, null, null, null, null, false, "#003478"],
  ["Vassar", "Brewers", "Poughkeepsie", "NY", "Liberty League", 41.6867, -73.8937, "12604", "Private", 2400, 63210, 19, 89, "Nick Mariniello", "nimariniello@vassar.edu", "https://www.vassarathletics.com/sports/baseball", null, true, "#8B0000"],
];

let added = 0;
for (const row of FINAL_D3) {
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
    name,
    mascot,
    city,
    state,
    zip,
    latitude: lat,
    longitude: lng,
    division: "D3",
    public_private: pub_priv,
    conference,
    current_ranking: null,
    tuition,
    instagram: null,
    x_account: null,
    head_coach_name: coach,
    head_coach_email: coach_email,
    assistant_coach_name: null,
    assistant_coach_email: null,
    website,
    created_at: "2026-02-19 00:00:00",
    last_season_record: null,
    logo_url,
    mlb_draft_picks: 0,
    stadium_latitude: lat,
    stadium_longitude: lng,
    stadium_name: null,
    stadium_image_url: null,
    enrollment,
    acceptance_rate,
    graduation_rate,
    cws_appearances: 0,
    ncaa_regionals: 0,
    roster_size: 40,
    scholarship_limit: 0,
    recruiting_questionnaire_url: null,
    nil_url: null,
    high_academic: high_academic || false,
    primary_color: primary_color || "#333333",
  });
  existingD3.add(name);
  added++;
}

fs.writeFileSync(SCHOOLS_PATH, JSON.stringify(schools, null, 2) + "\n");
const d3 = schools.filter(s => s.division === "D3");
console.log(`Added ${added} more D3 schools. Total D3: ${d3.length}, Total schools: ${schools.length}`);
