const fs = require('fs');
const path = require('path');

const schoolsPath = path.join(__dirname, '..', 'src', 'data', 'schools.json');
const schools = JSON.parse(fs.readFileSync(schoolsPath, 'utf8'));

// Schools to REMOVE — closed, no longer have baseball, or don't exist
// These are not active D3 baseball programs
const removeSchools = [
  "Birmingham-Southern",   // Closed 2024
  "Green Mountain",        // Closed 2020
  "Mills",                 // No baseball program (women's college)
  "Warren Wilson",         // Dropped baseball
  "Finlandia",             // Closed 2023
  "Gordon State",          // No D3 baseball (it's a 2-year school)
  "Hollins",               // No baseball (women's college)
  "MacMurray",             // Closed 2020
  "Poly (NY)",             // No baseball program
  "Corcoran",              // Closed/merged with GW
  "Trinity Bible",         // No D3 baseball
  "Pine Manor",            // Closed/merged with Boston College
  "Polytechnic",           // Not an active D3 baseball program
  "Polytechnic (NY)",      // Duplicate/not active
  "Texas-Santa Cruz",      // Not a real school name (UC Santa Cruz already exists)
];

// More ESPN IDs for remaining valid schools
const moreIds = {
  "Agnes Scott": 2863,
  "Massachusetts-Boston": 3146,
  "UMass-Boston": 3146,
  "Pratt": 3224,
  "Purchase": 3225,
  "Cairn": 2950,
  "Medgar Evers": 3148,
  "Sage": 3243,
  "Thomas (ME)": 3294,
  "Hunter": 3101,
};

const ESPN_CDN = (id) => `https://a.espncdn.com/i/teamlogos/ncaa/500/${id}.png`;

// Remove invalid schools
const before = schools.length;
const filtered = schools.filter(s => !removeSchools.includes(s.name));
const removed = before - filtered.length;

// Add ESPN IDs for remaining
let updated = 0;
for (const school of filtered) {
  const id = moreIds[school.name];
  if (id && !school.logo_url) {
    school.logo_url = ESPN_CDN(id);
    updated++;
  }
}

fs.writeFileSync(schoolsPath, JSON.stringify(filtered, null, 2) + '\n');

console.log(`Removed ${removed} closed/invalid schools`);
console.log(`Added ESPN logos to ${updated} more schools`);
console.log(`Total schools: ${filtered.length}`);

// Final count
let missing = { D1: 0, D2: 0, D3: 0 };
let espn = { D1: 0, D2: 0, D3: 0 };
let total = { D1: 0, D2: 0, D3: 0 };
let missingNames = [];
for (const s of filtered) {
  total[s.division]++;
  if (!s.logo_url) {
    missing[s.division]++;
    missingNames.push(s.name);
  }
  else if (s.logo_url.includes('espncdn.com')) espn[s.division]++;
}
console.log('\nFinal coverage:');
console.log(`  D1: ${total.D1} schools, ${espn.D1} ESPN logos, ${missing.D1} missing`);
console.log(`  D2: ${total.D2} schools, ${espn.D2} ESPN logos, ${missing.D2} missing`);
console.log(`  D3: ${total.D3} schools, ${espn.D3} ESPN logos, ${missing.D3} missing`);
if (missingNames.length) console.log('\nStill missing:', missingNames.join(', '));
