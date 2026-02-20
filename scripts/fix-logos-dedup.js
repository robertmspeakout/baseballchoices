const fs = require('fs');
const path = require('path');

const schoolsPath = path.join(__dirname, '..', 'src', 'data', 'schools.json');
let schools = JSON.parse(fs.readFileSync(schoolsPath, 'utf8'));

const ESPN_CDN = (id) => `https://a.espncdn.com/i/teamlogos/ncaa/500/${id}.png`;

// Step 1: Remove true duplicate school entries (same school, different names)
const DUPLICATES_TO_REMOVE = [
  'Curry College',         // Same as "Curry"
  'UMass-Boston',          // Same as "Massachusetts-Boston"
  'New Jersey City',       // Same as "NJ City"
  'Plattsburgh State',     // Same as "Plattsburgh"
  'US Coast Guard',        // Same as "Coast Guard"
];

const beforeCount = schools.length;
schools = schools.filter(s => !DUPLICATES_TO_REMOVE.includes(s.name));
const removed = beforeCount - schools.length;
console.log(`Removed ${removed} duplicate school entries`);

// Step 2: Handle schools that moved divisions (remove old division entry)
// Emory & Henry moved D3 → D2. Remove D3 entry.
schools = schools.filter(s => !(s.name === 'Emory & Henry' && s.division === 'D3'));
// Frostburg State is D2. Remove D3 entry if exists.
schools = schools.filter(s => !(s.name === 'Frostburg State' && s.division === 'D3'));
// D'Youville appears in both D2 and D3. Keep D2.
schools = schools.filter(s => !(s.name === "D'Youville" && s.division === 'D3'));
// Fisher / St. John Fisher — same school (renamed). Keep "St. John Fisher", remove "Fisher"
schools = schools.filter(s => !(s.name === 'Fisher' && s.division === 'D3'));
// Thomas More appears in both D2 and D3. Keep D2.
schools = schools.filter(s => !(s.name === 'Thomas More' && s.division === 'D3'));

const afterMoves = schools.length;
console.log(`Removed ${beforeCount - removed - afterMoves + removed} division-move duplicates`);

