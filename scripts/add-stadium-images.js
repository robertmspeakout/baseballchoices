const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'src', 'data', 'schools.json');
const schools = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Wikipedia Commons stadium images for major college baseball programs
// Format: school name -> image URL
const stadiumImages = {
  "Alabama": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Sewell-Thomas_Stadium_2020.jpg/1280px-Sewell-Thomas_Stadium_2020.jpg",
  "Arizona": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Hi_Corbett_Field%2C_Tucson.jpg/1280px-Hi_Corbett_Field%2C_Tucson.jpg",
  "Arizona State": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Phoenix_Municipal_Stadium.jpg/1280px-Phoenix_Municipal_Stadium.jpg",
  "Arkansas": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Baum_Stadium%2C_Fayetteville%2C_AR.jpg/1280px-Baum_Stadium%2C_Fayetteville%2C_AR.jpg",
  "Auburn": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Plainsman_Park_2011.jpg/1280px-Plainsman_Park_2011.jpg",
  "Baylor": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Baylor_Ballpark_2014.jpg/1280px-Baylor_Ballpark_2014.jpg",
  "Clemson": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Doug_Kingsmore_Stadium.jpg/1280px-Doug_Kingsmore_Stadium.jpg",
  "Florida": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Florida_Ballpark_2021.jpg/1280px-Florida_Ballpark_2021.jpg",
  "Florida State": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Dick_Howser_Stadium.jpg/1280px-Dick_Howser_Stadium.jpg",
  "Georgia": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Foley_Field.jpg/1280px-Foley_Field.jpg",
  "Georgia Tech": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Russ_Chandler_Stadium.jpg/1280px-Russ_Chandler_Stadium.jpg",
  "Kentucky": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Kentucky_Proud_Park.jpg/1280px-Kentucky_Proud_Park.jpg",
  "LSU": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Alex_Box_Stadium_Skip_Bertman_Field.jpg/1280px-Alex_Box_Stadium_Skip_Bertman_Field.jpg",
  "Louisville": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Jim_Patterson_Stadium.jpg/1280px-Jim_Patterson_Stadium.jpg",
  "Miami (FL)": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Alex_Rodriguez_Park_at_Mark_Light_Field.jpg/1280px-Alex_Rodriguez_Park_at_Mark_Light_Field.jpg",
  "Michigan": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Ray_Fisher_Stadium_2015.jpg/1280px-Ray_Fisher_Stadium_2015.jpg",
  "Mississippi State": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Dudy_Noble_Field.jpg/1280px-Dudy_Noble_Field.jpg",
  "NC State": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Doak_Field_at_Dail_Park.jpg/1280px-Doak_Field_at_Dail_Park.jpg",
  "North Carolina": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Boshamer_Stadium_2018.jpg/1280px-Boshamer_Stadium_2018.jpg",
  "Notre Dame": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Frank_Eck_Stadium.jpg/1280px-Frank_Eck_Stadium.jpg",
  "Ohio State": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Bill_Davis_Stadium.jpg/1280px-Bill_Davis_Stadium.jpg",
  "Oklahoma": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/L_Dale_Mitchell_Park.jpg/1280px-L_Dale_Mitchell_Park.jpg",
  "Oklahoma State": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/O%27Brate_Stadium_2021.jpg/1280px-O%27Brate_Stadium_2021.jpg",
  "Ole Miss": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Swayze_Field_2017.jpg/1280px-Swayze_Field_2017.jpg",
  "Oregon State": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Goss_Stadium_at_Coleman_Field.jpg/1280px-Goss_Stadium_at_Coleman_Field.jpg",
  "South Carolina": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Founders_Park_2016.jpg/1280px-Founders_Park_2016.jpg",
  "Stanford": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Klein_Field_at_Sunken_Diamond.jpg/1280px-Klein_Field_at_Sunken_Diamond.jpg",
  "TCU": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Lupton_Stadium_2013.jpg/1280px-Lupton_Stadium_2013.jpg",
  "Tennessee": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Lindsey_Nelson_Stadium_2019.jpg/1280px-Lindsey_Nelson_Stadium_2019.jpg",
  "Texas": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/UFCU_Disch-Falk_Field.jpg/1280px-UFCU_Disch-Falk_Field.jpg",
  "Texas A&M": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Blue_Bell_Park.jpg/1280px-Blue_Bell_Park.jpg",
  "Texas Tech": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Dan_Law_Field_at_Rip_Griffin_Park.jpg/1280px-Dan_Law_Field_at_Rip_Griffin_Park.jpg",
  "UCLA": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Jackie_Robinson_Stadium.jpg/1280px-Jackie_Robinson_Stadium.jpg",
  "Vanderbilt": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Hawkins_Field_%28Vanderbilt%29.jpg/1280px-Hawkins_Field_%28Vanderbilt%29.jpg",
  "Virginia": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Davenport_Field_2018.jpg/1280px-Davenport_Field_2018.jpg",
  "Virginia Tech": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/English_Field_at_Atlantic_Union_Bank_Park.jpg/1280px-English_Field_at_Atlantic_Union_Bank_Park.jpg",
  "Wake Forest": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/David_F._Couch_Ballpark.jpg/1280px-David_F._Couch_Ballpark.jpg",
  "West Virginia": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Monongalia_County_Ballpark.jpg/1280px-Monongalia_County_Ballpark.jpg",
};

let updated = 0;
for (const school of schools) {
  if (stadiumImages[school.name]) {
    school.stadium_image_url = stadiumImages[school.name];
    updated++;
  } else {
    school.stadium_image_url = null;
  }
}

console.log(`Added stadium images for ${updated} out of ${schools.length} schools`);
fs.writeFileSync(dataPath, JSON.stringify(schools, null, 2) + '\n');
console.log('schools.json updated.');
