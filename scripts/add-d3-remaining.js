#!/usr/bin/env node
/**
 * Add remaining D3 baseball programs not covered in the first batch
 */
const fs = require("fs");
const path = require("path");

const SCHOOLS_PATH = path.join(__dirname, "..", "src", "data", "schools.json");
const schools = JSON.parse(fs.readFileSync(SCHOOLS_PATH, "utf8"));

let nextId = Math.max(...schools.map(s => s.id)) + 1;
const existingD3 = new Set(schools.filter(s => s.division === "D3").map(s => s.name));

// Format: [name, mascot, city, state, conference, lat, lng, zip, public_private, enrollment, tuition, acceptance_rate, graduation_rate, coach, coach_email, website, espn_id_or_null, high_academic, primary_color]
const MORE_D3 = [
  ["Albertus Magnus", "Falcons", "New Haven", "CT", "GNAC", 41.3307, -72.9397, "06511", "Private", 1200, 35488, 64, 36, null, null, "https://www.albertusfalcons.com/sports/baseball", null, false, "#003478"],
  ["Berea", "Mountaineers", "Berea", "KY", "USA South", 37.5687, -84.2963, "40404", "Private", 1600, 1000, 33, 53, null, null, "https://www.bereamountaineers.com/sports/baseball", null, false, "#003478"],
  ["Brockport", "Golden Eagles", "Brockport", "NY", "SUNYAC", 43.2128, -77.9408, "14420", "Public", 6500, 8868, 58, 66, "Rudy Campbella", "rcampbella@brockport.edu", "https://www.brockportathletics.com/sports/baseball", null, false, "#006633"],
  ["Brooklyn", "Bulldogs", "Brooklyn", "NY", "CUNYAC", 40.6314, -73.9539, "11210", "Public", 15000, 7340, 36, 43, null, null, "https://www.brooklyncollegeathletics.com/sports/baseball", null, false, "#8B0000"],
  ["Cairn", "Highlanders", "Langhorne", "PA", "Colonial States", 40.1520, -74.8610, "19047", "Private", 700, 27220, 60, 55, null, null, "https://www.cairnhighlanders.com/sports/baseball", null, false, "#003478"],
  ["Central (IA)", "Dutch", "Pella", "IA", "A-R-C", 41.4083, -92.9176, "50219", "Private", 1200, 43490, 67, 73, "Brett VanWyk", "vanwykb@central.edu", "https://www.central.edu/athletics/baseball", null, true, "#C8102E"],
  ["Chatham", "Cougars", "Pittsburgh", "PA", "PAC", 40.4571, -79.9084, "15232", "Private", 1600, 40500, 55, 47, null, null, "https://www.chathamathletics.com/sports/baseball", null, false, "#C8102E"],
  ["City College of New York", "Beavers", "New York", "NY", "CUNYAC", 40.8200, -73.9493, "10031", "Public", 13000, 7340, 35, 46, null, null, "https://www.ccnyathletics.com/sports/baseball", null, false, "#4B0082"],
  ["Coast Guard", "Bears", "New London", "CT", "NEWMAC", 41.3714, -72.0969, "06320", "Public", 1100, 0, 17, 85, "Brian Callahan", "brian.j.callahan@uscga.edu", "https://www.uscgabears.com/sports/baseball", null, true, "#003478"],
  ["College of Wooster", "Fighting Scots", "Wooster", "OH", "NCAC", 40.8048, -81.9353, "44691", "Private", 2000, 56370, 51, 73, "Tim Pettorini", "tpettorini@wooster.edu", "https://www.woosterathletics.com/sports/baseball", 3354, true, "#000000"],
  ["Concordia (TX)", "Tornados", "Austin", "TX", "SCAC", 30.3874, -97.6989, "78726", "Private", 2200, 33750, 80, 40, null, null, "https://www.concordiatx.edu/athletics/baseball", null, false, "#003478"],
  ["Crown", "Storm", "St. Bonifacius", "MN", "UMAC", 44.8856, -93.7525, "55375", "Private", 1300, 24800, 40, 41, null, null, "https://www.crownathletics.com/sports/baseball", null, false, "#003478"],
  ["Curry College", "Colonels", "Milton", "MA", "CCC", 42.2520, -71.0750, "02186", "Private", 2000, 43665, 86, 48, "Jeff Hardy", "jhardy@curry.edu", "https://www.curryathletics.com/sports/baseball", null, false, "#003478"],
  ["D'Youville", "Saints", "Buffalo", "NY", "Empire 8", 42.9064, -78.8817, "14201", "Private", 2500, 30040, 88, 47, null, null, "https://www.dycsaints.com/sports/baseball", null, false, "#C8102E"],
  ["Eastern Mennonite", "Royals", "Harrisonburg", "VA", "ODAC", 38.4530, -78.8651, "22802", "Private", 1200, 38650, 70, 56, "Dustin Frazier", "fraziedr@emu.edu", "https://www.emuroyals.com/sports/baseball", null, false, "#4B0082"],
  ["Elms", "Blazers", "Chicopee", "MA", "GNAC", 42.1596, -72.5893, "01013", "Private", 1000, 38200, 71, 46, null, null, "https://www.elmsblazer.com/sports/baseball", null, false, "#003478"],
  ["FDU-Florham", "Devils", "Madison", "NJ", "MAC", 40.7685, -74.4328, "07940", "Private", 2200, 42390, 73, 55, "Jim Moran", "jmoran@fdu.edu", "https://www.fdudevils.com/sports/baseball", null, false, "#8B0000"],
  ["Gordon State", "Highlanders", "Barnesville", "GA", "Peach Belt", 33.0578, -84.1555, "30204", "Public", 3500, 5180, 83, 30, null, null, null, null, false, "#003478"],
  ["Greensboro", "Pride", "Greensboro", "NC", "USA South", 36.0637, -79.7736, "27401", "Private", 900, 32000, 50, 44, "Tim Harwood", "tharwood@greensboro.edu", "https://www.gogreensboropride.com/sports/baseball", null, false, "#FFD700"],
  ["Gwynedd Mercy", "Griffins", "Gwynedd Valley", "PA", "Atlantic East", 40.1893, -75.2476, "19437", "Private", 2000, 37700, 86, 53, null, null, "https://www.gmercygriffins.com/sports/baseball", null, false, "#003478"],
  ["Hampden-Sydney", "Tigers", "Hampden-Sydney", "VA", "ODAC", 37.2391, -78.7161, "23943", "Private", 1000, 49480, 50, 66, "Pete Summer", "psummer@hsc.edu", "https://www.hscathletics.com/sports/baseball", null, false, "#8B0000"],
  ["Hardin-Simmons", "Cowboys", "Abilene", "TX", "ASC", 32.4464, -99.7245, "79698", "Private", 2100, 32050, 45, 52, "Steve Coleman", "scoleman@hsutx.edu", "https://www.hsutx.edu/athletics/baseball", null, false, "#4B0082"],
  ["Hilbert", "Hawks", "Hamburg", "NY", "Empire 8", 42.7236, -78.8278, "14075", "Private", 700, 24000, 73, 35, null, null, "https://www.hilberthawks.com/sports/baseball", null, false, "#003478"],
  ["Hollins", "Green", "Roanoke", "VA", "ODAC", 37.2903, -79.9539, "24020", "Private", 700, 43055, 73, 60, null, null, null, null, false, "#006633"],
  ["Husson", "Eagles", "Bangor", "ME", "NAC", 44.8211, -68.7730, "04401", "Private", 2800, 19907, 81, 53, "Matt Kinney", "kinneym@husson.edu", "https://www.hussoneagles.com/sports/baseball", null, false, "#003478"],
  ["John Carroll", "Blue Streaks", "University Heights", "OH", "OAC", 41.4927, -81.5377, "44118", "Private", 2700, 43890, 77, 77, "Brian Giese", "bgiese@jcu.edu", "https://www.jcusports.com/sports/baseball", 3106, true, "#003478"],
  ["Lehman", "Lightning", "Bronx", "NY", "CUNYAC", 40.8747, -73.8947, "10468", "Public", 10000, 7340, 32, 32, null, null, "https://www.lehmanathletics.com/sports/baseball", null, false, "#003478"],
  ["LeTourneau", "YellowJackets", "Longview", "TX", "ASC", 32.4490, -94.7316, "75607", "Private", 2500, 33410, 44, 55, "Brad Gregory", "bradgregory@letu.edu", "https://www.letuathletics.com/sports/baseball", null, false, "#003478"],
  ["Luther", "Norse", "Decorah", "IA", "A-R-C", 43.3016, -91.7925, "52101", "Private", 1900, 47350, 63, 76, "Dan Schwartz", "schwadan@luther.edu", "https://www.luthernorse.com/sports/baseball", 3133, true, "#003478"],
  ["MacMurray", "Highlanders", "Jacksonville", "IL", "SLIAC", 39.7339, -90.2295, "62650", "Private", 500, 27500, 50, 25, null, null, null, null, false, "#C8102E"],
  ["Mary Hardin-Baylor", "Crusaders", "Belton", "TX", "ASC", 31.0565, -97.4641, "76513", "Private", 3800, 29550, 71, 50, "Randy Beam", "rbeam@umhb.edu", "https://www.umhbcrusaders.com/sports/baseball", null, false, "#4B0082"],
  ["McMurry", "War Hawks", "Abilene", "TX", "ASC", 32.4600, -99.7363, "79697", "Private", 1100, 30920, 40, 30, "Cody Gann", "cgann@mcm.edu", "https://www.mcmwarhawks.com/sports/baseball", null, false, "#8B0000"],
  ["Medgar Evers", "Cougars", "Brooklyn", "NY", "CUNYAC", 40.6494, -73.9589, "11225", "Public", 5500, 7340, 100, 15, null, null, "https://www.mecathletics.com/sports/baseball", null, false, "#003478"],
  ["Neumann", "Knights", "Aston", "PA", "Atlantic East", 39.8709, -75.4282, "19014", "Private", 2500, 36156, 78, 46, "Matt Finken", "finkenm@neumann.edu", "https://www.neumannknights.com/sports/baseball", null, false, "#003478"],
  ["New Jersey City", "Gothic Knights", "Jersey City", "NJ", "NJAC", 40.7282, -74.0776, "07305", "Public", 6500, 12862, 72, 33, "Rey Rivera", "rrivera@njcu.edu", "https://www.njcugothicknights.com/sports/baseball", null, false, "#FFD700"],
  ["NYU", "Violets", "New York", "NY", "UAA", 40.7291, -73.9965, "10003", "Private", 28000, 58168, 8, 86, "Kyle Mottice", "km3745@nyu.edu", "https://www.nyuathletics.com/sports/baseball", 3201, true, "#4B0082"],
  ["Oglethorpe", "Stormy Petrels", "Atlanta", "GA", "SAA", 33.8208, -84.3357, "30319", "Private", 1200, 40480, 78, 57, null, null, "https://www.oglethorpeathletics.com/sports/baseball", null, false, "#FFD700"],
  ["Pacific (OR)", "Boxers", "Forest Grove", "OR", "NWC", 45.5234, -123.1113, "97116", "Private", 1500, 48800, 77, 50, "Josh Ellingson", "jellingson@pacificu.edu", "https://www.goboxers.com/sports/baseball", null, false, "#000000"],
  ["Penn State Erie", "Lakers", "Erie", "PA", "AMCC", 42.1194, -79.9852, "16563", "Public", 3500, 15238, 76, 57, "Dan Perritano", "dpp10@psu.edu", "https://www.psberhrend.com/sports/baseball", null, false, "#003478"],
  ["Pfeiffer", "Falcons", "Misenheimer", "NC", "USA South", 35.4863, -80.2778, "28109", "Private", 1000, 32370, 46, 38, "John Beilein", "jbeilein@pfeiffer.edu", "https://www.pfeifferfalcons.com/sports/baseball", null, false, "#006633"],
  ["Plattsburgh State", "Cardinals", "Plattsburgh", "NY", "SUNYAC", 44.6950, -73.4568, "12901", "Public", 5000, 8868, 45, 68, "Kris Doorey", "kris.doorey@plattsburgh.edu", "https://www.plattsburghcardinals.com/sports/baseball", null, false, "#C8102E"],
  ["Poly (NY)", "Fighting Blue Jays", "Brooklyn", "NY", "Skyline", 40.6935, -73.9866, "11201", "Private", 4500, 55984, 57, 70, null, null, null, null, false, "#003478"],
  ["Puget Sound", "Loggers", "Tacoma", "WA", "NWC", 47.2622, -122.4817, "98416", "Private", 2500, 55260, 72, 79, "Jeff Halstead", "jhalstead@pugetsound.edu", "https://www.loggerathletics.com/sports/baseball", 3225, true, "#8B0000"],
  ["Randolph", "WildCats", "Lynchburg", "VA", "ODAC", 37.3740, -79.1539, "24503", "Private", 600, 30260, 72, 43, null, null, "https://www.randolphwildcats.com/sports/baseball", null, false, "#FFD700"],
  ["Regis (MA)", "Pride", "Weston", "MA", "GNAC", 42.3466, -71.2959, "02493", "Private", 1600, 43370, 75, 55, null, null, "https://www.regisprideathletics.com/sports/baseball", null, false, "#003478"],
  ["Rhode Island College", "Anchormen", "Providence", "RI", "Little East", 41.8397, -71.4373, "02908", "Public", 6000, 9504, 72, 41, "Dave Lavallee", "dlavallee@ric.edu", "https://www.ricathletics.com/sports/baseball", null, false, "#FFD700"],
  ["Rivier", "Raiders", "Nashua", "NH", "GNAC", 42.7487, -71.4681, "03060", "Private", 1200, 33550, 71, 38, null, null, "https://www.rivierathletics.com/sports/baseball", null, false, "#003478"],
  ["Rutgers-Camden", "Scarlet Raptors", "Camden", "NJ", "NJAC", 39.9492, -75.1216, "08102", "Public", 5500, 15407, 57, 60, "Brian Canzanese", "bcanzanese@camden.rutgers.edu", "https://www.raptorsathletics.com/sports/baseball", null, false, "#C8102E"],
  ["Sage", "Gators", "Albany", "NY", "Empire 8", 42.6550, -73.7633, "12208", "Private", 1400, 33450, 53, 48, null, null, "https://www.sageschool.edu/athletics/baseball", null, false, "#006633"],
  ["Salem State", "Vikings", "Salem", "MA", "MASCAC", 42.5168, -70.8924, "01970", "Public", 6000, 10700, 72, 46, "Steve Decker", "sdecker@salemstate.edu", "https://www.salemstatevikings.com/sports/baseball", null, false, "#003478"],
  ["Schreiner", "Mountaineers", "Kerrville", "TX", "SCAC", 30.0374, -99.1268, "78028", "Private", 1000, 31340, 54, 34, null, null, "https://www.schreinersports.com/sports/baseball", null, false, "#8B0000"],
  ["Shenandoah", "Hornets", "Winchester", "VA", "ODAC", 39.1753, -78.1633, "22601", "Private", 2000, 37150, 86, 54, "Paul Robinson", "probinson@su.edu", "https://www.suhornets.com/sports/baseball", null, false, "#C8102E"],
  ["St. Joseph (CT)", "Blue Jays", "West Hartford", "CT", "GNAC", 41.7665, -72.7557, "06117", "Private", 800, 45100, 72, 57, null, null, "https://www.sjcbluejays.com/sports/baseball", null, false, "#003478"],
  ["St. Mary's (MD)", "Seahawks", "St. Mary's City", "MD", "C2C", 38.1877, -76.4266, "20686", "Public", 1500, 15618, 73, 68, "Nolan Ralph", "nsralph@smcm.edu", "https://www.smcmathletics.com/sports/baseball", null, true, "#003478"],
  ["Sul Ross State", "Lobos", "Alpine", "TX", "ASC", 30.3590, -103.6560, "79832", "Public", 2000, 8610, 99, 25, "Mike Madrid", "mmadrid@sulross.edu", "https://www.srlobos.com/sports/baseball", null, false, "#C8102E"],
  ["Stevenson", "Mustangs", "Owings Mills", "MD", "MAC", 39.4103, -76.7727, "21117", "Private", 3000, 39890, 62, 56, "Dan Leja", "dleja@stevenson.edu", "https://www.stevensonmustangs.com/sports/baseball", null, false, "#006633"],
  ["SUNY Canton", "Kangaroos", "Canton", "NY", "NAC", 44.5953, -75.1553, "13617", "Public", 3000, 8868, 68, 37, null, null, "https://www.cantonroos.com/sports/baseball", null, false, "#003478"],
  ["SUNY Cobleskill", "Fighting Tigers", "Cobleskill", "NY", "NAC", 42.6778, -74.4852, "12043", "Public", 2200, 8868, 88, 37, null, null, "https://www.caborathletics.com/sports/baseball", null, false, "#FF6600"],
  ["SUNY Delhi", "Broncos", "Delhi", "NY", "NAC", 42.2781, -74.9159, "13753", "Public", 2500, 8868, 57, 34, null, null, "https://www.delhiathletics.com/sports/baseball", null, false, "#003478"],
  ["SUNY Morrisville", "Mustangs", "Morrisville", "NY", "NAC", 42.8986, -75.6410, "13408", "Public", 2500, 8868, 57, 33, null, null, "https://www.morrisvilleathletics.com/sports/baseball", null, false, "#006633"],
  ["SUNY New Paltz", "Hawks", "New Paltz", "NY", "SUNYAC", 41.7496, -74.0868, "12561", "Public", 7000, 8868, 40, 73, "Kyle Jayne", "jaynek@newpaltz.edu", "https://www.newpaltzhawks.com/sports/baseball", null, false, "#003478"],
  ["SUNY Poly", "Wildcats", "Utica", "NY", "NAC", 43.0802, -75.2508, "13502", "Public", 2500, 8868, 58, 47, null, null, "https://www.sunypoly.edu/athletics/baseball", null, false, "#003478"],
  ["Texas-Santa Cruz", "Banana Slugs", "Santa Cruz", "CA", "Independent", 36.9914, -122.0609, "95064", "Public", 17000, 14100, 47, 78, null, null, "https://www.ucscathletics.com/sports/baseball", null, false, "#FFD700"],
  ["Thiel", "Tomcats", "Greenville", "PA", "PAC", 41.4048, -80.3816, "16125", "Private", 700, 32748, 60, 41, null, null, "https://www.thieltomcats.com/sports/baseball", null, false, "#003478"],
  ["Thomas (ME)", "Terriers", "Waterville", "ME", "NAC", 44.5606, -69.6462, "04901", "Private", 700, 28000, 78, 33, null, null, "https://www.thomasterriers.com/sports/baseball", null, false, "#003478"],
  ["UC Santa Cruz", "Banana Slugs", "Santa Cruz", "CA", "Independent", 36.9914, -122.0609, "95064", "Public", 17000, 14100, 47, 78, null, null, "https://www.goslugs.com/sports/baseball", null, false, "#FFD700"],
  ["Wartburg", "Knights", "Waverly", "IA", "A-R-C", 42.7308, -92.4816, "50677", "Private", 1500, 44320, 54, 64, "Blake Stowell", "blake.stowell@wartburg.edu", "https://www.wartburgknights.com/sports/baseball", null, false, "#FF6600"],
  ["Washington College", "Shoremen", "Chestertown", "MD", "Centennial", 39.2159, -76.0644, "21620", "Private", 1300, 50040, 57, 73, "Ryan Woleslagle", "rwoleslagle@washcoll.edu", "https://www.washcollsports.com/sports/baseball", null, true, "#C8102E"],
  ["Westfield State", "Owls", "Westfield", "MA", "MASCAC", 42.1390, -72.7680, "01086", "Public", 4500, 11000, 73, 51, "Scott Heyerdahl", "sheyerdahl@westfield.ma.edu", "https://www.westfieldstateowls.com/sports/baseball", null, false, "#003478"],
  ["Wheeling Jesuit", "Cardinals", "Wheeling", "WV", "PAC", 40.0639, -80.6955, "26003", "Private", 1000, 30400, 73, 48, null, null, "https://www.wheelingcardinals.com/sports/baseball", null, false, "#C8102E"],
  ["Whitworth", "Pirates", "Spokane", "WA", "NWC", 47.7552, -117.4183, "99251", "Private", 2500, 47650, 84, 75, "Dan Ramsay", "dramsay@whitworth.edu", "https://www.whitworthpirates.com/sports/baseball", null, true, "#C8102E"],
  ["Willamette", "Bearcats", "Salem", "OR", "NWC", 44.9360, -123.0264, "97301", "Private", 2000, 44645, 80, 66, "David Wong", "dwong@willamette.edu", "https://www.willamettebearcats.com/sports/baseball", null, false, "#C8102E"],
  ["William Paterson", "Pioneers", "Wayne", "NJ", "NJAC", 40.9575, -74.2289, "07470", "Public", 9000, 13714, 63, 56, "Jeff Marterer", "martererj@wpunj.edu", "https://www.wppioneers.com/sports/baseball", null, false, "#FF6600"],
  ["William Peace", "Pacers", "Raleigh", "NC", "USA South", 35.7882, -78.6369, "27604", "Private", 900, 30950, 48, 35, null, null, "https://www.peaceathletics.com/sports/baseball", null, false, "#FFD700"],
  ["Yeshiva", "Maccabees", "New York", "NY", "Skyline", 40.8510, -73.9280, "10033", "Private", 2700, 46350, 60, 80, null, null, "https://www.yumacs.com/sports/baseball", null, false, "#003478"],
];

let added = 0;
for (const row of MORE_D3) {
  const [name, mascot, city, state, conference, lat, lng, zip, pub_priv, enrollment, tuition, acceptance_rate, graduation_rate, coach, coach_email, website, espn_id, high_academic, primary_color] = row;

  // Skip duplicates
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
