const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync('/tmp/espn_team_ids.json', 'utf8'));
console.log('Total entries:', data.length);

const divs = {};
data.forEach(d => { divs[d.division] = (divs[d.division] || 0) + 1; });
console.log('By division:', divs);

// Check for duplicate ESPN IDs in dataset
const idMap = {};
data.forEach(d => {
  if (!idMap[d.espn_id]) idMap[d.espn_id] = [];
  idMap[d.espn_id].push(d.name + ' (' + d.division + ')');
});
const dupes = Object.entries(idMap).filter(([,v]) => v.length > 1);
console.log('Duplicate IDs in source dataset:', dupes.length);
dupes.forEach(([id, names]) => console.log('  ESPN ' + id + ':', names.join(', ')));

// Build name map
const nameToId = {};
data.forEach(d => {
  nameToId[d.name] = d.espn_id;
});

// Load our schools
const schoolsPath = path.join(__dirname, '..', 'src', 'data', 'schools.json');
const schools = JSON.parse(fs.readFileSync(schoolsPath, 'utf8'));

// Try to match
let matched = 0;
let unmatched = [];
for (const s of schools) {
  if (nameToId[s.name] !== undefined) {
    matched++;
  } else {
    unmatched.push(s.name + ' (' + s.division + ')');
  }
}
console.log('\nMatched:', matched);
console.log('Unmatched:', unmatched.length);
console.log('\nUnmatched schools:');
unmatched.forEach(n => console.log('  ' + n));

// List all names in dataset for reference
console.log('\n=== All names in cfbfastR dataset ===');
data.map(d => d.name).sort().forEach(n => console.log(n));
