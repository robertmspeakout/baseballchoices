const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'src', 'data', 'schools.json');
const schools = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Fix Portland Pilots: was 2504 (Prairie View A&M), should be 2501
// Add logos for 7 schools that were null
const logoFixes = {
  'Portland': 2501,       // Was incorrectly 2504 (Prairie View A&M)
  'Bryant': 2803,
  'California Baptist': 2856,
  'Le Moyne': 2330,
  'Merrimack': 2771,
  'Queens': 2511,
  'Stonehill': 284,
  'UT Arlington': 250,
};

let fixCount = 0;
for (const school of schools) {
  if (logoFixes[school.name] !== undefined) {
    const newUrl = `https://a.espncdn.com/i/teamlogos/ncaa/500/${logoFixes[school.name]}.png`;
    const oldUrl = school.logo_url;
    school.logo_url = newUrl;
    console.log(`${school.name}: ${oldUrl} -> ${newUrl}`);
    fixCount++;
  }
}

console.log(`\nFixed ${fixCount} logos`);

// Verify no null logos remain
const nullLogos = schools.filter(s => !s.logo_url);
if (nullLogos.length > 0) {
  console.log(`\nWARNING: ${nullLogos.length} schools still have no logo:`);
  nullLogos.forEach(s => console.log(`  - ${s.name}`));
} else {
  console.log('All 294 schools now have logos!');
}

fs.writeFileSync(dataPath, JSON.stringify(schools, null, 2) + '\n');
console.log('schools.json updated.');
