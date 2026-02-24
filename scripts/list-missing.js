const schools = require('../src/data/schools.json');

for (const div of ['D1', 'D2', 'D3', 'JUCO']) {
  const missing = schools.filter(s => s.division === div && !s.logo_url);
  console.log(`\n=== ${div} (${missing.length} missing) ===`);
  missing.forEach(s => console.log(s.name));
}
