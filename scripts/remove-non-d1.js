const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'src', 'data', 'schools.json');
const schools = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Schools that do NOT have NCAA D1 baseball programs (club teams only)
const nonD1Baseball = [
  'Colorado',     // Dropped baseball in 1980
  'Utah',         // Dropped baseball in 2009
  'Syracuse',     // Dropped baseball after 1972
  'Pittsburgh',   // Dropped baseball after 1996
  'Washington',   // Dropped baseball in 1980
];

const before = schools.length;
const filtered = schools.filter(s => {
  if (nonD1Baseball.includes(s.name)) {
    console.log(`Removing: ${s.name} (${s.city}, ${s.state}) - ${s.conference}`);
    return false;
  }
  return true;
});

console.log(`\nRemoved ${before - filtered.length} schools without D1 baseball programs`);
console.log(`${filtered.length} schools remaining`);

fs.writeFileSync(dataPath, JSON.stringify(filtered, null, 2) + '\n');
console.log('schools.json updated.');