// Step 3: Fix duplicate ESPN IDs — keep correct school, null others
// For each duplicate, the D1 school or the school the ID actually belongs to keeps it
const FIXES = {
  // ESPN 72: Elizabethtown keep, Elmhurst null (different ID)
  'Elmhurst': null,
  // ESPN 2171: Denison keep, DeSales null
  'DeSales': null,
  // ESPN 2214: Emory keep, Emporia State null
  'Emporia State': null,
  // ESPN 2225: Flagler keep, Farmingdale State null
  'Farmingdale State': null,
  // ESPN 2231: Fort Hays State keep, Fontbonne null
  'Fontbonne': null,
  // ESPN 2233: Franklin Pierce keep, Franklin null
  'Franklin': null,
  // ESPN 2336: Long Beach State keep, Limestone null
  'Limestone': null,
  // ESPN 2344: LIU keep, Longwood null (different school)
  'Longwood': null,
  // ESPN 2362: Manhattan keep, Manchester null
  'Manchester': null,
  // ESPN 2377: McNeese keep, MIT null
  'MIT': null,
  // ESPN 2419: Mount St. Mary's keep, Mount Olive null
  'Mount Olive': null,
  // ESPN 2449: North Dakota State keep, NYU null
  'NYU': null,
  // ESPN 2516: Randolph-Macon keep, Ramapo null
  'Ramapo': null,
  // ESPN 2525: Rockhurst keep, Roger Williams null
  'Roger Williams': null,
  // ESPN 2564: Sioux Falls keep, Simpson null
  'Simpson': null,
  // ESPN 2606: St. Mary's (TX) keep, St. Mary's (MD) null
  "St. Mary's (MD)": null,
  // ESPN 2621: Stevens keep, Swarthmore null
  'Swarthmore': null,
  // ESPN 2623: Missouri State keep, Susquehanna null
  'Susquehanna': null,
  // ESPN 2628: TCU keep, Tarleton State null (needs own ID)
  'Tarleton State': null,
  // ESPN 2636: UTSA keep, Texas Lutheran null
  'Texas Lutheran': null,
  // ESPN 2649: Toledo keep, Trinity (TX) null
  'Trinity (TX)': null,
  // ESPN 2656: Tulsa keep, Tusculum null
  'Tusculum': null,
  // ESPN 2677: Virginia Wesleyan keep, Wabash null
  'Wabash': null,
  // ESPN 2685: Washington (MO) and Washington & Jefferson share — null both (not confident)
  'Washington & Jefferson': null,
  'Washington (MO)': null,
  // ESPN 2694: Wesleyan (CT) keep, Wesley null
  'Wesley': null,
  // ESPN 2698: West Georgia (D1) keep, West Florida & Western Connecticut null
  'West Florida': null,
  'Western Connecticut': null,
  // ESPN 2716: Whitman keep, Whitworth null
  'Whitworth': null,
  // ESPN 2719: Wilkes keep, William Paterson null
  'William Paterson': null,
  // ESPN 2747: Winthrop keep, York (PA) null
  'York (PA)': null,
  // ESPN 2752: Fix — Villanova is 222, Xavier stays 2752
  'Villanova': 222,
  // ESPN 2900: St. Thomas (D1) keep. Remove D3 St. Thomas (MN) dupe.
  'St. Thomas (MN)': null,
  // ESPN 2974: Stonehill keep, Shepherd null
  'Shepherd': null,
  // ESPN 2113: Centenary — both get same ID, that's fine for now (they're different divisions)
  // Actually let's null one: Centenary (NJ) null
  'Centenary (NJ)': null,
};

let fixCount = 0;
for (const school of schools) {
  if (FIXES.hasOwnProperty(school.name)) {
    const val = FIXES[school.name];
    if (val === null) {
      if (school.logo_url !== null) {
        school.logo_url = null;
        fixCount++;
      }
    } else {
      const newUrl = ESPN_CDN(val);
      if (school.logo_url !== newUrl) {
        school.logo_url = newUrl;
        fixCount++;
      }
    }
  }
}
console.log(`Fixed ${fixCount} duplicate ID assignments`);

fs.writeFileSync(schoolsPath, JSON.stringify(schools, null, 2) + '\n');

// Final verification
const idToSchools = {};
for (const s of schools) {
  if (s.logo_url) {
    const match = s.logo_url.match(/\/(\d+)\.png/);
    if (match) {
      const eid = match[1];
      if (!idToSchools[eid]) idToSchools[eid] = [];
      idToSchools[eid].push(s.name + ' (' + s.division + ')');
    }
  }
}
const dupes = Object.entries(idToSchools).filter(([, names]) => names.length > 1);
if (dupes.length) {
  console.log(`\nWARNING: ${dupes.length} remaining duplicate ESPN IDs:`);
  dupes.forEach(([id, names]) => console.log(`  ESPN ${id}: ${names.join(', ')}`));
} else {
  console.log('\nAll ESPN IDs are unique!');
}

// Count coverage
let coverage = { D1: { total: 0, espn: 0, none: 0 }, D2: { total: 0, espn: 0, none: 0 }, D3: { total: 0, espn: 0, none: 0 } };
for (const s of schools) {
  coverage[s.division].total++;
  if (s.logo_url && s.logo_url.includes('espncdn.com')) coverage[s.division].espn++;
  else coverage[s.division].none++;
}
console.log('\nFinal coverage:');
for (const div of ['D1', 'D2', 'D3']) {
  const c = coverage[div];
  console.log(`  ${div}: ${c.espn}/${c.total} ESPN logos, ${c.none} baseball icon`);
}
console.log(`Total: ${schools.length} schools`);
