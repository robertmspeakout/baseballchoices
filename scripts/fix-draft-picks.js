#!/usr/bin/env node
/**
 * Fix draft picks data:
 * 1. Remove duplicate entries (keep correct school)
 * 2. Fix wrong draft years
 * 3. Update current_level for players who should have progressed by 2026
 */

const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../src/data/draft-picks.json");
const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

// ===== 1. REMOVE DUPLICATES / FIX WRONG ENTRIES =====
// Brooks Lee: drafted from Cal Poly, not Minnesota
if (data["Minnesota"]) {
  data["Minnesota"] = data["Minnesota"].filter(p => p.name !== "Brooks Lee");
}

// Braden Montgomery: drafted from Texas A&M (transferred from Stanford)
if (data["Stanford"]) {
  data["Stanford"] = data["Stanford"].filter(p => p.name !== "Braden Montgomery");
}

// Drew Gilbert: correct entry is Tennessee 2022, remove erroneous Minnesota 2021 entry
if (data["Minnesota"]) {
  data["Minnesota"] = data["Minnesota"].filter(p => p.name !== "Drew Gilbert");
}

// Hurston Waldrep: correct entry is Florida 2023 Rd1, remove erroneous Southern Miss entry
if (data["Southern Miss"]) {
  data["Southern Miss"] = data["Southern Miss"].filter(p => p.name !== "Hurston Waldrep");
}

// Nolan Schanuel: correct entry is Gonzaga 2023 Rd1 #11 Angels, remove erroneous FAU entry
if (data["FAU"]) {
  data["FAU"] = data["FAU"].filter(p => p.name !== "Nolan Schanuel");
}

// Nick Gonzales: Pirates' Gonzales was drafted 2020 from New Mexico State, remove wrong South Florida entry
if (data["South Florida"]) {
  data["South Florida"] = data["South Florida"].filter(p => p.name !== "Nick Gonzales");
}

// Jared Jones (Pirates): actually a high school draftee (2020), remove both college entries
if (data["LSU"]) {
  data["LSU"] = data["LSU"].filter(p => !(p.name === "Jared Jones" && p.team === "Pittsburgh Pirates"));
}
if (data["Long Beach State"]) {
  data["Long Beach State"] = data["Long Beach State"].filter(p => !(p.name === "Jared Jones" && p.team === "Pittsburgh Pirates"));
}

// Gage Ziehl: keep Charlotte entry, remove Miami (FL) duplicate
if (data["Miami (FL)"]) {
  data["Miami (FL)"] = data["Miami (FL)"].filter(p => p.name !== "Gage Ziehl");
}

// Grant Richardson: keep Indiana entry, remove San Diego duplicate
if (data["San Diego"]) {
  data["San Diego"] = data["San Diego"].filter(p => p.name !== "Grant Richardson");
}

// ===== 2. FIX WRONG DRAFT YEARS =====
// Ian Happ: drafted 2015, not 2021
if (data["Connecticut"]) {
  const happ = data["Connecticut"].find(p => p.name === "Ian Happ");
  if (happ) happ.year = 2015;
}

// Logan Gilbert: drafted 2018, not 2021
if (data["Stetson"]) {
  const gilbert = data["Stetson"].find(p => p.name === "Logan Gilbert");
  if (gilbert) gilbert.year = 2018;
}

// Bryson Stott: drafted 2019, not 2021
if (data["UNLV"]) {
  const stott = data["UNLV"].find(p => p.name === "Bryson Stott");
  if (stott) stott.year = 2019;
}

// Max Meyer: drafted 2020, not 2021
if (data["Minnesota"]) {
  const meyer = data["Minnesota"].find(p => p.name === "Max Meyer");
  if (meyer) meyer.year = 2020;
}

// Brendan Donovan: drafted 2018, not 2021
if (data["Santa Clara"]) {
  const donovan = data["Santa Clara"].find(p => p.name === "Brendan Donovan");
  if (donovan) donovan.year = 2018;
}

// Carlos Rodon: drafted 2014, already correct but note as pre-2021
// (keeping as-is since the data scope says "since 2021" but it's already in the file)

// ===== 3. UPDATE CURRENT LEVELS =====
// Helper to update a player's level
function updateLevel(school, playerName, newLevel) {
  if (!data[school]) return;
  const player = data[school].find(p => p.name === playerName);
  if (player) player.current_level = newLevel;
}

// --- 2021 Round 1 picks: should be MLB or AAA by 2026 ---
updateLevel("South Florida", "Henry Davis", "MLB"); // Pirates #1 overall 2021
updateLevel("Vanderbilt", "Jack Leiter", "MLB"); // Rangers #2 overall
updateLevel("Vanderbilt", "Kumar Rocker", "MLB"); // Mets #10, then Rangers
updateLevel("Virginia", "Andrew Abbott", "MLB"); // Reds
updateLevel("East Carolina", "Gavin Williams", "MLB"); // Guardians
updateLevel("Mississippi State", "Will Bednar", "AAA");
updateLevel("Stanford", "Brock Jones", "AAA"); // Guardians 2022 Rd1
updateLevel("Ole Miss", "Gunnar Hoglund", "AAA");
updateLevel("UC Santa Barbara", "Michael McGreevy", "MLB"); // Cardinals
updateLevel("Texas", "Ty Madden", "AAA"); // Tigers
updateLevel("Old Dominion", "Matt McLain", "MLB"); // Reds
updateLevel("Arizona", "Daniel Susac", "MLB"); // Athletics

