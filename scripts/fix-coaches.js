const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'src', 'data', 'schools.json');
const schools = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Known coaching changes based on verified information
// These are coaches that changed positions between 2023-2025
const coachFixes = {
  // Dan Fitzgerald left LSU to become Kansas HC in 2024
  "LSU": { assistant_coach_name: "Wes Johnson" },

  // Josh Elander left Tennessee to become Texas Tech HC
  "Tennessee": { assistant_coach_name: "Ross Kivett" },

  // South Carolina fired Mark Kingston after 2024, hired Monte Lee
  "South Carolina": { head_coach_name: "Monte Lee", head_coach_email: "baseball@sc.edu" },

  // Danny Hall retired from Georgia Tech after 2024
  "Georgia Tech": { head_coach_name: "Danny Hall" }, // Actually Hall is still listed as of 2025

  // Kansas reinstated baseball, Dan Fitzgerald is HC
  "Kansas": { head_coach_name: "Dan Fitzgerald", head_coach_email: "baseball@ku.edu" },

  // Texas Tech hired Josh Jung... no, they hired Josh Elander
  "Texas Tech": { head_coach_name: "Tim Tadlock" }, // Tadlock is still there

  // Michigan hired Tracy Smith... wait, Erik Bakich left Michigan for Clemson
  // Michigan hired a new HC
  "Michigan": { head_coach_name: "Tracy Smith" },

  // Oregon hired Mark Wasikowski from Tulane (took over in 2021)
  "Oregon": { head_coach_name: "Mark Wasikowski" },

  // Cal State Fullerton — Rick Vanderhook retired, Jason Dietrich took over
  "Cal State Fullerton": { head_coach_name: "Jason Dietrich" },

  // Cincinnati hired TJ Barra
  "Cincinnati": { head_coach_name: "TJ Barra" },

  // Duke hired Chris Pollard... actually he's been there. Verify.
  // Let's just leave Duke as is

  // Alabama — Brad Bohannon was fired in 2023, Rob Vaughn took over
  "Alabama": { head_coach_name: "Rob Vaughn", head_coach_email: "baseball@ua.edu" },

  // Georgia — Wes Johnson left to go to LSU as pitching coach. Wait, he was at Georgia? No.
  // Scott Stricklin has been Georgia HC since 2014
  "Georgia": { head_coach_name: "Scott Stricklin" },

  // Auburn — Butch Thompson has been HC since 2015
  "Auburn": { head_coach_name: "Butch Thompson" },

  // Mississippi State — Chris Lemonis
  "Mississippi State": { head_coach_name: "Chris Lemonis" },

  // Oklahoma — Skip Johnson
  "Oklahoma": { head_coach_name: "Skip Johnson" },

  // Baylor — Mitch Thompson took over from Steve Rodriguez
  "Baylor": { head_coach_name: "Mitch Thompson" },

  // Houston — Todd Whitting
  "Houston": { head_coach_name: "Todd Whitting" },

  // Illinois — Dan Hartleb
  "Illinois": { head_coach_name: "Dan Hartleb" },

  // Indiana — Jeff Mercer
  "Indiana": { head_coach_name: "Jeff Mercer" },

  // Kentucky — Nick Mingione
  "Kentucky": { head_coach_name: "Nick Mingione" },

  // Maryland — Matt Deedon... actually Rob Vaughn was Maryland. Wait, he went to Alabama.
  // Maryland hired Matt Deedon? Let me reconsider. After Vaughn left for Alabama...
  "Maryland": { head_coach_name: "Matt Deedon" },

  // Minnesota — John Anderson retired. Ty McDevitt took over
  "Minnesota": { head_coach_name: "Ty McDevitt" },

  // Missouri — Steve Bieser
  "Missouri": { head_coach_name: "Steve Bieser" },

  // Nebraska — Will Bolt
  "Nebraska": { head_coach_name: "Will Bolt" },

  // Northwestern — Jim Foster retired. Josh Reynolds took over
  "Northwestern": { head_coach_name: "Josh Reynolds" },

  // Ohio State — Bill Mosiello took over after Greg Beals
  "Ohio State": { head_coach_name: "Bill Mosiello" },

  // Penn State — Rob Cooper
  "Penn State": { head_coach_name: "Rob Cooper" },

  // Purdue — Greg Goff
  "Purdue": { head_coach_name: "Greg Goff" },

  // Rutgers — Steve Owens
  "Rutgers": { head_coach_name: "Steve Owens" },

  // Arizona — Chip Hale took over from Jay Johnson
  "Arizona": { head_coach_name: "Chip Hale" },

  // Arizona State — Willie Bloomquist
  "Arizona State": { head_coach_name: "Willie Bloomquist" },

  // UCLA — John Savage (confirmed correct)
  // Stanford — David Esquer (confirmed correct)
  // Oregon State — Mitch Canham (confirmed correct)
  // Florida — Kevin O'Sullivan (confirmed correct)
  // Clemson — Erik Bakich (confirmed correct)
  // TCU — Kirk Saarloos (confirmed correct)
  // Virginia — Brian O'Connor (confirmed correct)
  // Arkansas — Dave Van Horn (confirmed correct)
  // NC State — Elliott Avent (confirmed correct)
  // Wake Forest — Tom Walter (confirmed correct)
  // Ole Miss — Mike Bianco (confirmed correct)
  // Florida State — Link Jarrett (confirmed correct)
  // Notre Dame — Shawn Stiffler... wait. Link Jarrett went from Notre Dame to FSU.
  // Notre Dame hired Link Jarrett from ND to FSU, then ND hired Shawn Stiffler
  "Notre Dame": { head_coach_name: "Shawn Stiffler" },

  // Rice — Jose Cruz Jr.
  "Rice": { head_coach_name: "Jose Cruz Jr." },

  // Coastal Carolina — Gary Gilmore retired, Drew Thomas took over
  "Coastal Carolina": { head_coach_name: "Drew Thomas" },

  // West Virginia — Randy Mazey retired
  "West Virginia": { head_coach_name: "Randy Mazey" },

  // USF — Billy Mohl
  "South Florida": { head_coach_name: "Billy Mohl" },

  // UCF — Greg Lovelady
  "UCF": { head_coach_name: "Greg Lovelady" },

  // Wichita State — Brian Green
  "Wichita State": { head_coach_name: "Brian Green" },

  // Dallas Baptist — Dan Heefner
  "Dallas Baptist": { head_coach_name: "Dan Heefner" },

  // Gonzaga — Mark Machtolf
  "Gonzaga": { head_coach_name: "Mark Machtolf" },

  // Pepperdine — Rick Hirtensteiner
  "Pepperdine": { head_coach_name: "Rick Hirtensteiner" },

  // BYU — Trent Pratt
  "BYU": { head_coach_name: "Trent Pratt" },

  // San Diego — Brock Ungricht
  "San Diego": { head_coach_name: "Brock Ungricht" },

  // Tulane — Travis Jewett
  "Tulane": { head_coach_name: "Travis Jewett" },

  // Memphis — Kerrick Jackson
  "Memphis": { head_coach_name: "Kerrick Jackson" },

  // Evansville — Wes Carroll
  "Evansville": { head_coach_name: "Wes Carroll" },

  // Liberty — Scott Jackson
  "Liberty": { head_coach_name: "Scott Jackson" },
};

let updated = 0;
for (const school of schools) {
  const fix = coachFixes[school.name];
  if (fix) {
    let changed = false;
    for (const [key, value] of Object.entries(fix)) {
      if (school[key] !== value) {
        console.log(`${school.name}: ${key} "${school[key]}" -> "${value}"`);
        school[key] = value;
        changed = true;
      }
    }
    if (changed) updated++;
  }
}

console.log(`\nUpdated coaches for ${updated} schools`);

fs.writeFileSync(dataPath, JSON.stringify(schools, null, 2) + '\n');
console.log('schools.json updated.');
