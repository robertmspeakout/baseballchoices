import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "baseball.db");
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

db.exec(`
  DROP TABLE IF EXISTS user_school_data;
  DROP TABLE IF EXISTS schools;

  CREATE TABLE schools (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    mascot TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    latitude REAL,
    longitude REAL,
    division TEXT NOT NULL,
    public_private TEXT,
    conference TEXT,
    current_ranking INTEGER,
    tuition INTEGER,
    instagram TEXT,
    x_account TEXT,
    head_coach_name TEXT,
    head_coach_email TEXT,
    assistant_coach_name TEXT,
    assistant_coach_email TEXT,
    website TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE user_school_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    school_id INTEGER NOT NULL UNIQUE,
    priority INTEGER DEFAULT 0 CHECK(priority >= 0 AND priority <= 5),
    notes TEXT DEFAULT '',
    last_contacted DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools(id)
  );

  CREATE INDEX idx_schools_division ON schools(division);
  CREATE INDEX idx_schools_state ON schools(state);
  CREATE INDEX idx_schools_conference ON schools(conference);
  CREATE INDEX idx_schools_name ON schools(name);
`);

// Compact row format: [name, mascot, city, state, zip, lat, lng, pub/priv, conference, ranking|null, tuition, instagram, xAccount, headCoach, coachEmail, asstCoach, asstEmail, website]
type R = [string,string,string,string,string,number,number,string,string,number|null,number,string,string,string,string,string,string,string];

