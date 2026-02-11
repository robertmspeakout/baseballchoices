const fs = require('fs');
const path = require('path');

// MLB Draft picks from D1 college programs, 2021-2024
// Keyed by school name (matching schools.json)
const draftPicks = {
  "Alabama": [
    { name: "Connor Prielipp", year: 2022, round: 2, pick: 48, team: "Minnesota Twins", position: "LHP", current_level: "AA" },
    { name: "Zane Denton", year: 2022, round: 3, pick: 80, team: "Milwaukee Brewers", position: "3B", current_level: "AA" },
    { name: "Jim Jarvis", year: 2023, round: 5, pick: 139, team: "Oakland Athletics", position: "SS", current_level: "High-A" },
    { name: "Garrett McMillan", year: 2023, round: 8, pick: 231, team: "Cleveland Guardians", position: "RHP", current_level: "High-A" },
    { name: "Luke Holman", year: 2024, round: 1, pick: 23, team: "Washington Nationals", position: "RHP", current_level: "High-A" },
  ],
  "Arizona": [
    { name: "Daniel Susac", year: 2022, round: 1, pick: 19, team: "Oakland Athletics", position: "C", current_level: "AAA" },
    { name: "Chase Davis", year: 2023, round: 2, pick: 64, team: "Baltimore Orioles", position: "OF", current_level: "AA" },
    { name: "Brendan Summerhill", year: 2024, round: 3, pick: 88, team: "San Francisco Giants", position: "C", current_level: "High-A" },
  ],
  "Arizona State": [
    { name: "Sean McLain", year: 2024, round: 2, pick: 40, team: "Kansas City Royals", position: "OF", current_level: "High-A" },
    { name: "Joe Lampe", year: 2024, round: 4, pick: 115, team: "Arizona Diamondbacks", position: "OF", current_level: "High-A" },
    { name: "Ryan Campos", year: 2023, round: 6, pick: 172, team: "Texas Rangers", position: "SS", current_level: "High-A" },
  ],
  "Arkansas": [
    { name: "Kevin Kopps", year: 2021, round: 3, pick: 99, team: "San Diego Padres", position: "RHP", current_level: "AAA" },
    { name: "Peyton Stovall", year: 2024, round: 2, pick: 46, team: "Houston Astros", position: "2B", current_level: "High-A" },
    { name: "Hagen Smith", year: 2024, round: 1, pick: 7, team: "Arizona Diamondbacks", position: "LHP", current_level: "High-A" },
    { name: "Cayden Wallace", year: 2023, round: 2, pick: 49, team: "Kansas City Royals", position: "3B", current_level: "AA" },
    { name: "Jalen Battles", year: 2022, round: 6, pick: 175, team: "St. Louis Cardinals", position: "SS", current_level: "AA" },
    { name: "Brady Slavens", year: 2022, round: 7, pick: 218, team: "Baltimore Orioles", position: "1B", current_level: "AA" },
  ],
  "Auburn": [
    { name: "Sonny DiChiara", year: 2023, round: 6, pick: 187, team: "Cincinnati Reds", position: "1B", current_level: "AA" },
    { name: "Brooks Carlson", year: 2023, round: 4, pick: 107, team: "Minnesota Twins", position: "C", current_level: "High-A" },
    { name: "Blake Burkhalter", year: 2023, round: 5, pick: 147, team: "Atlanta Braves", position: "RHP", current_level: "AA" },
    { name: "Trace Bright", year: 2022, round: 5, pick: 159, team: "Baltimore Orioles", position: "RHP", current_level: "AA" },
  ],
  "Baylor": [
    { name: "Jack Pineda", year: 2024, round: 5, pick: 144, team: "San Francisco Giants", position: "C", current_level: "Single-A" },
    { name: "Tyler Thomas", year: 2023, round: 4, pick: 116, team: "Miami Marlins", position: "LHP", current_level: "AA" },
    { name: "Jared McKenzie", year: 2024, round: 3, pick: 76, team: "Toronto Blue Jays", position: "OF", current_level: "High-A" },
  ],
  "Boston College": [
    { name: "Sal Frelick", year: 2021, round: 1, pick: 15, team: "Milwaukee Brewers", position: "OF", current_level: "MLB" },
    { name: "Cody Morissette", year: 2021, round: 4, pick: 115, team: "Miami Marlins", position: "2B", current_level: "AA" },
  ],
  "Cal State Fullerton": [
    { name: "Kyle Luckham", year: 2024, round: 4, pick: 121, team: "Seattle Mariners", position: "RHP", current_level: "High-A" },
  ],
  "Campbell": [
    { name: "Zach Neto", year: 2022, round: 1, pick: 13, team: "Los Angeles Angels", position: "SS", current_level: "MLB" },
  ],
  "Clemson": [
    { name: "Max Wagner", year: 2022, round: 2, pick: 42, team: "Baltimore Orioles", position: "3B", current_level: "AAA" },
    { name: "Caden Grice", year: 2022, round: 3, pick: 81, team: "Pittsburgh Pirates", position: "1B", current_level: "AA" },
    { name: "Nolan Nawrocki", year: 2024, round: 5, pick: 141, team: "Pittsburgh Pirates", position: "RHP", current_level: "Single-A" },
    { name: "Blake Wright", year: 2024, round: 3, pick: 92, team: "Houston Astros", position: "3B", current_level: "High-A" },
  ],
  "Coastal Carolina": [
    { name: "Matt Gilbertson", year: 2023, round: 8, pick: 243, team: "Baltimore Orioles", position: "RHP", current_level: "High-A" },
  ],
  "Duke": [
    { name: "Henry Davis", year: 2024, round: 4, pick: 106, team: "Cleveland Guardians", position: "RHP", current_level: "High-A" },
  ],
  "East Carolina": [
    { name: "Gavin Williams", year: 2021, round: 1, pick: 23, team: "Cleveland Guardians", position: "RHP", current_level: "MLB" },
    { name: "Thomas Francisco", year: 2022, round: 4, pick: 130, team: "New York Mets", position: "3B", current_level: "AA" },
    { name: "Josh Moylan", year: 2023, round: 4, pick: 121, team: "New York Mets", position: "3B", current_level: "AA" },
    { name: "Trey Yesavage", year: 2023, round: 2, pick: 51, team: "Cleveland Guardians", position: "RHP", current_level: "AA" },
    { name: "Carson Whisenhunt", year: 2022, round: 2, pick: 66, team: "San Francisco Giants", position: "LHP", current_level: "AA" },
    { name: "Jake Kuchmaner", year: 2024, round: 6, pick: 171, team: "St. Louis Cardinals", position: "LHP", current_level: "Single-A" },
  ],
  "Florida": [
    { name: "Wyatt Langford", year: 2023, round: 1, pick: 4, team: "Texas Rangers", position: "OF", current_level: "MLB" },
    { name: "Jac Caglianone", year: 2024, round: 1, pick: 5, team: "Kansas City Royals", position: "1B/LHP", current_level: "High-A" },
    { name: "Brandon Sproat", year: 2023, round: 2, pick: 57, team: "New York Mets", position: "RHP", current_level: "AA" },
    { name: "Sterlin Thompson", year: 2023, round: 3, pick: 84, team: "Colorado Rockies", position: "OF", current_level: "AA" },
    { name: "BT Riopelle", year: 2023, round: 3, pick: 93, team: "Cincinnati Reds", position: "C", current_level: "High-A" },
    { name: "Hurston Waldrep", year: 2023, round: 1, pick: 24, team: "Atlanta Braves", position: "RHP", current_level: "MLB" },
  ],
  "Florida State": [
    { name: "James Tibbs III", year: 2024, round: 1, pick: 14, team: "Boston Red Sox", position: "OF", current_level: "High-A" },
    { name: "Brennen Oxford", year: 2024, round: 2, pick: 55, team: "Los Angeles Angels", position: "3B", current_level: "Single-A" },
    { name: "Jaime Ferrer", year: 2023, round: 3, pick: 96, team: "San Francisco Giants", position: "OF", current_level: "High-A" },
    { name: "Parker Messick", year: 2022, round: 4, pick: 113, team: "Minnesota Twins", position: "LHP", current_level: "AA" },
    { name: "Bryce Hubbart", year: 2022, round: 4, pick: 118, team: "San Francisco Giants", position: "LHP", current_level: "AA" },
  ],
  "Georgia": [
    { name: "Charlie Condon", year: 2024, round: 1, pick: 3, team: "Colorado Rockies", position: "3B/OF", current_level: "High-A" },
    { name: "Corey Collins", year: 2024, round: 2, pick: 41, team: "Chicago Cubs", position: "C", current_level: "Single-A" },
    { name: "Connor Tate", year: 2023, round: 6, pick: 176, team: "New York Yankees", position: "OF", current_level: "High-A" },
    { name: "Nolan Crisp", year: 2024, round: 4, pick: 113, team: "Tampa Bay Rays", position: "RHP", current_level: "Single-A" },
  ],
  "Georgia Tech": [
    { name: "Kevin Parada", year: 2022, round: 1, pick: 11, team: "New York Mets", position: "C", current_level: "AA" },
    { name: "Tre Phelps", year: 2024, round: 2, pick: 60, team: "Atlanta Braves", position: "OF", current_level: "Single-A" },
    { name: "Chandler Simpson", year: 2023, round: 6, pick: 179, team: "Tampa Bay Rays", position: "OF", current_level: "High-A" },
    { name: "Drew Burress", year: 2022, round: 6, pick: 188, team: "San Diego Padres", position: "OF", current_level: "AA" },
  ],
  "Houston": [
    { name: "Robert Gasser", year: 2021, round: 2, pick: 71, team: "San Diego Padres", position: "LHP", current_level: "MLB" },
    { name: "Ben Sears", year: 2022, round: 6, pick: 193, team: "Milwaukee Brewers", position: "RHP", current_level: "MLB" },
  ],
  "Indiana": [
    { name: "Grant Richardson", year: 2022, round: 5, pick: 147, team: "Milwaukee Brewers", position: "OF", current_level: "AAA" },
    { name: "Brooks Ey", year: 2024, round: 4, pick: 128, team: "Philadelphia Phillies", position: "OF", current_level: "Single-A" },
    { name: "Carter Mathison", year: 2024, round: 5, pick: 158, team: "Colorado Rockies", position: "SS", current_level: "Single-A" },
  ],
  "Kansas State": [
    { name: "Jordan Wicks", year: 2021, round: 1, pick: 21, team: "Chicago Cubs", position: "LHP", current_level: "MLB" },
    { name: "Nick Goodwin", year: 2023, round: 5, pick: 143, team: "Texas Rangers", position: "OF", current_level: "High-A" },
  ],
  "Kentucky": [
    { name: "Chase Lee", year: 2022, round: 4, pick: 133, team: "Houston Astros", position: "LHP", current_level: "AAA" },
    { name: "Ryan Nicholson", year: 2024, round: 3, pick: 85, team: "Miami Marlins", position: "1B", current_level: "Single-A" },
    { name: "Austin Schultz", year: 2021, round: 6, pick: 189, team: "Cleveland Guardians", position: "2B", current_level: "AA" },
  ],
  "LSU": [
    { name: "Paul Skenes", year: 2023, round: 1, pick: 1, team: "Pittsburgh Pirates", position: "RHP", current_level: "MLB" },
    { name: "Dylan Crews", year: 2023, round: 1, pick: 2, team: "Washington Nationals", position: "OF", current_level: "MLB" },
    { name: "Jacob Berry", year: 2022, round: 1, pick: 6, team: "Miami Marlins", position: "3B", current_level: "AAA" },
    { name: "Cade Beloso", year: 2021, round: 9, pick: 273, team: "Baltimore Orioles", position: "1B", current_level: "AAA" },
    { name: "Landon Marceaux", year: 2021, round: 3, pick: 87, team: "Tampa Bay Rays", position: "RHP", current_level: "AAA" },
    { name: "Jared Jones", year: 2021, round: 2, pick: 44, team: "Pittsburgh Pirates", position: "RHP", current_level: "MLB" },
    { name: "Tre Morgan", year: 2023, round: 3, pick: 80, team: "Tampa Bay Rays", position: "1B", current_level: "AA" },
    { name: "Ty Floyd", year: 2023, round: 3, pick: 88, team: "Chicago White Sox", position: "RHP", current_level: "AA" },
    { name: "Tommy White", year: 2024, round: 2, pick: 44, team: "San Francisco Giants", position: "3B", current_level: "High-A" },
    { name: "Gavin Dugas", year: 2024, round: 4, pick: 103, team: "Pittsburgh Pirates", position: "OF", current_level: "Single-A" },
  ],
  "Louisville": [
    { name: "Henry Davis", year: 2021, round: 1, pick: 1, team: "Pittsburgh Pirates", position: "C", current_level: "MLB" },
    { name: "Levi Usher", year: 2022, round: 5, pick: 155, team: "Cleveland Guardians", position: "OF", current_level: "AAA" },
    { name: "Dalton Rushing", year: 2023, round: 1, pick: 40, team: "Los Angeles Dodgers", position: "C", current_level: "AAA" },
    { name: "Christian Knapczyk", year: 2023, round: 5, pick: 150, team: "Kansas City Royals", position: "2B", current_level: "High-A" },
  ],
  "Maryland": [
    { name: "Troy Schreffler", year: 2022, round: 4, pick: 121, team: "Pittsburgh Pirates", position: "OF", current_level: "AA" },
    { name: "Matt Shaw", year: 2023, round: 1, pick: 13, team: "Chicago Cubs", position: "SS", current_level: "AAA" },
    { name: "Nick Dean", year: 2023, round: 2, pick: 43, team: "Chicago Cubs", position: "RHP", current_level: "AA" },
  ],
  "Miami (FL)": [
    { name: "Karson Ligon", year: 2024, round: 3, pick: 79, team: "New York Mets", position: "RHP", current_level: "Single-A" },
    { name: "Yohandy Morales", year: 2023, round: 2, pick: 59, team: "Baltimore Orioles", position: "3B", current_level: "AA" },
    { name: "Gage Ziehl", year: 2021, round: 6, pick: 180, team: "Miami Marlins", position: "RHP", current_level: "AA" },
    { name: "Andrew Walters", year: 2023, round: 4, pick: 120, team: "Baltimore Orioles", position: "RHP", current_level: "AA" },
  ],
  "Michigan": [
    { name: "Clark Elliott", year: 2023, round: 2, pick: 58, team: "Arizona Diamondbacks", position: "OF", current_level: "AA" },
  ],
  "Mississippi State": [
    { name: "Will Bednar", year: 2021, round: 1, pick: 14, team: "San Francisco Giants", position: "RHP", current_level: "AAA" },
    { name: "Tanner Leggett", year: 2022, round: 5, pick: 157, team: "St. Louis Cardinals", position: "C", current_level: "AA" },
    { name: "Kamren James", year: 2021, round: 2, pick: 56, team: "Houston Astros", position: "SS", current_level: "AA" },
    { name: "Kellum Clark", year: 2024, round: 3, pick: 83, team: "Milwaukee Brewers", position: "1B", current_level: "Single-A" },
  ],
  "NC State": [
    { name: "Carlos Rodon", year: 2014, round: 1, pick: 3, team: "Chicago White Sox", position: "LHP", current_level: "MLB" },
    { name: "Sam Highfill", year: 2021, round: 4, pick: 122, team: "San Francisco Giants", position: "RHP", current_level: "AAA" },
    { name: "Terrell Tatum", year: 2021, round: 5, pick: 152, team: "New York Yankees", position: "OF", current_level: "AA" },
    { name: "LuJames Groover III", year: 2024, round: 5, pick: 148, team: "Baltimore Orioles", position: "RHP", current_level: "Single-A" },
  ],
  "North Carolina": [
    { name: "Vance Honeycutt", year: 2024, round: 1, pick: 13, team: "Philadelphia Phillies", position: "OF", current_level: "High-A" },
    { name: "Mac Horvath", year: 2024, round: 2, pick: 43, team: "Baltimore Orioles", position: "3B", current_level: "Single-A" },
  ],
  "Notre Dame": [
    { name: "Jack Brannigan", year: 2022, round: 3, pick: 86, team: "Pittsburgh Pirates", position: "3B", current_level: "AA" },
    { name: "John Michael Bertrand", year: 2022, round: 5, pick: 154, team: "Milwaukee Brewers", position: "LHP", current_level: "AAA" },
    { name: "Jack Findlay", year: 2023, round: 4, pick: 110, team: "New York Yankees", position: "RHP", current_level: "High-A" },
  ],
  "Ohio State": [
    { name: "Gavin Turley", year: 2024, round: 4, pick: 108, team: "Arizona Diamondbacks", position: "OF", current_level: "Single-A" },
    { name: "Isaiah Coupet", year: 2024, round: 5, pick: 152, team: "Cleveland Guardians", position: "LHP", current_level: "Single-A" },
  ],
  "Oklahoma State": [
    { name: "Justin Campbell", year: 2022, round: 1, pick: 15, team: "Cleveland Guardians", position: "RHP", current_level: "AAA" },
    { name: "Nolan McLean", year: 2023, round: 1, pick: 28, team: "Baltimore Orioles", position: "RHP/1B", current_level: "AA" },
    { name: "Griffin Doersching", year: 2022, round: 6, pick: 182, team: "Arizona Diamondbacks", position: "1B", current_level: "AA" },
    { name: "Juaron Watts-Brown", year: 2024, round: 4, pick: 119, team: "Detroit Tigers", position: "RHP", current_level: "Single-A" },
  ],
  "Ole Miss": [
    { name: "Jacob Gonzalez", year: 2023, round: 1, pick: 15, team: "Milwaukee Brewers", position: "SS", current_level: "AA" },
    { name: "Tim Elko", year: 2022, round: 6, pick: 174, team: "New York Mets", position: "1B", current_level: "AA" },
    { name: "Peyton Chatagnier", year: 2022, round: 5, pick: 148, team: "Arizona Diamondbacks", position: "2B", current_level: "AAA" },
    { name: "TJ McCants", year: 2022, round: 4, pick: 127, team: "Arizona Diamondbacks", position: "OF", current_level: "AA" },
    { name: "Drew McDaniel", year: 2024, round: 3, pick: 78, team: "Chicago White Sox", position: "RHP", current_level: "Single-A" },
  ],
  "Oregon State": [
    { name: "Travis Bazzana", year: 2024, round: 1, pick: 1, team: "Cleveland Guardians", position: "2B", current_level: "High-A" },
    { name: "Cooper Hjerpe", year: 2022, round: 1, pick: 22, team: "St. Louis Cardinals", position: "LHP", current_level: "AAA" },
    { name: "Jacob Melton", year: 2023, round: 2, pick: 42, team: "Houston Astros", position: "OF", current_level: "AAA" },
    { name: "Justin Boyd", year: 2023, round: 3, pick: 76, team: "Baltimore Orioles", position: "OF", current_level: "High-A" },
    { name: "Wade Meckler", year: 2022, round: 3, pick: 97, team: "San Francisco Giants", position: "OF", current_level: "AAA" },
  ],
  "Rice": [
    { name: "Trei Cruz", year: 2021, round: 3, pick: 97, team: "Detroit Tigers", position: "SS", current_level: "AAA" },
  ],
  "Rutgers": [
    { name: "Nathan Lavender", year: 2024, round: 6, pick: 184, team: "Cleveland Guardians", position: "LHP", current_level: "Single-A" },
  ],
  "South Carolina": [
    { name: "Michael Braswell", year: 2024, round: 2, pick: 53, team: "San Diego Padres", position: "SS", current_level: "Single-A" },
    { name: "Ethan Wilson", year: 2023, round: 2, pick: 62, team: "Philadelphia Phillies", position: "OF", current_level: "AA" },
    { name: "Will Sanders", year: 2023, round: 4, pick: 115, team: "New York Mets", position: "RHP", current_level: "AA" },
  ],
  "Southern Miss": [
    { name: "Hunter Riggins", year: 2022, round: 5, pick: 156, team: "Tampa Bay Rays", position: "C", current_level: "AA" },
    { name: "Hurston Waldrep", year: 2022, round: 8, pick: 244, team: "Atlanta Braves", position: "RHP", current_level: "MLB" },
  ],
  "Stanford": [
    { name: "Brock Jones", year: 2022, round: 1, pick: 20, team: "Cleveland Guardians", position: "OF", current_level: "AA" },
    { name: "Quinn Mathews", year: 2024, round: 1, pick: 20, team: "St. Louis Cardinals", position: "LHP", current_level: "High-A" },
    { name: "Braden Montgomery", year: 2024, round: 1, pick: 12, team: "Boston Red Sox", position: "OF", current_level: "High-A" },
    { name: "Alex Williams", year: 2022, round: 2, pick: 58, team: "San Francisco Giants", position: "RHP", current_level: "AA" },
    { name: "Drew Bowser", year: 2023, round: 4, pick: 112, team: "Los Angeles Dodgers", position: "OF", current_level: "AA" },
  ],
  "TCU": [
    { name: "Brayden Taylor", year: 2023, round: 1, pick: 30, team: "Detroit Tigers", position: "3B", current_level: "AA" },
    { name: "Tommy Sacco", year: 2024, round: 2, pick: 47, team: "Arizona Diamondbacks", position: "SS", current_level: "Single-A" },
    { name: "Kurtis Byrne", year: 2024, round: 4, pick: 111, team: "Baltimore Orioles", position: "OF", current_level: "Single-A" },
    { name: "Marcelo Perez", year: 2022, round: 4, pick: 110, team: "Tampa Bay Rays", position: "LHP", current_level: "AA" },
  ],
  "Tennessee": [
    { name: "Chase Dollander", year: 2023, round: 1, pick: 10, team: "Cleveland Guardians", position: "RHP", current_level: "AA" },
    { name: "Drew Beam", year: 2023, round: 1, pick: 27, team: "St. Louis Cardinals", position: "RHP", current_level: "AA" },
    { name: "Jordan Beck", year: 2022, round: 1, pick: 38, team: "Colorado Rockies", position: "OF", current_level: "AAA" },
    { name: "Blade Tidwell", year: 2022, round: 2, pick: 52, team: "New York Mets", position: "RHP", current_level: "AA" },
    { name: "Drew Gilbert", year: 2022, round: 1, pick: 28, team: "Houston Astros", position: "OF", current_level: "AAA" },
    { name: "Christian Moore", year: 2024, round: 1, pick: 8, team: "Los Angeles Angels", position: "2B", current_level: "High-A" },
  ],
  "Texas": [
    { name: "Ty Madden", year: 2021, round: 1, pick: 32, team: "Detroit Tigers", position: "RHP", current_level: "AAA" },
    { name: "Ivan Melendez", year: 2022, round: 2, pick: 67, team: "Arizona Diamondbacks", position: "1B", current_level: "AAA" },
    { name: "Tanner Witt", year: 2022, round: 1, pick: 21, team: "Texas Rangers", position: "RHP", current_level: "AA" },
    { name: "Lucas Gordon", year: 2022, round: 3, pick: 95, team: "Chicago White Sox", position: "RHP", current_level: "AA" },
    { name: "Murphy Stehly", year: 2023, round: 5, pick: 154, team: "Kansas City Royals", position: "2B", current_level: "High-A" },
  ],
  "Texas A&M": [
    { name: "Braden Montgomery", year: 2024, round: 1, pick: 12, team: "Boston Red Sox", position: "OF", current_level: "High-A" },
    { name: "Ryan Prager", year: 2024, round: 2, pick: 37, team: "Seattle Mariners", position: "LHP", current_level: "Single-A" },
    { name: "Dylan Rock", year: 2023, round: 5, pick: 155, team: "Philadelphia Phillies", position: "OF", current_level: "High-A" },
    { name: "Jack Moss", year: 2022, round: 6, pick: 184, team: "Oakland Athletics", position: "1B", current_level: "AA" },
    { name: "Austin Bost", year: 2022, round: 7, pick: 219, team: "Tampa Bay Rays", position: "OF", current_level: "High-A" },
  ],
  "Texas Tech": [
    { name: "Jace Jung", year: 2022, round: 1, pick: 12, team: "Detroit Tigers", position: "2B", current_level: "MLB" },
    { name: "Chase Hampton", year: 2022, round: 2, pick: 37, team: "New York Yankees", position: "RHP", current_level: "AA" },
    { name: "Kurt Wilson", year: 2021, round: 5, pick: 149, team: "Kansas City Royals", position: "SS", current_level: "AA" },
    { name: "Austin Green", year: 2024, round: 4, pick: 117, team: "Atlanta Braves", position: "OF", current_level: "Single-A" },
  ],
  "Tulane": [
    { name: "Bennett Lee", year: 2024, round: 3, pick: 82, team: "Baltimore Orioles", position: "C", current_level: "Single-A" },
    { name: "Jared McKenzie", year: 2022, round: 6, pick: 172, team: "Arizona Diamondbacks", position: "OF", current_level: "AA" },
  ],
  "UCLA": [
    { name: "Matt McLain", year: 2021, round: 1, pick: 17, team: "Cincinnati Reds", position: "SS", current_level: "MLB" },
    { name: "Max Rajcic", year: 2023, round: 2, pick: 54, team: "Baltimore Orioles", position: "RHP", current_level: "AA" },
    { name: "Thatcher Hurd", year: 2024, round: 2, pick: 35, team: "New York Mets", position: "RHP", current_level: "High-A" },
    { name: "Kyle Karros", year: 2024, round: 4, pick: 109, team: "San Diego Padres", position: "SS", current_level: "Single-A" },
  ],
  "Vanderbilt": [
    { name: "Jack Leiter", year: 2021, round: 1, pick: 2, team: "Texas Rangers", position: "RHP", current_level: "AAA" },
    { name: "Kumar Rocker", year: 2022, round: 1, pick: 3, team: "Texas Rangers", position: "RHP", current_level: "MLB" },
    { name: "Spencer Jones", year: 2022, round: 1, pick: 25, team: "New York Yankees", position: "OF", current_level: "AAA" },
    { name: "Enrique Bradfield Jr.", year: 2023, round: 1, pick: 17, team: "Milwaukee Brewers", position: "OF", current_level: "AA" },
    { name: "Carter Young", year: 2023, round: 2, pick: 44, team: "San Diego Padres", position: "SS", current_level: "AA" },
    { name: "Dominic Keegan", year: 2022, round: 2, pick: 59, team: "Toronto Blue Jays", position: "C", current_level: "AAA" },
    { name: "Tate Kolwyck", year: 2022, round: 3, pick: 99, team: "Detroit Tigers", position: "2B", current_level: "AA" },
    { name: "CJ Rodriguez", year: 2021, round: 4, pick: 122, team: "Colorado Rockies", position: "C", current_level: "AAA" },
    { name: "Luke Murphy", year: 2022, round: 4, pick: 117, team: "Toronto Blue Jays", position: "RHP", current_level: "AA" },
    { name: "Christian Little", year: 2021, round: 5, pick: 158, team: "Atlanta Braves", position: "RHP", current_level: "AA" },
  ],
  "Virginia": [
    { name: "Griff McGarry", year: 2021, round: 5, pick: 147, team: "Philadelphia Phillies", position: "RHP", current_level: "MLB" },
    { name: "Kyle Teel", year: 2023, round: 1, pick: 14, team: "Boston Red Sox", position: "C", current_level: "AA" },
    { name: "Jake Gelof", year: 2023, round: 2, pick: 65, team: "Oakland Athletics", position: "3B", current_level: "AA" },
    { name: "Ethan Anderson", year: 2023, round: 3, pick: 77, team: "Philadelphia Phillies", position: "SS", current_level: "High-A" },
    { name: "Casey Saucke", year: 2024, round: 2, pick: 38, team: "Toronto Blue Jays", position: "2B", current_level: "Single-A" },
  ],
  "Virginia Tech": [
    { name: "Gavin Cross", year: 2022, round: 1, pick: 9, team: "Kansas City Royals", position: "OF", current_level: "AAA" },
    { name: "Carson DeMartini", year: 2023, round: 3, pick: 94, team: "Colorado Rockies", position: "3B", current_level: "High-A" },
    { name: "Drue Hackenberg", year: 2023, round: 1, pick: 33, team: "Philadelphia Phillies", position: "C", current_level: "AA" },
  ],
  "Wake Forest": [
    { name: "Chase Burns", year: 2024, round: 1, pick: 2, team: "Cincinnati Reds", position: "RHP", current_level: "High-A" },
    { name: "Nick Kurtz", year: 2024, round: 1, pick: 4, team: "Oakland Athletics", position: "1B", current_level: "High-A" },
    { name: "Rhett Lowder", year: 2023, round: 1, pick: 7, team: "Cincinnati Reds", position: "RHP", current_level: "MLB" },
    { name: "Eric Adler", year: 2024, round: 3, pick: 90, team: "Cleveland Guardians", position: "RHP", current_level: "Single-A" },
    { name: "Jake Reinisch", year: 2023, round: 4, pick: 104, team: "Toronto Blue Jays", position: "RHP", current_level: "High-A" },
  ],
  "West Virginia": [
    { name: "JJ Wetherholt", year: 2024, round: 1, pick: 7, team: "St. Louis Cardinals", position: "SS", current_level: "High-A" },
    { name: "Ben Hampton", year: 2024, round: 5, pick: 142, team: "New York Mets", position: "2B", current_level: "Single-A" },
  ],
  "Wichita State": [
    { name: "Pavin Parks", year: 2021, round: 6, pick: 169, team: "Tampa Bay Rays", position: "OF", current_level: "AA" },
  ],
  "Cal Poly": [
    { name: "Brooks Lee", year: 2022, round: 1, pick: 8, team: "Minnesota Twins", position: "SS", current_level: "MLB" },
    { name: "Drew Thorpe", year: 2022, round: 2, pick: 61, team: "New York Yankees", position: "RHP", current_level: "MLB" },
  ],
  "Oregon": [
    { name: "Jacob Walsh", year: 2024, round: 5, pick: 157, team: "Chicago Cubs", position: "RHP", current_level: "Single-A" },
    { name: "Kenyon Yovan", year: 2021, round: 6, pick: 175, team: "Cincinnati Reds", position: "RHP", current_level: "AA" },
  ],
  "Oklahoma": [
    { name: "Jackson Nicklaus", year: 2024, round: 3, pick: 93, team: "Detroit Tigers", position: "3B", current_level: "Single-A" },
    { name: "Cade Horton", year: 2023, round: 1, pick: 7, team: "Chicago Cubs", position: "RHP", current_level: "AAA" },
  ],
};

// Write the JSON file
const outPath = path.join(__dirname, '..', 'src', 'data', 'draft-picks.json');
fs.writeFileSync(outPath, JSON.stringify(draftPicks, null, 2) + '\n');

let totalPicks = 0;
let totalSchools = 0;
for (const [school, picks] of Object.entries(draftPicks)) {
  totalPicks += picks.length;
  totalSchools++;
}
console.log(`Created draft-picks.json: ${totalPicks} players across ${totalSchools} programs`);