// --- 2021 Round 2-3 picks at AA → AAA ---
updateLevel("Alabama", "Connor Prielipp", "AAA");
updateLevel("Alabama", "Zane Denton", "AAA");
updateLevel("Arkansas", "Kevin Kopps", "MLB");
updateLevel("Dallas Baptist", "Burl Carraway", "AAA");
updateLevel("Mississippi State", "Kamren James", "AAA");
updateLevel("California", "Nathan Martorella", "AAA");
updateLevel("James Madison", "Ian Seymour", "AAA");

// --- 2021 Round 4-5 at AA → AAA ---
updateLevel("Boston College", "Cody Morissette", "AAA");
updateLevel("Illinois", "Cole Kirschsieper", "AAA");
updateLevel("San Diego", "Ryan Metz", "AAA");
updateLevel("Texas Tech", "Kurt Wilson", "AAA");
updateLevel("NC State", "Terrell Tatum", "AAA");
updateLevel("Vanderbilt", "Christian Little", "AAA");
updateLevel("Charlotte", "Gage Ziehl", "AAA");

// --- 2021 Round 6+ at AA → AAA ---
updateLevel("Wichita State", "Pavin Parks", "AAA");
updateLevel("Oregon", "Kenyon Yovan", "AAA");
updateLevel("BYU", "Easton Walker", "AAA");
updateLevel("Kentucky", "Austin Schultz", "AAA");
updateLevel("Iowa", "Connor McCaffery", "AAA");
updateLevel("SE Louisiana", "Tyler Finke", "AAA");
updateLevel("James Madison", "Justin Showalter", "AAA");
updateLevel("Pepperdine", "Douglas Hodo III", "AAA");
updateLevel("Louisiana", "Brett Kerry", "AAA");

// --- 2022 Round 1 picks at AA → AAA or MLB ---
updateLevel("Georgia Tech", "Kevin Parada", "AAA");
updateLevel("Texas", "Tanner Witt", "AAA");
updateLevel("Oregon State", "Cooper Hjerpe", "MLB"); // Cardinals
updateLevel("Florida", "Jud Fabian", "AAA");
updateLevel("Oklahoma", "Peyton Graham", "AAA");
updateLevel("Tennessee", "Drew Gilbert", "AAA"); // Astros

// --- 2022 Round 2-3 at AA → AAA ---
updateLevel("Texas Tech", "Chase Hampton", "AAA");
updateLevel("Tennessee", "Blade Tidwell", "AAA");
updateLevel("Stanford", "Alex Williams", "AAA");
updateLevel("East Carolina", "Carson Whisenhunt", "AAA");
updateLevel("Nebraska", "Max Anderson", "AAA");
updateLevel("Clemson", "Caden Grice", "AAA");
updateLevel("Hawai'i", "Aaron Davenport", "AAA");
updateLevel("Notre Dame", "Jack Brannigan", "AAA");
updateLevel("Creighton", "Alan Roden", "AAA");
updateLevel("Liberty", "Derek Diamond", "AAA");
updateLevel("Texas", "Lucas Gordon", "AAA");
updateLevel("Vanderbilt", "Tate Kolwyck", "AAA");
updateLevel("Auburn", "Trace Bright", "AAA");
updateLevel("Arkansas", "Jalen Battles", "AAA");
updateLevel("Arkansas", "Brady Slavens", "AAA");

// --- 2022 later round fixes ---
updateLevel("UCF", "Colby Halter", "MLB"); // Actually made Tigers MLB roster
updateLevel("Texas A&M", "Austin Bost", "AA");

// --- 2023 Round 1 picks at AA → AAA (top picks) ---
updateLevel("Tennessee", "Chase Dollander", "AAA");
updateLevel("Virginia", "Kyle Teel", "AAA");
updateLevel("Ole Miss", "Jacob Gonzalez", "AAA");
updateLevel("LSU", "Paul Skenes", "MLB"); // Already MLB for Pirates
updateLevel("Wake Forest", "Rhett Lowder", "MLB"); // Reds
updateLevel("Florida", "Wyatt Langford", "MLB"); // Rangers
updateLevel("Tennessee", "Drew Beam", "AAA");
updateLevel("TCU", "Brayden Taylor", "AAA");

// --- 2023 Round 1 at MLB (fast risers) ---
updateLevel("Florida", "Hurston Waldrep", "MLB"); // Braves

// --- 2023 Round 2-3 at High-A → AA ---
updateLevel("Charlotte", "Austin Masel", "AA");
updateLevel("Oregon State", "Justin Boyd", "AA");
updateLevel("Virginia", "Ethan Anderson", "AA");
updateLevel("Florida", "BT Riopelle", "AA");
updateLevel("Virginia Tech", "Carson DeMartini", "AA");
updateLevel("Florida State", "Jaime Ferrer", "AA");
updateLevel("Auburn", "Sonny DiChiara", "AA"); // Keep AA - later round 2023
updateLevel("Auburn", "Blake Burkhalter", "AAA");
updateLevel("Arkansas", "Cayden Wallace", "AAA");

// --- Gonzaga Nolan Schanuel → MLB (Angels 2023 #11) ---
updateLevel("Gonzaga", "Nolan Schanuel", "MLB");

// Clean up any empty school arrays
for (const school of Object.keys(data)) {
  if (data[school].length === 0) {
    delete data[school];
  }
}

fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n");

// Count changes
let totalPlayers = 0;
for (const school of Object.keys(data)) {
  totalPlayers += data[school].length;
}
console.log(`Draft picks updated. Total players remaining: ${totalPlayers}`);
console.log("Duplicates removed, wrong years fixed, levels updated.");