const schools: R[] = [
  // ========================= SEC (16) =========================
  ["LSU","Tigers","Baton Rouge","LA","70803",30.413,-91.180,"Public","SEC",1,11962,"@lsubaseball","@LSUbaseball","Jay Johnson","baseball@lsu.edu","Dan Fitzgerald","baseball@lsu.edu","https://lsusports.net/sports/baseball"],
  ["Tennessee","Volunteers","Knoxville","TN","37996",35.954,-83.930,"Public","SEC",2,13244,"@vol_baseball","@Vol_Baseball","Tony Vitello","baseball@utk.edu","Josh Elander","baseball@utk.edu","https://utsports.com/sports/baseball"],
  ["Texas A&M","Aggies","College Station","TX","77843",30.619,-96.337,"Public","SEC",3,12413,"@aggiebaseball","@AggieBaseball","Jim Schlossnagle","baseball@athletics.tamu.edu","Nate Thompson","baseball@athletics.tamu.edu","https://12thman.com/sports/baseball"],
  ["Florida","Gators","Gainesville","FL","32611",29.652,-82.325,"Public","SEC",4,6380,"@gatorsbb","@GatorsBB","Kevin O'Sullivan","baseball@gators.ufl.edu","Craig Bell","baseball@gators.ufl.edu","https://floridagators.com/sports/baseball"],
  ["Vanderbilt","Commodores","Nashville","TN","37240",36.145,-86.803,"Private","SEC",5,60348,"@vandybaseball","@VandyBoys","Tim Corbin","baseball@vanderbilt.edu","Mike Baxter","baseball@vanderbilt.edu","https://vucommodores.com/sports/baseball"],
  ["Texas","Longhorns","Austin","TX","78712",30.285,-97.734,"Public","SEC",6,11448,"@texasbaseball","@TexasBaseball","David Pierce","baseball@athletics.utexas.edu","Sean Allen","baseball@athletics.utexas.edu","https://texassports.com/sports/baseball"],
  ["Arkansas","Razorbacks","Fayetteville","AR","72701",36.068,-94.175,"Public","SEC",8,9658,"@razorbackbsb","@RazorbackBSB","Dave Van Horn","baseball@uark.edu","Nate Thompson","baseball@uark.edu","https://arkansasrazorbacks.com/sports/baseball"],
  ["Ole Miss","Rebels","Oxford","MS","38677",34.367,-89.519,"Public","SEC",10,8790,"@olemissbaseball","@OleMissBSB","Mike Bianco","baseball@olemiss.edu","Mike Federico","baseball@olemiss.edu","https://olemisssports.com/sports/baseball"],
  ["Mississippi State","Bulldogs","Starkville","MS","39762",33.456,-88.789,"Public","SEC",15,9258,"@hailstatebs","@HailStateBB","Chris Lemonis","baseball@msstate.edu","Jake Gautreau","baseball@msstate.edu","https://hailstate.com/sports/baseball"],
  ["South Carolina","Gamecocks","Columbia","SC","29208",33.994,-81.027,"Public","SEC",18,12688,"@gamecockbsb","@GamecockBaseb1","Mark Kingston","baseball@sc.edu","Trip Couch","baseball@sc.edu","https://gamecocksonline.com/sports/baseball"],
  ["Auburn","Tigers","Auburn","AL","36849",32.601,-85.490,"Public","SEC",20,11826,"@auburnbaseball","@AuburnBaseball","Butch Thompson","baseball@auburn.edu","Karl Nonemaker","baseball@auburn.edu","https://auburntigers.com/sports/baseball"],
  ["Georgia","Bulldogs","Athens","GA","30602",33.948,-83.377,"Public","SEC",22,12080,"@ugabaseball","@BaseballUGA","Wes Johnson","baseball@uga.edu","Sean Kenny","baseball@uga.edu","https://georgiadogs.com/sports/baseball"],
  ["Alabama","Crimson Tide","Tuscaloosa","AL","35487",33.210,-87.569,"Public","SEC",null,11100,"@alabamabsb","@AlabamaBSB","Rob Vaughn","baseball@ua.edu","Jason Jackson","baseball@ua.edu","https://rolltide.com/sports/baseball"],
  ["Kentucky","Wildcats","Lexington","KY","40506",38.032,-84.504,"Public","SEC",null,12360,"@ukbaseball","@UKBaseball","Nick Mingione","baseball@uky.edu","Todd Guilliams","baseball@uky.edu","https://ukathletics.com/sports/baseball"],
  ["Missouri","Tigers","Columbia","MO","65211",38.940,-92.328,"Public","SEC",null,11506,"@maborizzoubaseball","@MizzouBaseball","Steve Bieser","baseball@missouri.edu","Jeric Ciccarello","baseball@missouri.edu","https://mutigers.com/sports/baseball"],
  ["Oklahoma","Sooners","Norman","OK","73019",35.223,-97.440,"Public","SEC",null,11338,"@ou_baseball","@OU_Baseball","Skip Johnson","baseball@ou.edu","Clay Van Hook","baseball@ou.edu","https://soonersports.com/sports/baseball"],

  // ========================= ACC (18) =========================
  ["Wake Forest","Demon Deacons","Winston-Salem","NC","27109",36.134,-80.278,"Private","ACC",7,61788,"@waborakeforestbb","@WakeBaseball","Tom Walter","baseball@wfu.edu","Bill Cilento","baseball@wfu.edu","https://godeacs.com/sports/baseball"],
  ["Virginia","Cavaliers","Charlottesville","VA","22904",38.034,-78.508,"Public","ACC",9,19014,"@uvabaseball","@UVABaseball","Brian O'Connor","baseball@virginia.edu","Drew Dickinson","baseball@virginia.edu","https://virginiasports.com/sports/baseball"],
  ["Clemson","Tigers","Clemson","SC","29634",34.683,-82.837,"Public","ACC",11,15558,"@clemsonbaseball","@ClemsonBaseball","Erik Bakich","baseball@clemson.edu","Andrew See","baseball@clemson.edu","https://clemsontigers.com/sports/baseball"],
  ["Florida State","Seminoles","Tallahassee","FL","32306",30.442,-84.299,"Public","ACC",12,6517,"@fsub_baseball","@FSUBaseball","Link Jarrett","baseball@fsu.edu","Mike Martin Jr.","baseball@fsu.edu","https://seminoles.com/sports/baseball"],
  ["Miami (FL)","Hurricanes","Coral Gables","FL","33146",25.722,-80.268,"Private","ACC",13,57194,"@canesbaseball","@CanesBaseball","Gino DiMare","baseball@miami.edu","Norberto Lopez","baseball@miami.edu","https://miamihurricanes.com/sports/baseball"],
  ["NC State","Wolfpack","Raleigh","NC","27695",35.787,-78.671,"Public","ACC",14,9128,"@packbaseball","@NCStateBaseball","Elliott Avent","baseball@ncsu.edu","Chris Hart","baseball@ncsu.edu","https://gopack.com/sports/baseball"],
  ["North Carolina","Tar Heels","Chapel Hill","NC","27599",35.905,-79.047,"Public","ACC",16,8980,"@diamondheels","@DiamondHeels","Scott Forbes","baseball@unc.edu","Jesse Wierzbicki","baseball@unc.edu","https://goheels.com/sports/baseball"],
  ["Louisville","Cardinals","Louisville","KY","40292",38.212,-85.758,"Public","ACC",17,12246,"@louisvillebsb","@LouisvilleBSB","Dan McDonnell","baseball@louisville.edu","Roger Williams","baseball@louisville.edu","https://gocards.com/sports/baseball"],
  ["Stanford","Cardinal","Stanford","CA","94305",37.428,-122.170,"Private","ACC",19,61731,"@stanfordbase","@StanfordBSB","David Esquer","baseball@stanford.edu","Thomas Eager","baseball@stanford.edu","https://gostanford.com/sports/baseball"],
  ["Duke","Blue Devils","Durham","NC","27708",36.001,-78.938,"Private","ACC",null,63054,"@dukebaseball","@DukeBASE","Chris Pollard","baseball@duke.edu","Josh Jordan","baseball@duke.edu","https://goduke.com/sports/baseball"],
  ["Georgia Tech","Yellow Jackets","Atlanta","GA","30332",33.776,-84.396,"Public","ACC",null,12682,"@gtbaseball","@GTBaseball","Danny Hall","baseball@athletics.gatech.edu","James Ramsey","baseball@athletics.gatech.edu","https://ramblinwreck.com/sports/baseball"],
  ["Virginia Tech","Hokies","Blacksburg","VA","24061",37.230,-80.414,"Public","ACC",null,14066,"@hokiesbaseball","@HokiesBaseball","John Szefc","baseball@vt.edu","Ryan Fecteau","baseball@vt.edu","https://hokiesports.com/sports/baseball"],
  ["Pittsburgh","Panthers","Pittsburgh","PA","15260",40.444,-79.961,"Public","ACC",null,19718,"@pittbaseball","@Pitt_BASE","Mike Bell","baseball@athletics.pitt.edu","Pat Livingston","baseball@athletics.pitt.edu","https://pittsburghpanthers.com/sports/baseball"],
  ["Notre Dame","Fighting Irish","Notre Dame","IN","46556",41.700,-86.238,"Private","ACC",null,60301,"@ndbaseball","@NDBaseball","Shawn Stiffler","baseball@nd.edu","Rich Wallace","baseball@nd.edu","https://und.com/sports/baseball"],
  ["Boston College","Eagles","Chestnut Hill","MA","02467",42.336,-71.169,"Private","ACC",null,62950,"@bcbaseball","@BCBirdball","Mike Gambino","baseball@bc.edu","Alex Trahan","baseball@bc.edu","https://bceagles.com/sports/baseball"],
  ["California","Golden Bears","Berkeley","CA","94720",37.872,-122.259,"Public","ACC",null,14312,"@calbaseball","@CalBaseball","Mike Neu","baseball@cal.berkeley.edu","David Nakama","baseball@cal.berkeley.edu","https://calbears.com/sports/baseball"],
  ["SMU","Mustangs","Dallas","TX","75205",32.843,-96.785,"Private","ACC",null,61510,"@smubaseball","@SMUBaseball","Travis Jewett","baseball@smu.edu","Danny Clark","baseball@smu.edu","https://smumustangs.com/sports/baseball"],
  ["Syracuse","Orange","Syracuse","NY","13244",43.039,-76.135,"Private","ACC",null,59534,"@cusebaseball","@CuseBaseball","Jono Armand","baseball@syr.edu","Kevin Connolly","baseball@syr.edu","https://cuse.com/sports/baseball"],

  // ========================= BIG 12 (15) =========================
  ["TCU","Horned Frogs","Fort Worth","TX","76129",32.710,-97.363,"Private","Big 12",21,55760,"@tcubaseball","@TCU_Baseball","Kirk Saarloos","baseball@tcu.edu","Bill Mosiello","baseball@tcu.edu","https://gofrogs.com/sports/baseball"],
  ["Oklahoma State","Cowboys","Stillwater","OK","74078",36.116,-97.058,"Public","Big 12",23,9018,"@cowboybaseball","@OSUBaseball","Josh Holliday","baseball@okstate.edu","Marty Lees","baseball@okstate.edu","https://okstate.com/sports/baseball"],
  ["West Virginia","Mountaineers","Morgantown","WV","26506",39.630,-79.956,"Public","Big 12",null,9504,"@wvubaseball","@WVUBaseball","Randy Mazey","baseball@mail.wvu.edu","Steve Sabins","baseball@mail.wvu.edu","https://wvusports.com/sports/baseball"],
  ["Kansas State","Wildcats","Manhattan","KS","66506",39.184,-96.572,"Public","Big 12",null,10383,"@kstatebaseball","@KStateBSB","Pete Hughes","baseball@kstatesports.com","Matt Angle","baseball@kstatesports.com","https://kstatesports.com/sports/baseball"],
  ["Texas Tech","Red Raiders","Lubbock","TX","79409",33.584,-101.846,"Public","Big 12",null,11100,"@taborechbaseball","@TTU_Baseball","Tim Tadlock","baseball@ttu.edu","J-Bob Thomas","baseball@ttu.edu","https://texastech.com/sports/baseball"],
  ["Baylor","Bears","Waco","TX","76798",31.549,-97.113,"Private","Big 12",null,52348,"@baylorbaseball","@BaylorBaseball","Mitch Thompson","baseball@baylor.edu","Jon Strauss","baseball@baylor.edu","https://baylorbears.com/sports/baseball"],
  ["UCF","Knights","Orlando","FL","32816",28.602,-81.200,"Public","Big 12",null,6368,"@ucf_baseball","@UCF_Baseball","Greg Lovelady","baseball@ucf.edu","Nick Ayers","baseball@ucf.edu","https://ucfknights.com/sports/baseball"],
  ["Houston","Cougars","Houston","TX","77204",29.720,-95.342,"Public","Big 12",null,11590,"@uhcougarbb","@UHCougarBB","Todd Whitting","baseball@uh.edu","Trip Couch","baseball@uh.edu","https://uhcougars.com/sports/baseball"],
  ["BYU","Cougars","Provo","UT","84602",40.252,-111.649,"Private","Big 12",null,6496,"@byubaseball","@BYUBaseball","Trent Pratt","baseball@byu.edu","Brent Haring","baseball@byu.edu","https://byucougars.com/sports/baseball"],
  ["Cincinnati","Bearcats","Cincinnati","OH","45221",39.133,-84.515,"Public","Big 12",null,11000,"@gobearcatsbsb","@GoBEARCATSBSB","Connor Barth","baseball@uc.edu","Dan Bautista","baseball@uc.edu","https://gobearcats.com/sports/baseball"],
  ["Arizona State","Sun Devils","Tempe","AZ","85287",33.424,-111.928,"Public","Big 12",null,11338,"@sundevilbsb","@ASU_Baseball","Willie Bloomquist","baseball@asu.edu","Michael Early","baseball@asu.edu","https://thesundevils.com/sports/baseball"],
  ["Arizona","Wildcats","Tucson","AZ","85721",32.232,-110.950,"Public","Big 12",null,12467,"@arizonabaseball","@ArizonaBaseball","Chip Hale","baseball@arizona.edu","Dave Lawn","baseball@arizona.edu","https://arizonawildcats.com/sports/baseball"],
  ["Colorado","Buffaloes","Boulder","CO","80309",40.008,-105.266,"Public","Big 12",null,12500,"@cubuffsbaseball","@CUBuffsBaseball","Mike Main","baseball@colorado.edu","Ryan Garvey","baseball@colorado.edu","https://cubuffs.com/sports/baseball"],
  ["Utah","Utes","Salt Lake City","UT","84112",40.765,-111.842,"Public","Big 12",null,9222,"@utahbaseball","@Utah_Baseball","Gary Henderson","baseball@utah.edu","Adam Pavkovich","baseball@utah.edu","https://utahutes.com/sports/baseball"],
  ["Kansas","Jayhawks","Lawrence","KS","66045",38.954,-95.256,"Public","Big 12",null,11148,"@kubaseball","@KUBaseball","Dan Fitzgerald","baseball@ku.edu","Ryan Graves","baseball@ku.edu","https://kuathletics.com/sports/baseball"],

  // ========================= BIG TEN (18) =========================
  ["Oregon State","Beavers","Corvallis","OR","97331",44.565,-123.262,"Public","Big Ten",24,11715,"@beaverbaseball","@BeaverBaseball","Mitch Canham","baseball@oregonstate.edu","Rich Dorman","baseball@oregonstate.edu","https://osubeavers.com/sports/baseball"],
  ["Michigan","Wolverines","Ann Arbor","MI","48109",42.278,-83.738,"Public","Big Ten",null,16312,"@umichbaseball","@umichbaseball","Erik Bakich","baseball@umich.edu","Nick Schnabel","baseball@umich.edu","https://mgoblue.com/sports/baseball"],
  ["Indiana","Hoosiers","Bloomington","IN","47405",39.168,-86.519,"Public","Big Ten",null,10708,"@indianabsb","@IndianaBase","Jeff Mercer","baseball@indiana.edu","Morgan Hopewell","baseball@indiana.edu","https://iuhoosiers.com/sports/baseball"],
  ["Ohio State","Buckeyes","Columbus","OH","43210",40.007,-83.031,"Public","Big Ten",null,11936,"@ohiostatebaseball","@OhioStateBASE","Bill Mosiello","baseball@osu.edu","Matt Carpenter","baseball@osu.edu","https://ohiostatebuckeyes.com/sports/baseball"],
  ["Nebraska","Cornhuskers","Lincoln","NE","68588",40.820,-96.701,"Public","Big Ten",null,9242,"@huskerbaseball","@Husker_Baseball","Will Bolt","baseball@huskers.com","Jeff Christy","baseball@huskers.com","https://huskers.com/sports/baseball"],
  ["Maryland","Terrapins","College Park","MD","20742",38.986,-76.945,"Public","Big Ten",null,10779,"@terpsbaseball","@TerpsBaseball","Matt Swope","baseball@umd.edu","Corey Muscara","baseball@umd.edu","https://umterps.com/sports/baseball"],
  ["Iowa","Hawkeyes","Iowa City","IA","52242",41.661,-91.530,"Public","Big Ten",null,9942,"@uiowabaseball","@UIBaseball","Rick Heller","baseball@hawkeyesports.com","Marty Sutherland","baseball@hawkeyesports.com","https://hawkeyesports.com/sports/baseball"],
  ["Minnesota","Golden Gophers","Minneapolis","MN","55455",44.974,-93.228,"Public","Big Ten",null,15027,"@gopherbaseball","@GopherBaseball","Ty Johnson","baseball@umn.edu","Garza Roberts","baseball@umn.edu","https://gophersports.com/sports/baseball"],
  ["Penn State","Nittany Lions","University Park","PA","16802",40.798,-77.860,"Public","Big Ten",null,18898,"@pennstatebaseball","@PennStateBASE","Rob Cooper","baseball@psu.edu","Tyler Etcheberry","baseball@psu.edu","https://gopsusports.com/sports/baseball"],
  ["Michigan State","Spartans","East Lansing","MI","48824",42.702,-84.482,"Public","Big Ten",null,14460,"@msu_baseball","@MSU_Baseball","Adam Nightingale","baseball@ath.msu.edu","Graham Sikes","baseball@ath.msu.edu","https://msuspartans.com/sports/baseball"],
  ["Purdue","Boilermakers","West Lafayette","IN","47907",40.424,-86.921,"Public","Big Ten",null,9992,"@purduebaseball","@PurdueBaseball","Greg Goff","baseball@purdue.edu","Ryan Hesters","baseball@purdue.edu","https://purduesports.com/sports/baseball"],
  ["Rutgers","Scarlet Knights","Piscataway","NJ","08854",40.501,-74.447,"Public","Big Ten",null,15407,"@rutgersbaseball","@RutgersBase","Steve Owens","baseball@scarletknights.com","Phil Cundari","baseball@scarletknights.com","https://scarletknights.com/sports/baseball"],
  ["Northwestern","Wildcats","Evanston","IL","60208",42.057,-87.675,"Private","Big Ten",null,63468,"@nubaseball","@NUCatsBaseball","Jim Foster","baseball@northwestern.edu","Josh Reynolds","baseball@northwestern.edu","https://nusports.com/sports/baseball"],
  ["Illinois","Fighting Illini","Champaign","IL","61820",40.102,-88.227,"Public","Big Ten",null,15094,"@illinoisbaseball","@IlliniBaseball","Dan Hartleb","baseball@illinois.edu","Drew Dickinson","baseball@illinois.edu","https://fightingillini.com/sports/baseball"],
  ["USC","Trojans","Los Angeles","CA","90089",34.022,-118.285,"Private","Big Ten",null,64726,"@usc_baseball","@USC_Baseball","Jason Gill","baseball@usc.edu","Ted Silva","baseball@usc.edu","https://usctrojans.com/sports/baseball"],
  ["UCLA","Bruins","Los Angeles","CA","90095",34.069,-118.445,"Public","Big Ten",null,13804,"@uclabaseball","@UCLABaseball","John Savage","baseball@athletics.ucla.edu","Rex Peters","baseball@athletics.ucla.edu","https://uclabruins.com/sports/baseball"],
  ["Washington","Huskies","Seattle","WA","98195",47.655,-122.304,"Public","Big Ten",null,12076,"@uw_baseball","@UW_Baseball","Jason Kelly","baseball@uw.edu","Elliott Cribby","baseball@uw.edu","https://gohuskies.com/sports/baseball"],
  ["Oregon","Ducks","Eugene","OR","97403",44.045,-123.073,"Public","Big Ten",null,12720,"@oregonbaseball","@OregonBaseball","Mark Wasikowski","baseball@uoregon.edu","Jake Angier","baseball@uoregon.edu","https://goducks.com/sports/baseball"],

  // ========================= AAC (14) =========================
  ["East Carolina","Pirates","Greenville","NC","27858",35.613,-77.366,"Public","American Athletic",null,7272,"@ecubaseball","@ECUBaseball","Cliff Godwin","baseball@ecu.edu","Jeff Palumbo","baseball@ecu.edu","https://ecupirates.com/sports/baseball"],
  ["Tulane","Green Wave","New Orleans","LA","70118",29.940,-90.120,"Private","American Athletic",null,60814,"@tulanebaseball","@GreenWaveBSB","Travis Jewett","baseball@tulane.edu","Eddie Smith","baseball@tulane.edu","https://tulanegreenwave.com/sports/baseball"],
  ["Wichita State","Shockers","Wichita","KS","67260",37.718,-97.292,"Public","American Athletic",null,8367,"@goshockersbsb","@GoShockersBSB","Brian Green","baseball@goshockers.com","Mike Sirianni","baseball@goshockers.com","https://goshockers.com/sports/baseball"],
  ["Memphis","Tigers","Memphis","TN","38152",35.119,-89.937,"Public","American Athletic",null,9817,"@memphisbaseball","@MemphisBase","Kerrick Jackson","baseball@memphis.edu","Jeremy Baughman","baseball@memphis.edu","https://gotigersgo.com/sports/baseball"],
  ["Rice","Owls","Houston","TX","77005",29.717,-95.400,"Private","American Athletic",null,54960,"@ricebaseball","@RiceBaseball","Jose Cruz Jr.","baseball@rice.edu","Paul Janish","baseball@rice.edu","https://riceowls.com/sports/baseball"],
  ["Charlotte","49ers","Charlotte","NC","28223",35.306,-80.729,"Public","American Athletic",null,7338,"@charlotte49ersbsb","@Charlotte49erBB","Robert Woodard","baseball@charlotte.edu","Toby Bicknell","baseball@charlotte.edu","https://charlotte49ers.com/sports/baseball"],
  ["FAU","Owls","Boca Raton","FL","33431",26.373,-80.101,"Public","American Athletic",null,6039,"@faubaseball","@FAUBaseball","Dustin Pease","baseball@fau.edu","Greg Deiros","baseball@fau.edu","https://fausports.com/sports/baseball"],
  ["Navy","Midshipmen","Annapolis","MD","21402",38.984,-76.484,"Public","American Athletic",null,0,"@navybaseball","@NavyBaseball","Paul Kostacopoulos","baseball@usna.edu","Bobby Applegate","baseball@usna.edu","https://navysports.com/sports/baseball"],
  ["North Texas","Mean Green","Denton","TX","76203",33.211,-97.149,"Public","American Athletic",null,11190,"@meangreenbsb","@MeanGreenBSB","Eric Musselman","baseball@unt.edu","Lane Holliday","baseball@unt.edu","https://meangreensports.com/sports/baseball"],
  ["South Florida","Bulls","Tampa","FL","33620",28.062,-82.413,"Public","American Athletic",null,6410,"@usfbaseball","@USFBaseball","Billy Mohl","baseball@usf.edu","Matt Henderson","baseball@usf.edu","https://gousfbulls.com/sports/baseball"],
  ["Temple","Owls","Philadelphia","PA","19122",39.981,-75.155,"Public","American Athletic",null,17768,"@templebaseball","@Temple_BSB","Ryan Wheeler","baseball@temple.edu","Brian Girard","baseball@temple.edu","https://owlsports.com/sports/baseball"],
  ["Tulsa","Golden Hurricane","Tulsa","OK","74104",36.152,-95.946,"Private","American Athletic",null,44862,"@tulsabaseball","@TulsaHurricane","Todd Butler","baseball@utulsa.edu","Nic Constantino","baseball@utulsa.edu","https://tulsahurricane.com/sports/baseball"],
  ["UAB","Blazers","Birmingham","AL","35294",33.502,-86.799,"Public","American Athletic",null,8568,"@uabbaseball","@UAB_BSB","Casey Dunn","baseball@uab.edu","Will Startup","baseball@uab.edu","https://uabsports.com/sports/baseball"],
  ["UTSA","Roadrunners","San Antonio","TX","78249",29.583,-98.619,"Public","American Athletic",null,10400,"@utsabaseball","@UTSABSB","Pat Hallmark","baseball@utsa.edu","Daniel Saenz","baseball@utsa.edu","https://goutsa.com/sports/baseball"],

  // ========================= SUN BELT (14) =========================
  ["Coastal Carolina","Chanticleers","Conway","SC","29528",33.795,-79.014,"Public","Sun Belt",null,12060,"@ccubaseball","@CoastalBaseball","Gary Gilmore","baseball@coastal.edu","Drew Thomas","baseball@coastal.edu","https://goccusports.com/sports/baseball"],
  ["Louisiana","Ragin' Cajuns","Lafayette","LA","70504",30.210,-92.020,"Public","Sun Belt",null,10584,"@raginbaseball","@RaginCajunsBSB","Matt Deggs","baseball@louisiana.edu","Anthony Babineaux","baseball@louisiana.edu","https://ragincajuns.com/sports/baseball"],
  ["Georgia Southern","Eagles","Statesboro","GA","30458",32.423,-81.783,"Public","Sun Belt",null,6234,"@gaboraseaglesbsb","@GSAthletics_BSB","Rodney Hennon","baseball@georgiasouthern.edu","A.J. Battisto","baseball@georgiasouthern.edu","https://gseagles.com/sports/baseball"],
  ["Southern Miss","Golden Eagles","Hattiesburg","MS","39406",31.327,-89.338,"Public","Sun Belt",null,9316,"@southernmissbs","@SouthernMissBSB","Scott Berry","baseball@usm.edu","Travis Creel","baseball@usm.edu","https://southernmiss.com/sports/baseball"],
  ["Appalachian State","Mountaineers","Boone","NC","28608",36.217,-81.685,"Public","Sun Belt",null,7862,"@appstbaseball","@AppBaseball","Kermit Smith","baseball@appstate.edu","Josh White","baseball@appstate.edu","https://appstatesports.com/sports/baseball"],
  ["Arkansas State","Red Wolves","Jonesboro","AR","72467",35.843,-90.683,"Public","Sun Belt",null,9400,"@astatebaseball","@AStateBSB","Tommy Raffo","baseball@astate.edu","Alex Jefferson","baseball@astate.edu","https://astateredwolves.com/sports/baseball"],
  ["Georgia State","Panthers","Atlanta","GA","30303",33.753,-84.389,"Public","Sun Belt",null,10858,"@gastatebsb","@GaStateBSB","Brad Stromdahl","baseball@gsu.edu","Kevin Erminio","baseball@gsu.edu","https://georgiastatesports.com/sports/baseball"],
  ["James Madison","Dukes","Harrisonburg","VA","22807",38.435,-78.869,"Public","Sun Belt",null,12246,"@jmubaseball","@JMUBaseball","Marlin Ikenberry","baseball@jmu.edu","Jay Martinez","baseball@jmu.edu","https://jmusports.com/sports/baseball"],
  ["Louisiana-Monroe","Warhawks","Monroe","LA","71209",32.529,-92.069,"Public","Sun Belt",null,9375,"@ulmbaseball","@ULM_BSB","Michael Federico","baseball@ulm.edu","Blake Wiley","baseball@ulm.edu","https://ulmwarhawks.com/sports/baseball"],
  ["Marshall","Thundering Herd","Huntington","WV","25755",38.424,-82.432,"Public","Sun Belt",null,8876,"@herdbsb","@HerdBSB","Greg Hendricks","baseball@marshall.edu","Tim Donnelly","baseball@marshall.edu","https://herdzone.com/sports/baseball"],
  ["Old Dominion","Monarchs","Norfolk","VA","23529",36.885,-76.305,"Public","Sun Belt",null,11000,"@odubaseball","@ODUBaseball","Chris Finwood","baseball@odu.edu","Mike Marron","baseball@odu.edu","https://odusports.com/sports/baseball"],
  ["South Alabama","Jaguars","Mobile","AL","36688",30.696,-88.178,"Public","Sun Belt",null,7800,"@southalbaseball","@SouthAlabamaBSB","Mark Calvi","baseball@southalabama.edu","Ronnie Sams","baseball@southalabama.edu","https://usajaguars.com/sports/baseball"],
  ["Texas State","Bobcats","San Marcos","TX","78666",29.888,-97.938,"Public","Sun Belt",null,11218,"@txstbaseball","@TxStateBSB","Steven Trout","baseball@txstate.edu","Chad Massengale","baseball@txstate.edu","https://txstatebobcats.com/sports/baseball"],
  ["Troy","Trojans","Troy","AL","36082",31.796,-85.968,"Public","Sun Belt",null,12744,"@troybsb","@TroyTrojansBSB","Skylar Meade","baseball@troy.edu","Drew Boyd","baseball@troy.edu","https://troytrojans.com/sports/baseball"],

  // ========================= CONFERENCE USA (10) =========================
  ["Liberty","Flames","Lynchburg","VA","24515",37.353,-79.182,"Private","Conference USA",null,24800,"@libertybaseball","@LibertyBSB","Scott Jackson","baseball@liberty.edu","Tim Benkert","baseball@liberty.edu","https://libertyflames.com/sports/baseball"],
  ["Louisiana Tech","Bulldogs","Ruston","LA","71272",32.529,-92.638,"Public","Conference USA",null,9705,"@latechbsb","@LATechBSB","Lane Burroughs","baseball@latech.edu","Chris Frey","baseball@latech.edu","https://latechsports.com/sports/baseball"],
  ["Sam Houston","Bearkats","Huntsville","TX","77341",30.715,-95.540,"Public","Conference USA",null,8896,"@bearkatsbsb","@BearkatsBSB","Jay Sirianni","baseball@shsu.edu","Philip Miller","baseball@shsu.edu","https://gobearkats.com/sports/baseball"],
  ["Western Kentucky","Hilltoppers","Bowling Green","KY","42101",36.990,-86.443,"Public","Conference USA",null,10826,"@wkubaseball","@WKUBaseball","John Pawlowski","baseball@wku.edu","Rob Reinstetle","baseball@wku.edu","https://wkusports.com/sports/baseball"],
  ["Middle Tennessee","Blue Raiders","Murfreesboro","TN","37132",35.850,-86.368,"Public","Conference USA",null,9108,"@mt_baseball","@MT_Baseball","Jim McGuire","baseball@mtsu.edu","Travis Janssen","baseball@mtsu.edu","https://goblueraiders.com/sports/baseball"],
  ["Jacksonville State","Gamecocks","Jacksonville","AL","36265",33.822,-85.764,"Public","Conference USA",null,10200,"@jaxstatebaseball","@JSUGamecockBSB","Jim Case","baseball@jsu.edu","Haston Forkner","baseball@jsu.edu","https://jsugamecocksports.com/sports/baseball"],
  ["FIU","Panthers","Miami","FL","33199",25.756,-80.374,"Public","Conference USA",null,6556,"@fiubaseball","@FIUBaseball","Mervyl Melendez","baseball@fiu.edu","Kris Clemente","baseball@fiu.edu","https://fiusports.com/sports/baseball"],
  ["Kennesaw State","Owls","Kennesaw","GA","30144",34.037,-84.582,"Public","Conference USA",null,7326,"@ksuowlsbsb","@KSUOwlsBSB","Ryan Coe","baseball@kennesaw.edu","Brian Anderson","baseball@kennesaw.edu","https://ksuowls.com/sports/baseball"],
  ["New Mexico State","Aggies","Las Cruces","NM","88003",32.350,-106.756,"Public","Conference USA",null,7582,"@nmstatebaseball","@NMStateBaseball","Mike Kirby","baseball@nmsu.edu","Sergio Sanchez","baseball@nmsu.edu","https://nmstatesports.com/sports/baseball"],
  ["UTEP","Miners","El Paso","TX","79968",31.770,-106.504,"Public","Conference USA",null,8572,"@utepbaseball","@UTEPBSB","Bryan Prince","baseball@utep.edu","Tyler Collins","baseball@utep.edu","https://utepminers.com/sports/baseball"],

  // ========================= BIG EAST (9) =========================
  ["Connecticut","Huskies","Storrs","CT","06269",41.808,-72.250,"Public","Big East",null,17226,"@uconnbsb","@UConnBSB","Jim Penders","baseball@uconn.edu","Jeff Hourigan","baseball@uconn.edu","https://uconnhuskies.com/sports/baseball"],
  ["Creighton","Bluejays","Omaha","NE","68178",41.257,-95.935,"Private","Big East",null,44580,"@creightonbaseball","@CREIGHTONbball","Ed Servais","baseball@creighton.edu","Connor Gandossy","baseball@creighton.edu","https://gocreighton.com/sports/baseball"],
  ["Xavier","Musketeers","Cincinnati","OH","45207",39.149,-84.473,"Private","Big East",null,44890,"@xavierbaseball","@XavierBASE","Billy O'Conner","baseball@xavier.edu","Nick Otte","baseball@xavier.edu","https://goxavier.com/sports/baseball"],
  ["Villanova","Wildcats","Villanova","PA","19085",40.037,-75.338,"Private","Big East",null,59800,"@novabaseball","@NovaBaseball","Kevin Mulvey","baseball@villanova.edu","Dan Iachini","baseball@villanova.edu","https://villanova.com/sports/baseball"],
  ["St. John's","Red Storm","Queens","NY","11439",40.726,-73.795,"Private","Big East",null,48510,"@stjohnsbaseball","@StJohnsBBall","Mike Hampton","baseball@stjohns.edu","Danny Bethea","baseball@stjohns.edu","https://redstormsports.com/sports/baseball"],
  ["Seton Hall","Pirates","South Orange","NJ","07079",40.743,-74.265,"Private","Big East",null,51300,"@shupiratesbb","@SHUPiratesBB","Rob Sheppard","baseball@shu.edu","Mike Gibbons","baseball@shu.edu","https://shupirates.com/sports/baseball"],
  ["Georgetown","Hoyas","Washington","DC","20057",38.908,-77.072,"Private","Big East",null,62052,"@georgetownbsb","@Georgetown_BSB","Edwin Thompson","baseball@georgetown.edu","Matt Herr","baseball@georgetown.edu","https://guhoyas.com/sports/baseball"],
  ["Butler","Bulldogs","Indianapolis","IN","46208",39.839,-86.170,"Private","Big East",null,47310,"@butlerbaseball","@ButlerUBaseball","David Jorn","baseball@butler.edu","Adam Weiss","baseball@butler.edu","https://butlersports.com/sports/baseball"],
  ["Providence","Friars","Providence","RI","02918",41.839,-71.436,"Private","Big East",null,57400,"@pcfriarsbb","@PCFriarsBB","Robbie Berger","baseball@providence.edu","Tyler Mons","baseball@providence.edu","https://friars.com/sports/baseball"],
];

const insert = db.prepare(`
  INSERT INTO schools (name, mascot, city, state, zip, latitude, longitude, division, public_private, conference, current_ranking, tuition, instagram, x_account, head_coach_name, head_coach_email, assistant_coach_name, assistant_coach_email, website)
  VALUES (?, ?, ?, ?, ?, ?, ?, 'D1', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertMany = db.transaction((rows: R[]) => {
  for (const r of rows) {
    insert.run(r[0],r[1],r[2],r[3],r[4],r[5],r[6],r[7],r[8],r[9],r[10],r[11],r[12],r[13],r[14],r[15],r[16],r[17]);
  }
});

insertMany(schools);
console.log(`Seeded ${schools.length} D1 schools (part 1: power + mid-major conferences)`);
console.log("Run seed-d1-part2.ts next to add remaining conferences.");
db.close();
