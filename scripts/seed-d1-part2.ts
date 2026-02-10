import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "baseball.db");
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

type R = [string,string,string,string,string,number,number,string,string,number|null,number,string,string,string,string,string,string,string];

const schools: R[] = [
  // ========================= WEST COAST (9) =========================
  ["Gonzaga","Bulldogs","Spokane","WA","99258",47.667,-117.402,"Private","West Coast",null,52240,"@zagbaseball","@ZagBaseball","Mark Machtolf","baseball@gonzaga.edu","Brandon Harmon","baseball@gonzaga.edu","https://gozags.com/sports/baseball"],
  ["San Diego","Toreros","San Diego","CA","92110",32.771,-117.190,"Private","West Coast",null,55480,"@usdbaseball","@USDBball","Brock Ungricht","baseball@sandiego.edu","Sam Wolff","baseball@sandiego.edu","https://usdtoreros.com/sports/baseball"],
  ["Pepperdine","Waves","Malibu","CA","90263",34.036,-118.713,"Private","West Coast",null,60352,"@pepbaseball","@PepBaseball","Rick Hirtensteiner","baseball@pepperdine.edu","Danny Worth","baseball@pepperdine.edu","https://pepperdinewaves.com/sports/baseball"],
  ["LMU","Lions","Los Angeles","CA","90045",33.970,-118.418,"Private","West Coast",null,54936,"@lmubaseball","@LMU_Baseball","Nathan Choate","baseball@lmu.edu","Brad Sanfilippo","baseball@lmu.edu","https://lmulions.com/sports/baseball"],
  ["Santa Clara","Broncos","Santa Clara","CA","95053",37.349,-121.940,"Private","West Coast",null,57330,"@scubaseball","@SCUBaseball","Rusty Filter","baseball@scu.edu","Dan O'Brien","baseball@scu.edu","https://santaclarabroncos.com/sports/baseball"],
  ["San Francisco","Dons","San Francisco","CA","94117",37.776,-122.451,"Private","West Coast",null,55130,"@usfdonsbsb","@USFDonsBSB","Nino Giarratano","baseball@usfca.edu","Troy Nakamura","baseball@usfca.edu","https://usfdons.com/sports/baseball"],
  ["Pacific","Tigers","Stockton","CA","95211",37.979,-121.310,"Private","West Coast",null,53580,"@pacificbaseball","@PacificBSB","Chris Rodriguez","baseball@pacific.edu","Joey Centanni","baseball@pacific.edu","https://pacifictigers.com/sports/baseball"],
  ["Saint Mary's","Gaels","Moraga","CA","94575",37.840,-122.114,"Private","West Coast",null,53940,"@smcbaseball","@SMC_Baseball","Eric Valenzuela","baseball@stmarys-ca.edu","Derek Stafford","baseball@stmarys-ca.edu","https://smcgaels.com/sports/baseball"],
  ["Portland","Pilots","Portland","OR","97203",45.571,-122.726,"Private","West Coast",null,51480,"@portlandpilotsbsb","@PilotsBSB","Geoff Loomis","baseball@up.edu","Connor Lambert","baseball@up.edu","https://portlandpilots.com/sports/baseball"],

  // ========================= BIG WEST (11) =========================
  ["Cal State Fullerton","Titans","Fullerton","CA","92831",33.883,-117.887,"Public","Big West",null,6907,"@fullertonbaseball","@FullertonBSB","Jason Dietrich","baseball@fullerton.edu","Chad Baum","baseball@fullerton.edu","https://fullertontitans.com/sports/baseball"],
  ["Long Beach State","Beach","Long Beach","CA","90840",33.784,-118.114,"Public","Big West",null,6798,"@lbsubaseball","@LBSUBaseball","Eric Valenzuela","baseball@csulb.edu","Troy Nakamura","baseball@csulb.edu","https://longbeachstate.com/sports/baseball"],
  ["UC Irvine","Anteaters","Irvine","CA","92697",33.641,-117.844,"Public","Big West",null,13727,"@ucibaseball","@UCIBaseball","Ben Orloff","baseball@uci.edu","Matt McDonald","baseball@uci.edu","https://ucirvinesports.com/sports/baseball"],
  ["Hawai'i","Rainbow Warriors","Honolulu","HI","96822",21.297,-157.817,"Public","Big West",null,12186,"@hawaiibaseball","@HawaiiBaseball","Rich Hill","baseball@hawaii.edu","Carl Fraticelli","baseball@hawaii.edu","https://hawaiiathletics.com/sports/baseball"],
  ["Cal Poly","Mustangs","San Luis Obispo","CA","93407",35.300,-120.660,"Public","Big West",null,9942,"@calpolybaseball","@CalPolyBSB","Larry Lee","baseball@calpoly.edu","Teddy Warrecker","baseball@calpoly.edu","https://gopoly.com/sports/baseball"],
  ["UC Santa Barbara","Gauchos","Santa Barbara","CA","93106",34.413,-119.849,"Public","Big West",null,14391,"@ucsbbaseball","@UCSBSB","Andrew Checketts","baseball@ucsb.edu","Donegal Fergus","baseball@ucsb.edu","https://ucsbgauchos.com/sports/baseball"],
  ["UC Riverside","Highlanders","Riverside","CA","92521",33.974,-117.328,"Public","Big West",null,13887,"@ucrbaseball","@UCR_Baseball","Troy Percival","baseball@ucr.edu","Chris Gutierrez","baseball@ucr.edu","https://gohighlanders.com/sports/baseball"],
  ["UC Davis","Aggies","Davis","CA","95616",38.537,-121.749,"Public","Big West",null,14654,"@ucdavisbaseball","@UCDavisBSB","Matt Vaughn","baseball@ucdavis.edu","David Steed","baseball@ucdavis.edu","https://ucdavisaggies.com/sports/baseball"],
  ["UC San Diego","Tritons","La Jolla","CA","92093",32.880,-117.234,"Public","Big West",null,14451,"@ucsdbaseball","@UCSDBsb","Eric Newman","baseball@ucsd.edu","Kevin Couture","baseball@ucsd.edu","https://ucsdtritons.com/sports/baseball"],
  ["Cal State Northridge","Matadors","Northridge","CA","91330",34.240,-118.529,"Public","Big West",null,6920,"@csunbaseball","@CSUNbaseball","Eddie Cornejo","baseball@csun.edu","Shaughn Glover","baseball@csun.edu","https://gomatadors.com/sports/baseball"],
  ["Cal State Bakersfield","Roadrunners","Bakersfield","CA","93311",35.348,-119.103,"Public","Big West",null,7309,"@caborsubbaseball","@CSUB_Baseball","Jeremy Beard","baseball@csub.edu","Greg Clanagan","baseball@csub.edu","https://gorunners.com/sports/baseball"],

  // ========================= MOUNTAIN WEST (7) =========================
  ["San Diego State","Aztecs","San Diego","CA","92182",32.776,-117.072,"Public","Mountain West",null,7510,"@aztecbaseball","@AztecBaseball","Mike Martinez","baseball@sdsu.edu","Sam Peraza","baseball@sdsu.edu","https://goaztecs.com/sports/baseball"],
  ["Fresno State","Bulldogs","Fresno","CA","93740",36.813,-119.749,"Public","Mountain West",null,6585,"@fresnostbaseball","@FresnoStBSB","Ryan Overland","baseball@csufresno.edu","Brad Marcelino","baseball@csufresno.edu","https://gobulldogs.com/sports/baseball"],
  ["UNLV","Rebels","Las Vegas","NV","89154",36.108,-115.144,"Public","Mountain West",null,9021,"@unlvbaseball","@UNLVBaseball","Stan Stolte","baseball@unlv.edu","Kevin Higgins","baseball@unlv.edu","https://unlvrebels.com/sports/baseball"],
  ["Nevada","Wolf Pack","Reno","NV","89557",39.546,-119.815,"Public","Mountain West",null,8358,"@nevadabaseball","@NevadaBaseball","T.J. Bruce","baseball@unr.edu","Troy Buckley","baseball@unr.edu","https://nevadawolfpack.com/sports/baseball"],
  ["New Mexico","Lobos","Albuquerque","NM","87131",35.084,-106.620,"Public","Mountain West",null,8064,"@unmbaseball","@UNMBaseball","Tod Brown","baseball@unm.edu","Ray Birmingham","baseball@unm.edu","https://golobos.com/sports/baseball"],
  ["Air Force","Falcons","USAF Academy","CO","80840",38.998,-104.862,"Public","Mountain West",null,0,"@afbaseball","@AF_Baseball","Mike Kazlausky","baseball@usafa.edu","T.J. Milone","baseball@usafa.edu","https://goairforcefalcons.com/sports/baseball"],
  ["San Jose State","Spartans","San Jose","CA","95192",37.335,-121.881,"Public","Mountain West",null,7852,"@sjsubaseball","@SJSUBaseball","Brad Sanfilippo","baseball@sjsu.edu","Ryan & Sarmento","baseball@sjsu.edu","https://sjsuspartans.com/sports/baseball"],

  // ========================= MISSOURI VALLEY (9) =========================
  ["Dallas Baptist","Patriots","Dallas","TX","75211",32.720,-96.895,"Private","Missouri Valley",null,32960,"@dbupatriots","@DBU_Baseball","Dan Heefner","baseball@dbu.edu","Ryan Stegall","baseball@dbu.edu","https://dbupatriots.com/sports/baseball"],
  ["Missouri State","Bears","Springfield","MO","65897",37.196,-93.282,"Public","Missouri Valley",null,7766,"@mostatebsb","@MoStateBSB","Keith Guttin","baseball@missouristate.edu","Paul Evans","baseball@missouristate.edu","https://missouristatebears.com/sports/baseball"],
  ["Indiana State","Sycamores","Terre Haute","IN","47809",39.468,-87.386,"Public","Missouri Valley",null,9160,"@indstbaseball","@IndStBaseball","Mitch Hannahs","baseball@indstate.edu","Brian Sims","baseball@indstate.edu","https://gosycamores.com/sports/baseball"],
  ["Southern Illinois","Salukis","Carbondale","IL","62901",37.717,-89.217,"Public","Missouri Valley",null,14825,"@siubaseball","@SIU_Baseball","Lance Rhodes","baseball@siu.edu","P.J. Finigan","baseball@siu.edu","https://siusalukis.com/sports/baseball"],
  ["Illinois State","Redbirds","Normal","IL","61761",40.511,-88.998,"Public","Missouri Valley",null,14832,"@redbirdsbaseball","@RedbirdBSB","Steve Holm","baseball@ilstu.edu","Mike Stallings","baseball@ilstu.edu","https://goredbirds.com/sports/baseball"],
  ["Evansville","Aces","Evansville","IN","47722",37.971,-87.532,"Private","Missouri Valley",null,43190,"@uebaseball","@UEAthletics","Wes Carroll","baseball@evansville.edu","Tyler Buechler","baseball@evansville.edu","https://gopurpleaces.com/sports/baseball"],
  ["Bradley","Braves","Peoria","IL","61625",40.698,-89.616,"Private","Missouri Valley",null,38950,"@bradleybaseball","@BradleyBSB","Elvis Dominguez","baseball@bradley.edu","Brett Helton","baseball@bradley.edu","https://bradleybraves.com/sports/baseball"],
  ["Valparaiso","Beacons","Valparaiso","IN","46383",41.466,-87.036,"Private","Missouri Valley",null,44750,"@valpobaseball","@ValpoBaseball","Brian Schmack","baseball@valpo.edu","Zach Bratt","baseball@valpo.edu","https://valpoathletics.com/sports/baseball"],
  ["UIC","Flames","Chicago","IL","60607",41.870,-87.650,"Public","Missouri Valley",null,14816,"@uicbaseball","@UIC_BSB","Sean McDermott","baseball@uic.edu","Mike Dee","baseball@uic.edu","https://uicflames.com/sports/baseball"],

  // ========================= CAA (13) =========================
  ["Charleston","Cougars","Charleston","SC","29424",32.784,-79.937,"Public","CAA",null,12838,"@caborofcbaseball","@CofCBaseball","Chad Holbrook","baseball@cofc.edu","Kevin Nichols","baseball@cofc.edu","https://cofcsports.com/sports/baseball"],
  ["Northeastern","Huskies","Boston","MA","02115",42.340,-71.090,"Private","CAA",null,57592,"@naborortheasternbsb","@GoNUbaseball","Mike Glavine","baseball@northeastern.edu","Kevin & Cobb","baseball@northeastern.edu","https://nuhuskies.com/sports/baseball"],
  ["Elon","Phoenix","Elon","NC","27244",36.105,-79.502,"Private","CAA",null,39571,"@elonbaseball","@ElonBaseball","Mike Kennedy","baseball@elon.edu","Chris Clark","baseball@elon.edu","https://elonphoenix.com/sports/baseball"],
  ["UNC Wilmington","Seahawks","Wilmington","NC","28403",34.227,-77.872,"Public","CAA",null,7270,"@uncwbaseball","@UNCWBaseball","Randy Hood","baseball@uncw.edu","Kyle Koehler","baseball@uncw.edu","https://uncwsports.com/sports/baseball"],
  ["William & Mary","Tribe","Williamsburg","VA","23185",37.271,-76.714,"Public","CAA",null,23810,"@wmtribebaseball","@WMTribeBase","Brian Casey","baseball@wm.edu","Trevor Martin","baseball@wm.edu","https://tribeathletics.com/sports/baseball"],
  ["Towson","Tigers","Towson","MD","21252",39.393,-76.610,"Public","CAA",null,10052,"@towsonbaseball","@Towson_BASE","Matt Tyner","baseball@towson.edu","Dominic Fratantuono","baseball@towson.edu","https://towsontigers.com/sports/baseball"],
  ["Hofstra","Pride","Hempstead","NY","11549",40.714,-73.600,"Private","CAA",null,49160,"@hofstrabaseball","@HofstraBaseball","Patrick Anderson","baseball@hofstra.edu","Mike Cooney","baseball@hofstra.edu","https://gohofstra.com/sports/baseball"],
  ["Stony Brook","Seawolves","Stony Brook","NY","11794",40.914,-73.123,"Public","CAA",null,10256,"@stonybrookbsb","@StonyBrookBSB","Matt Senk","baseball@stonybrook.edu","Tyler McNamara","baseball@stonybrook.edu","https://stonybrookathletics.com/sports/baseball"],
  ["Delaware","Blue Hens","Newark","DE","19716",39.683,-75.752,"Public","CAA",null,14280,"@udbaseball","@UDBlueHenBSB","Jim Sherman","baseball@udel.edu","Dan Jennings","baseball@udel.edu","https://bluehens.com/sports/baseball"],
  ["Drexel","Dragons","Philadelphia","PA","19104",39.957,-75.189,"Private","CAA",null,57136,"@drexelbaseball","@DrexelBaseball","Brian Green","baseball@drexel.edu","Sean Fisher","baseball@drexel.edu","https://drexeldragons.com/sports/baseball"],
  ["Monmouth","Hawks","West Long Branch","NJ","07764",40.278,-74.004,"Private","CAA",null,43236,"@monmouthbsb","@MUHawksBSB","Dean Ehehalt","baseball@monmouth.edu","Jeff Barile","baseball@monmouth.edu","https://monmouthhawks.com/sports/baseball"],
  ["Hampton","Pirates","Hampton","VA","23668",37.020,-76.337,"Private","CAA",null,12828,"@hamptonubsb","@HamptonU_BSB","Manny Mantrana","baseball@hamptonu.edu","Isaiah West","baseball@hamptonu.edu","https://hamptonpirates.com/sports/baseball"],
  ["NC A&T","Aggies","Greensboro","NC","27411",36.075,-79.772,"Public","CAA",null,6456,"@ncaboratbsb","@NCAT_Baseball","Ben Hall","baseball@ncat.edu","Brian Rountree","baseball@ncat.edu","https://ncataggies.com/sports/baseball"],

  // ========================= ASUN (11) =========================
  ["Jacksonville","Dolphins","Jacksonville","FL","32211",30.351,-81.610,"Private","ASUN",null,40900,"@jubaseball","@JU_Baseball","Chris Hayes","baseball@ju.edu","Matt Healy","baseball@ju.edu","https://judolphins.com/sports/baseball"],
  ["Lipscomb","Bisons","Nashville","TN","37204",36.105,-86.809,"Private","ASUN",null,40860,"@lipscombbaseball","@LipscombBSB","Jeff Forehand","baseball@lipscomb.edu","Brian Ryman","baseball@lipscomb.edu","https://lipscombsports.com/sports/baseball"],
  ["Stetson","Hatters","DeLand","FL","32723",29.034,-81.303,"Private","ASUN",null,39580,"@stetsonbaseball","@StetsonBSB","Steve Trimper","baseball@stetson.edu","Chris Givin","baseball@stetson.edu","https://gohatters.com/sports/baseball"],
  ["Florida Gulf Coast","Eagles","Fort Myers","FL","33965",26.462,-81.770,"Public","ASUN",null,6118,"@fgcubaseball","@FGCU_Baseball","Dave Tollett","baseball@fgcu.edu","Jake Smith","baseball@fgcu.edu","https://fgcuathletics.com/sports/baseball"],
  ["North Florida","Ospreys","Jacksonville","FL","32224",30.272,-81.511,"Public","ASUN",null,6394,"@unfbaseball","@OspreyBSB","Tim Parenton","baseball@unf.edu","Derek Bermudez","baseball@unf.edu","https://unfospreys.com/sports/baseball"],
  ["Eastern Kentucky","Colonels","Richmond","KY","40475",37.733,-84.295,"Public","ASUN",null,9916,"@ekubaseball","@EKUBaseball","Chris Prothro","baseball@eku.edu","Kyle Mullinix","baseball@eku.edu","https://ekusports.com/sports/baseball"],
  ["Austin Peay","Governors","Clarksville","TN","37044",36.539,-87.354,"Public","ASUN",null,9312,"@apsubaseball","@GovsBSB","Travis Janssen","baseball@apsu.edu","Joel Mangrum","baseball@apsu.edu","https://letsgopeay.com/sports/baseball"],
  ["Central Arkansas","Bears","Conway","AR","72035",35.076,-92.462,"Public","ASUN",null,8948,"@ucabaseball","@UCA_Baseball","Nick Harlan","baseball@uca.edu","Bryce Collins","baseball@uca.edu","https://ucasports.com/sports/baseball"],
  ["Bellarmine","Knights","Louisville","KY","40205",38.218,-85.676,"Private","ASUN",null,46260,"@bellarminebaseball","@BUKnightsBSB","Larry Owens","baseball@bellarmine.edu","Phil Elson","baseball@bellarmine.edu","https://bellarmineknights.com/sports/baseball"],
  ["North Alabama","Lions","Florence","AL","35632",34.804,-87.674,"Public","ASUN",null,11040,"@unalionsbaseball","@UNALionsBSB","Mike Keehn","baseball@una.edu","Daniel Zardon","baseball@una.edu","https://roarlions.com/sports/baseball"],
  ["Queens","Royals","Charlotte","NC","28274",35.189,-80.835,"Private","ASUN",null,40240,"@queensbsb","@QueensRoyalsBSB","Russ Burroughs","baseball@queens.edu","Mike Stover","baseball@queens.edu","https://queensroyals.com/sports/baseball"],

  // ========================= SOUTHERN CONFERENCE (10) =========================
  ["Samford","Bulldogs","Birmingham","AL","35229",33.463,-86.793,"Private","Southern",null,37500,"@samfordbaseball","@SamfordBSB","Tony David","baseball@samford.edu","Tyler Ferguson","baseball@samford.edu","https://samfordsports.com/sports/baseball"],
  ["ETSU","Buccaneers","Johnson City","TN","37614",36.304,-82.368,"Public","Southern",null,9632,"@etsubaseball","@ETSU_Baseball","Joe Pennucci","baseball@etsu.edu","Skyler Moss","baseball@etsu.edu","https://etsubucs.com/sports/baseball"],
  ["Mercer","Bears","Macon","GA","31207",32.831,-83.649,"Private","Southern",null,39572,"@mercerbaseball","@MercerBSB","Craig Gibson","baseball@mercer.edu","Brent Shade","baseball@mercer.edu","https://mercerbears.com/sports/baseball"],
  ["The Citadel","Bulldogs","Charleston","SC","29409",32.798,-79.958,"Public","Southern",null,15200,"@citadelbaseball","@CitadelBSB","Tony Skole","baseball@citadel.edu","Collin Faust","baseball@citadel.edu","https://citadelsports.com/sports/baseball"],
  ["Western Carolina","Catamounts","Cullowhee","NC","28723",35.312,-83.186,"Public","Southern",null,7647,"@catamountbsb","@CatamountBSB","Bobby Moranda","baseball@wcu.edu","Daylon Clanton","baseball@wcu.edu","https://catamountsports.com/sports/baseball"],
  ["Furman","Paladins","Greenville","SC","29613",34.925,-82.441,"Private","Southern",null,55464,"@furmanbaseball","@FurmanBSB","Brett Harker","baseball@furman.edu","Kyle Kessler","baseball@furman.edu","https://furmanpaladins.com/sports/baseball"],
  ["UNC Greensboro","Spartans","Greensboro","NC","27412",36.069,-79.810,"Public","Southern",null,7440,"@uncgbaseball","@UNCG_BSB","Billy Godwin","baseball@uncg.edu","Trey Gowdy","baseball@uncg.edu","https://uncgspartans.com/sports/baseball"],
  ["Wofford","Terriers","Spartanburg","SC","29303",34.952,-81.929,"Private","Southern",null,52430,"@woffordbaseball","@WoffordBSB","Todd Interdonato","baseball@wofford.edu","Drew Sherrod","baseball@wofford.edu","https://woffordterriers.com/sports/baseball"],
  ["VMI","Keydets","Lexington","VA","24450",37.792,-79.442,"Public","Southern",null,9532,"@vmibaseball","@VMI_Baseball","Sam Roberts","baseball@vmi.edu","Matt Kirby","baseball@vmi.edu","https://vmikeydets.com/sports/baseball"],
  ["Chattanooga","Mocs","Chattanooga","TN","37403",35.050,-85.307,"Public","Southern",null,9632,"@chatanoogabsb","@GoMocsBSB","Matt Kennelly","baseball@utc.edu","Casey Dykes","baseball@utc.edu","https://gomocs.com/sports/baseball"],

  // ========================= SOUTHLAND (8) =========================
  ["McNeese","Cowboys","Lake Charles","LA","70609",30.207,-93.211,"Public","Southland",null,8664,"@mcneesebaseball","@McNeeseBSB","Heath Schroyer","baseball@mcneese.edu","Jake Wells","baseball@mcneese.edu","https://mcneesesports.com/sports/baseball"],
  ["Southeastern Louisiana","Lions","Hammond","LA","70402",30.515,-90.472,"Public","Southland",null,9236,"@selulionsbaseball","@LionUpBaseball","Matt Riser","baseball@southeastern.edu","David Platt","baseball@southeastern.edu","https://lionsports.net/sports/baseball"],
  ["Northwestern State","Demons","Natchitoches","LA","71497",31.761,-93.096,"Public","Southland",null,8820,"@naborsudemonsbaseball","@NSUDemonsBSB","Bobby Barbier","baseball@nsula.edu","Patrick Dayton","baseball@nsula.edu","https://nsudemons.com/sports/baseball"],
  ["Nicholls","Colonels","Thibodaux","LA","70310",29.796,-90.823,"Public","Southland",null,8640,"@nichollsbaseball","@NichollsBSB","Seth Thibodeaux","baseball@nicholls.edu","Tyler Theriot","baseball@nicholls.edu","https://geauxcolonels.com/sports/baseball"],
  ["Lamar","Cardinals","Beaumont","TX","77710",30.066,-94.098,"Public","Southland",null,10096,"@lamarbaseball","@LamarBSB","Will Davis","baseball@lamar.edu","Jason Stein","baseball@lamar.edu","https://lamarcardinals.com/sports/baseball"],
  ["Houston Christian","Huskies","Houston","TX","77074",29.718,-95.498,"Private","Southland",null,33580,"@hcubaseball","@HCUBaseball","Jeremy Sheetinger","baseball@hc.edu","Hunter Faught","baseball@hc.edu","https://hcuhuskies.com/sports/baseball"],
  ["Incarnate Word","Cardinals","San Antonio","TX","78209",29.463,-98.462,"Private","Southland",null,33500,"@uiwbaseball","@UIWBaseball","Ryan Shotzberger","baseball@uiwtx.edu","Travis Creel","baseball@uiwtx.edu","https://uiwcardinals.com/sports/baseball"],
  ["Texas A&M-Corpus Christi","Islanders","Corpus Christi","TX","78412",27.713,-97.326,"Public","Southland",null,10768,"@islandersbsb","@IslandersBSB","Scott Malone","baseball@tamucc.edu","Kyle Vasquez","baseball@tamucc.edu","https://goislanders.com/sports/baseball"],

  // ========================= WAC (9) =========================
  ["Grand Canyon","Antelopes","Phoenix","AZ","85017",33.510,-112.099,"Private","WAC",null,17050,"@gcubaseball","@GCU_Baseball","Andy Stankiewicz","baseball@gcu.edu","Gregg Wallis","baseball@gcu.edu","https://gculopes.com/sports/baseball"],
  ["Stephen F. Austin","Lumberjacks","Nacogdoches","TX","75962",31.621,-94.649,"Public","WAC",null,9478,"@sfabaseball","@SFA_Baseball","Johnny Cardenas","baseball@sfasu.edu","Scott Hatten","baseball@sfasu.edu","https://sfajacks.com/sports/baseball"],
  ["Abilene Christian","Wildcats","Abilene","TX","79699",32.442,-99.715,"Private","WAC",null,40950,"@acubaseball","@ACU_Baseball","Rick McCarty","baseball@acu.edu","Trey Taylor","baseball@acu.edu","https://acusports.com/sports/baseball"],
  ["Tarleton State","Texans","Stephenville","TX","76402",32.223,-98.209,"Public","WAC",null,8810,"@tarletonsbaseball","@TarletonBSB","Aaron Ragan","baseball@tarleton.edu","Lane Closner","baseball@tarleton.edu","https://tarletonsports.com/sports/baseball"],
  ["UT Arlington","Mavericks","Arlington","TX","76019",32.731,-97.115,"Public","WAC",null,10798,"@utabaseball","@UTAMavsBSB","Darin Thomas","baseball@uta.edu","Clay Overcash","baseball@uta.edu","https://utamavs.com/sports/baseball"],
  ["California Baptist","Lancers","Riverside","CA","92504",33.932,-117.426,"Private","WAC",null,38930,"@cbulancersbsb","@CBULancersBSB","Gary Adcock","baseball@calbaptist.edu","Logan Sowers","baseball@calbaptist.edu","https://cbulancers.com/sports/baseball"],
  ["Southern Utah","Thunderbirds","Cedar City","UT","84720",37.677,-113.062,"Public","WAC",null,7960,"@suubaseball","@SUU_Baseball","Matt Burgess","baseball@suu.edu","Riley O'Brien","baseball@suu.edu","https://suutbirds.com/sports/baseball"],
  ["Utah Valley","Wolverines","Orem","UT","84058",40.276,-111.714,"Public","WAC",null,6004,"@uvubaseball","@UVUbaseball","Eric Madsen","baseball@uvu.edu","Russell Smith","baseball@uvu.edu","https://wolverinegreen.com/sports/baseball"],
  ["Utah Tech","Trailblazers","St. George","UT","84770",37.109,-113.568,"Public","WAC",null,6362,"@utahtechbaseball","@UtahTechBSB","Chris Pfund","baseball@utahtech.edu","Blake Schmit","baseball@utahtech.edu","https://utahtechblazers.com/sports/baseball"],

  // ========================= OVC (10) =========================
  ["Tennessee Tech","Golden Eagles","Cookeville","TN","38505",36.177,-85.505,"Public","Ohio Valley",null,9566,"@ttubaseball","@TTU_Baseball","Matt Bragga","baseball@tntech.edu","Travis Bishop","baseball@tntech.edu","https://ttusports.com/sports/baseball"],
  ["Morehead State","Eagles","Morehead","KY","40351",38.188,-83.434,"Public","Ohio Valley",null,9462,"@morehstbaseball","@MSUEaglesBSB","Mik Aoki","baseball@moreheadstate.edu","Adam Puckett","baseball@moreheadstate.edu","https://msueagles.com/sports/baseball"],
  ["Murray State","Racers","Murray","KY","42071",36.613,-88.327,"Public","Ohio Valley",null,9468,"@murraystbaseball","@MSURacersBSB","Dan Skirka","baseball@murraystate.edu","Austin Coombs","baseball@murraystate.edu","https://goracers.com/sports/baseball"],
  ["SE Missouri State","Redhawks","Cape Girardeau","MO","63701",37.306,-89.531,"Public","Ohio Valley",null,7843,"@saboremobaseball","@SEMOBaseball","Andy Sawyers","baseball@semo.edu","Kirk Kelnar","baseball@semo.edu","https://gosoutheast.com/sports/baseball"],
  ["SIU Edwardsville","Cougars","Edwardsville","IL","62026",38.793,-89.997,"Public","Ohio Valley",null,13584,"@siuebaseball","@SIUE_Baseball","Sean Lyons","baseball@siue.edu","P.J. Fultz","baseball@siue.edu","https://siuecougars.com/sports/baseball"],
  ["UT Martin","Skyhawks","Martin","TN","38238",36.339,-88.855,"Public","Ohio Valley",null,9812,"@utmbaseball","@UTMBaseball","Rick Robinson","baseball@utm.edu","Jordan Corn","baseball@utm.edu","https://utmsports.com/sports/baseball"],
  ["Lindenwood","Lions","St. Charles","MO","63301",38.789,-90.502,"Private","Ohio Valley",null,19600,"@lindenwoodbsb","@LindenwoodBSB","Doug Bletcher","baseball@lindenwood.edu","David Pappas","baseball@lindenwood.edu","https://lindenwoodlions.com/sports/baseball"],
  ["Little Rock","Trojans","Little Rock","AR","72204",34.725,-92.343,"Public","Ohio Valley",null,9282,"@lrtrojansbaseball","@LRTrojansBSB","Chris Curry","baseball@ualr.edu","Matt McLeod","baseball@ualr.edu","https://lrtrojans.com/sports/baseball"],
  ["Southern Indiana","Screaming Eagles","Evansville","IN","47712",38.003,-87.535,"Public","Ohio Valley",null,8622,"@usibaseball","@USIBaseball","Tracy Archuleta","baseball@usi.edu","Chad Murray","baseball@usi.edu","https://gousieagles.com/sports/baseball"],
  ["Tennessee State","Tigers","Nashville","TN","37209",36.168,-86.836,"Public","Ohio Valley",null,9192,"@tstigersbsb","@TSTigersBSB","Terrence Brownlee","baseball@tnstate.edu","Josh Lawson","baseball@tnstate.edu","https://tsutigers.com/sports/baseball"],

  // ========================= PATRIOT LEAGUE (5) =========================
  ["Army","Black Knights","West Point","NY","10996",41.391,-73.956,"Public","Patriot",null,0,"@armybaseball","@ArmyWP_BSB","Jim Foster","baseball@westpoint.edu","Sean Monaghan","baseball@westpoint.edu","https://goarmywestpoint.com/sports/baseball"],
  ["Lehigh","Mountain Hawks","Bethlehem","PA","18015",40.607,-75.378,"Private","Patriot",null,60100,"@lehighbaseball","@LehighBaseball","Sean Leary","baseball@lehigh.edu","Joe Martucci","baseball@lehigh.edu","https://lehighsports.com/sports/baseball"],
  ["Bucknell","Bison","Lewisburg","PA","17837",40.955,-76.884,"Private","Patriot",null,62088,"@bucknellbaseball","@BucknellBSB","Scott Heather","baseball@bucknell.edu","Brent Shade","baseball@bucknell.edu","https://bucknellbison.com/sports/baseball"],
  ["Holy Cross","Crusaders","Worcester","MA","01610",42.237,-71.808,"Private","Patriot",null,57090,"@hcbaseball","@HCross_BSB","Greg DiCenzo","baseball@holycross.edu","Dan Letcher","baseball@holycross.edu","https://goholycross.com/sports/baseball"],
  ["Lafayette","Leopards","Easton","PA","18042",40.697,-75.212,"Private","Patriot",null,59610,"@lafbaseball","@LafColBSB","Tim Reilly","baseball@lafayette.edu","Cody Wertheimer","baseball@lafayette.edu","https://goleopards.com/sports/baseball"],

  // ========================= IVY LEAGUE (8) =========================
  ["Harvard","Crimson","Cambridge","MA","02138",42.377,-71.117,"Private","Ivy League",null,57261,"@harvardbaseball","@HarvardBSB","Bill Decker","baseball@fas.harvard.edu","Kevin Corr","baseball@fas.harvard.edu","https://gocrimson.com/sports/baseball"],
  ["Yale","Bulldogs","New Haven","CT","06520",41.311,-72.926,"Private","Ivy League",null,62250,"@yalebaseball","@YaleBaseball","John Stuper","baseball@yale.edu","Ray Guarino","baseball@yale.edu","https://yalebulldogs.com/sports/baseball"],
  ["Columbia","Lions","New York","NY","10027",40.808,-73.962,"Private","Ivy League",null,65524,"@culionsbaseball","@CULionsBSB","Brett Boretti","baseball@columbia.edu","Connor Smith","baseball@columbia.edu","https://gocolumbialions.com/sports/baseball"],
  ["Penn","Quakers","Philadelphia","PA","19104",39.952,-75.193,"Private","Ivy League",null,63452,"@pennbaseball","@PennBaseball","John Yurkow","baseball@upenn.edu","Chris Mooney","baseball@upenn.edu","https://pennathletics.com/sports/baseball"],
  ["Princeton","Tigers","Princeton","NJ","08544",40.348,-74.659,"Private","Ivy League",null,59710,"@princetonbaseball","@TigerBSB","Bill Scholl","baseball@princeton.edu","Dillon McConnell","baseball@princeton.edu","https://goprincetontigers.com/sports/baseball"],
  ["Dartmouth","Big Green","Hanover","NH","03755",43.704,-72.289,"Private","Ivy League",null,62430,"@dartmouthbaseball","@DartmouthBSB","Bob Whalen","baseball@dartmouth.edu","Eric Podbelski","baseball@dartmouth.edu","https://dartmouthsports.com/sports/baseball"],
  ["Brown","Bears","Providence","RI","02912",41.826,-71.403,"Private","Ivy League",null,65146,"@brownbaseball","@BrownU_BSB","Grant Achilles","baseball@brown.edu","Cameron Curler","baseball@brown.edu","https://brownbears.com/sports/baseball"],
  ["Cornell","Big Red","Ithaca","NY","14853",42.447,-76.477,"Private","Ivy League",null,63200,"@cornellbaseball","@CornellBSB","Dan Pepicelli","baseball@cornell.edu","Frank Margiotta","baseball@cornell.edu","https://cornellbigred.com/sports/baseball"],

  // ========================= ATLANTIC 10 (13) =========================
  ["VCU","Rams","Richmond","VA","23284",37.549,-77.453,"Public","Atlantic 10",null,14876,"@vcubaseball","@VCUBaseball","Shawn Stiffler","baseball@vcu.edu","Kevin Herget","baseball@vcu.edu","https://vcuathletics.com/sports/baseball"],
  ["Richmond","Spiders","Richmond","VA","23173",37.574,-77.540,"Private","Atlantic 10",null,58570,"@richmondbaseball","@SpiderBaseball","Tracy Woodson","baseball@richmond.edu","Nate Mulberg","baseball@richmond.edu","https://richmondspiders.com/sports/baseball"],
  ["George Mason","Patriots","Fairfax","VA","22030",38.832,-77.307,"Public","Atlantic 10",null,12564,"@masonbaseball","@MasonBaseball","Bill Brown","baseball@gmu.edu","Sam McConnell","baseball@gmu.edu","https://gomason.com/sports/baseball"],
  ["Davidson","Wildcats","Davidson","NC","28035",35.502,-80.843,"Private","Atlantic 10",null,57640,"@davidsonbaseball","@DavidsonBSB","Rucker Taylor","baseball@davidson.edu","Parker Bangs","baseball@davidson.edu","https://davidsonwildcats.com/sports/baseball"],
  ["Dayton","Flyers","Dayton","OH","45469",39.741,-84.179,"Private","Atlantic 10",null,47790,"@daytonbaseball","@DaytonFlyers","Jayson King","baseball@udayton.edu","Todd Linklater","baseball@udayton.edu","https://daytonflyers.com/sports/baseball"],
  ["Saint Joseph's","Hawks","Philadelphia","PA","19131",39.997,-75.237,"Private","Atlantic 10",null,53870,"@sjuhawksbsb","@SJUHawksBSB","Fritz Hamburg","baseball@sju.edu","Todd Linklater","baseball@sju.edu","https://sjuhawks.com/sports/baseball"],
  ["Fordham","Rams","Bronx","NY","10458",40.861,-73.886,"Private","Atlantic 10",null,58082,"@fordhambaseball","@FordhamBSB","Kevin Leighton","baseball@fordham.edu","CJ Ketchum","baseball@fordham.edu","https://fordhamsports.com/sports/baseball"],
  ["Rhode Island","Rams","Kingston","RI","02881",41.483,-71.530,"Public","Atlantic 10",null,15124,"@uribaseball","@URIBaseball","Raphael Cerrato","baseball@uri.edu","Rich Marlin","baseball@uri.edu","https://gorhody.com/sports/baseball"],
  ["Saint Louis","Billikens","St. Louis","MO","63103",38.635,-90.234,"Private","Atlantic 10",null,51300,"@slubillikenbsb","@SLUBaseball","Darin Hendrickson","baseball@slu.edu","Mick Irvine","baseball@slu.edu","https://slubillikens.com/sports/baseball"],
  ["La Salle","Explorers","Philadelphia","PA","19141",40.038,-75.155,"Private","Atlantic 10",null,48000,"@lasallebaseball","@LaSalle_BSB","David Miller","baseball@lasalle.edu","Chris Lafrenz","baseball@lasalle.edu","https://goexplorers.com/sports/baseball"],
  ["George Washington","Revolutionaries","Washington","DC","20052",38.900,-77.049,"Private","Atlantic 10",null,62250,"@gwbaseball","@GW_Baseball","Gregg Ritchie","baseball@gwu.edu","Tim Sinicki","baseball@gwu.edu","https://gwsports.com/sports/baseball"],
  ["Massachusetts","Minutemen","Amherst","MA","01003",42.386,-72.530,"Public","Atlantic 10",null,16399,"@umassbaseball","@UMassBaseball","Matt Reynolds","baseball@umass.edu","Nate Balczak","baseball@umass.edu","https://umassathletics.com/sports/baseball"],
  ["St. Bonaventure","Bonnies","Olean","NY","14778",42.080,-78.498,"Private","Atlantic 10",null,41280,"@bonniesbsb","@BonniesBSB","Larry Sudbrook","baseball@sbu.edu","Jake Sanford","baseball@sbu.edu","https://gobonnies.com/sports/baseball"],

  // ========================= MAAC (9) =========================
  ["Quinnipiac","Bobcats","Hamden","CT","06518",41.419,-72.894,"Private","MAAC",null,50760,"@qubaseball","@QU_Baseball","John Delaney","baseball@quinnipiac.edu","Adam Garner","baseball@quinnipiac.edu","https://quinnipiacbobcats.com/sports/baseball"],
  ["Rider","Broncs","Lawrenceville","NJ","08648",40.283,-74.747,"Private","MAAC",null,46430,"@riderbaseball","@RiderBSB","Barry Davis","baseball@rider.edu","Mark Cieslak","baseball@rider.edu","https://gobroncs.com/sports/baseball"],
  ["Marist","Red Foxes","Poughkeepsie","NY","12601",41.720,-73.934,"Private","MAAC",null,44640,"@maristbaseball","@MaristBSB","Chris Tracz","baseball@marist.edu","Kevin Mooney","baseball@marist.edu","https://goredfoxes.com/sports/baseball"],
  ["Fairfield","Stags","Fairfield","CT","06824",41.168,-73.255,"Private","MAAC",null,53710,"@fairfieldbaseball","@FairfieldBSB","Bill Currier","baseball@fairfield.edu","Dylan Fabian","baseball@fairfield.edu","https://fairfieldstags.com/sports/baseball"],
  ["Canisius","Golden Griffins","Buffalo","NY","14208",42.936,-78.857,"Private","MAAC",null,33100,"@canisiusbsb","@GriffsBSB","Matt Mazurek","baseball@canisius.edu","Matt Powers","baseball@canisius.edu","https://gogriffs.com/sports/baseball"],
  ["Iona","Gaels","New Rochelle","NY","10801",40.929,-73.788,"Private","MAAC",null,44500,"@ionabaseball","@IonaGaelsBSB","Sean Fabian","baseball@iona.edu","Dave Brainard","baseball@iona.edu","https://icgaels.com/sports/baseball"],
  ["Niagara","Purple Eagles","Niagara University","NY","14109",43.139,-79.034,"Private","MAAC",null,37050,"@niagarabaseball","@NiagaraBSB","Rob McCoy","baseball@niagara.edu","Nick Doscher","baseball@niagara.edu","https://purpleeagles.com/sports/baseball"],
  ["Saint Peter's","Peacocks","Jersey City","NJ","07306",40.735,-74.063,"Private","MAAC",null,40218,"@spubaseball","@SPUBaseball","Cory Mee","baseball@saintpeters.edu","Matt Lawson","baseball@saintpeters.edu","https://saintpeterspeacocks.com/sports/baseball"],
  ["Siena","Saints","Loudonville","NY","12211",42.719,-73.752,"Private","MAAC",null,42300,"@sienabaseball","@SienaBSB","Tony Rossi","baseball@siena.edu","Steve Marrabito","baseball@siena.edu","https://sienasaints.com/sports/baseball"],

  // ========================= HORIZON LEAGUE (7) =========================
  ["Wright State","Raiders","Dayton","OH","45435",39.782,-84.062,"Public","Horizon",null,9750,"@wsuraiderbsb","@WSURaiderBSB","Alex Sogard","baseball@wright.edu","Dan Blewett","baseball@wright.edu","https://wsuraiders.com/sports/baseball"],
  ["Northern Kentucky","Norse","Highland Heights","KY","41099",39.032,-84.462,"Public","Horizon",null,10488,"@nkubaseball","@NKUNorse_BSB","Dizzy Peyton","baseball@nku.edu","Denny Sander","baseball@nku.edu","https://nkunorse.com/sports/baseball"],
  ["Milwaukee","Panthers","Milwaukee","WI","53211",43.078,-87.882,"Public","Horizon",null,9854,"@mkepantherbsb","@MKEPantherBSB","Scott Doffek","baseball@uwm.edu","Mike Rooney","baseball@uwm.edu","https://mkepanthers.com/sports/baseball"],
  ["Youngstown State","Penguins","Youngstown","OH","44555",41.104,-80.646,"Public","Horizon",null,9462,"@yaborsupenguinbsb","@YSU_Baseball","Dan Bertolini","baseball@ysu.edu","Craig Snider","baseball@ysu.edu","https://ysusports.com/sports/baseball"],
  ["Cleveland State","Vikings","Cleveland","OH","44115",41.502,-81.675,"Public","Horizon",null,11990,"@csuvikingbsb","@CSUVikingBSB","Mike McGuire","baseball@csuohio.edu","T.J. Tomczak","baseball@csuohio.edu","https://csuvikings.com/sports/baseball"],
  ["Oakland","Golden Grizzlies","Rochester","MI","48309",42.672,-83.218,"Public","Horizon",null,13862,"@oaklandbsb","@OaklandBSB","Jordon Banfield","baseball@oakland.edu","Colin Kaline","baseball@oakland.edu","https://goldengrizzlies.com/sports/baseball"],
  ["Purdue Fort Wayne","Mastodons","Fort Wayne","IN","46805",41.118,-85.111,"Public","Horizon",null,8442,"@pfwbaseball","@MastodonBSB","Doug Schreiber","baseball@pfw.edu","Ted Marchibroda","baseball@pfw.edu","https://gomastodons.com/sports/baseball"],

  // ========================= AMERICA EAST (8) =========================
  ["UMBC","Retrievers","Baltimore","MD","21250",39.255,-76.714,"Public","America East",null,12168,"@umbcbaseball","@UMBC_Baseball","Liam Bowen","baseball@umbc.edu","Bobby Minarcin","baseball@umbc.edu","https://umbcretrievers.com/sports/baseball"],
  ["Binghamton","Bearcats","Binghamton","NY","13902",42.089,-75.966,"Public","America East",null,10261,"@baboringhamtonbsb","@BinghamtonBSB","Tim Sinicki","baseball@binghamton.edu","Steve DeVivo","baseball@binghamton.edu","https://bubearcats.com/sports/baseball"],
  ["Albany","Great Danes","Albany","NY","12222",42.685,-73.825,"Public","America East",null,10556,"@ualbanybaseball","@UAlbanyBSB","Jon Mueller","baseball@albany.edu","Tyler Martin","baseball@albany.edu","https://ualbanysports.com/sports/baseball"],
  ["Maine","Black Bears","Orono","ME","04469",44.901,-68.672,"Public","America East",null,11970,"@mainebsb","@MaineBSB","Nick Derba","baseball@maine.edu","Tyler Patzalek","baseball@maine.edu","https://goblackbears.com/sports/baseball"],
  ["Bryant","Bulldogs","Smithfield","RI","02917",41.844,-71.526,"Private","America East",null,46749,"@bryantbaseball","@BryantBSB","Ryan Klosterman","baseball@bryant.edu","Steve Owens","baseball@bryant.edu","https://bryantbulldogs.com/sports/baseball"],
  ["NJIT","Highlanders","Newark","NJ","07102",40.742,-74.179,"Public","America East",null,17866,"@njitbaseball","@NJIT_Baseball","Brian & Guiliana","baseball@njit.edu","Dave Callahan","baseball@njit.edu","https://njithighlanders.com/sports/baseball"],
  ["UMass Lowell","River Hawks","Lowell","MA","01854",42.655,-71.325,"Public","America East",null,15414,"@riverhawkbsb","@RiverHawkBSB","Ken Harring","baseball@uml.edu","Eric Giese","baseball@uml.edu","https://goriverhawks.com/sports/baseball"],
  ["Vermont","Catamounts","Burlington","VT","05405",44.478,-73.196,"Public","America East",null,18802,"@uvmbaseball","@UVMBaseball","Rob Marihugh","baseball@uvm.edu","Brian Jenkins","baseball@uvm.edu","https://uvmathletics.com/sports/baseball"],

  // ========================= NEC (8) =========================
  ["Central Connecticut","Blue Devils","New Britain","CT","06050",41.669,-72.783,"Public","NEC",null,12392,"@ccsubaseball","@CCSUBaseball","Charlie Hickey","baseball@ccsu.edu","Mike Robilotta","baseball@ccsu.edu","https://ccsubluedevils.com/sports/baseball"],
  ["LIU","Sharks","Brooklyn","NY","11201",40.690,-73.982,"Private","NEC",null,43476,"@liusharksbsb","@LIUSharksBSB","Dan Pirillo","baseball@liu.edu","Sean Farrell","baseball@liu.edu","https://liuathletics.com/sports/baseball"],
  ["Sacred Heart","Pioneers","Fairfield","CT","06825",41.221,-73.238,"Private","NEC",null,44650,"@shupioneersbsb","@SHUPioneersBSB","Nick Restaino","baseball@sacredheart.edu","Chris Mielke","baseball@sacredheart.edu","https://sacredheartpioneers.com/sports/baseball"],
  ["Merrimack","Warriors","North Andover","MA","01845",42.704,-71.131,"Private","NEC",null,44120,"@merrimackbsb","@MerrimackBSB","Brian & Boucher","baseball@merrimack.edu","Shawn Krey","baseball@merrimack.edu","https://merrimackathletics.com/sports/baseball"],
  ["Fairleigh Dickinson","Knights","Teaneck","NJ","07666",40.862,-74.015,"Private","NEC",null,43078,"@fdubaseball","@FDUBaseball","Chris Marrero","baseball@fdu.edu","Joe Margiotta","baseball@fdu.edu","https://fduknights.com/sports/baseball"],
  ["Wagner","Seahawks","Staten Island","NY","10301",40.616,-74.095,"Private","NEC",null,49990,"@wagnerbsb","@WagnerBSB","Jim Carone","baseball@wagner.edu","Matt Kinney","baseball@wagner.edu","https://wagnerathletics.com/sports/baseball"],
  ["Le Moyne","Dolphins","Syracuse","NY","13214",43.028,-76.074,"Private","NEC",null,39370,"@lemoynebaseball","@LeMoyneBSB","James Marfia","baseball@lemoyne.edu","Ross Meagher","baseball@lemoyne.edu","https://lemoynesports.com/sports/baseball"],
  ["Stonehill","Skyhawks","Easton","MA","02357",42.104,-71.099,"Private","NEC",null,47850,"@stonehillbsb","@StonehillBSB","Pat Boen","baseball@stonehill.edu","Brendan Adams","baseball@stonehill.edu","https://stonehillskyhawks.com/sports/baseball"],

  // ========================= SUMMIT LEAGUE (6) =========================
  ["Oral Roberts","Golden Eagles","Tulsa","OK","74171",36.056,-95.948,"Private","Summit",null,32218,"@oraborubaseball","@ORUBaseball","Ryan Folmar","baseball@oru.edu","Dustin Adkison","baseball@oru.edu","https://orugoldeneagles.com/sports/baseball"],
  ["Omaha","Mavericks","Omaha","NE","68182",41.259,-96.010,"Public","Summit",null,8658,"@omaborahabaseball","@OmahaBaseball","Evan Porter","baseball@unomaha.edu","Matty Johnson","baseball@unomaha.edu","https://omavs.com/sports/baseball"],
  ["North Dakota State","Bison","Fargo","ND","58108",46.897,-96.800,"Public","Summit",null,9884,"@ndsubaseball","@NDSUBaseball","Tod Brown","baseball@ndsu.edu","Max Casper","baseball@ndsu.edu","https://gobison.com/sports/baseball"],
  ["South Dakota State","Jackrabbits","Brookings","SD","57007",44.310,-96.786,"Public","Summit",null,9248,"@sdstatebaseball","@GoJacksBSB","Rob Bishop","baseball@sdstate.edu","Jaxon Shirack","baseball@sdstate.edu","https://gojacks.com/sports/baseball"],
  ["Kansas City","Roos","Kansas City","MO","64110",39.034,-94.574,"Public","Summit",null,12290,"@kcroosbaseball","@KCRoosBSB","Jake Sims","baseball@umkc.edu","Joe DeStefano","baseball@umkc.edu","https://kcroos.com/sports/baseball"],
  ["Western Illinois","Leathernecks","Macomb","IL","61455",40.476,-90.680,"Public","Summit",null,10596,"@wiubaseball","@WIUBaseball","Ryan McGinnis","baseball@wiu.edu","Mitchell Crosby","baseball@wiu.edu","https://goleathernecks.com/sports/baseball"],

  // ========================= MEAC (7) =========================
  ["Norfolk State","Spartans","Norfolk","VA","23504",36.847,-76.270,"Public","MEAC",null,10130,"@nsubaseball","@NSU_Baseball","Keith Shumate","baseball@nsu.edu","Kevin Johnson","baseball@nsu.edu","https://nsuspartans.com/sports/baseball"],
  ["North Carolina Central","Eagles","Durham","NC","27707",35.974,-78.899,"Public","MEAC",null,6811,"@nccueaglesbaseball","@NCCUBaseball","Jim Koerner","baseball@nccu.edu","Marcus Jones","baseball@nccu.edu","https://nccueaglepride.com/sports/baseball"],
  ["Coppin State","Eagles","Baltimore","MD","21216",39.311,-76.656,"Public","MEAC",null,8416,"@coppstbaseball","@CoppinStBSB","Sherman Reed","baseball@coppin.edu","Thomas Marston","baseball@coppin.edu","https://coppinstatesports.com/sports/baseball"],
  ["Delaware State","Hornets","Dover","DE","19901",39.186,-75.543,"Public","MEAC",null,8384,"@dsubaseball","@DSUHornetsBSB","J.P. Blandin","baseball@desu.edu","Kyle Davis","baseball@desu.edu","https://dsuhornets.com/sports/baseball"],
  ["Howard","Bison","Washington","DC","20059",38.922,-77.020,"Private","MEAC",null,30786,"@howardbsb","@HowardBSB","Brian Ennis","baseball@howard.edu","Kyle Decker","baseball@howard.edu","https://hubison.com/sports/baseball"],
  ["Maryland Eastern Shore","Hawks","Princess Anne","MD","21853",38.200,-75.693,"Public","MEAC",null,8602,"@umesbaseball","@UMES_Baseball","Brian Hollamon","baseball@umes.edu","Craig Keilitz","baseball@umes.edu","https://umeshawks.com/sports/baseball"],
  ["South Carolina State","Bulldogs","Orangeburg","SC","29117",33.497,-80.855,"Public","MEAC",null,11300,"@scstbaseball","@SCStateBSB","Eric Oxendine","baseball@scsu.edu","Jason Broadus","baseball@scsu.edu","https://scstatebulldogs.com/sports/baseball"],

  // ========================= SWAC (12) =========================
  ["Southern","Jaguars","Baton Rouge","LA","70813",30.527,-91.191,"Public","SWAC",null,8820,"@southernubaseball","@SouthernU_BSB","Chris Crenshaw","baseball@subr.edu","Cedric Smith","baseball@subr.edu","https://gojagsports.com/sports/baseball"],
  ["Grambling State","Tigers","Grambling","LA","71245",32.524,-92.714,"Public","SWAC",null,8376,"@graboramblingbsb","@GramblingBSB","Davin Pierre","baseball@gram.edu","Arturo Rivas","baseball@gram.edu","https://gsutigers.com/sports/baseball"],
  ["Jackson State","Tigers","Jackson","MS","39217",32.296,-90.209,"Public","SWAC",null,8764,"@jstigersbsb","@JSUTigersBSB","Omar Johnson","baseball@jsums.edu","Ethan Thomas","baseball@jsums.edu","https://jsutigers.com/sports/baseball"],
  ["Alabama State","Hornets","Montgomery","AL","36101",32.364,-86.296,"Public","SWAC",null,11068,"@baboramastatebsb","@BamaStateBSB","Jose Vasquez","baseball@alasu.edu","Samuel Williams","baseball@alasu.edu","https://bamastatesports.com/sports/baseball"],
  ["Alabama A&M","Bulldogs","Huntsville","AL","35811",34.783,-86.569,"Public","SWAC",null,10024,"@aaboramubsb","@AAMU_Baseball","Michael Lockhart","baseball@aamu.edu","Tommy Hunter","baseball@aamu.edu","https://aamusports.com/sports/baseball"],
  ["Alcorn State","Braves","Lorman","MS","39096",31.872,-91.136,"Public","SWAC",null,7670,"@alcornbaseball","@AlcornStateBSB","Brett Richardson","baseball@alcorn.edu","Landon Griffin","baseball@alcorn.edu","https://alcornsports.com/sports/baseball"],
  ["Texas Southern","Tigers","Houston","TX","77004",29.724,-95.358,"Public","SWAC",null,9900,"@txsobaseball","@TSUBaseball","Michael Robertson","baseball@tsu.edu","Joey Davis","baseball@tsu.edu","https://tsusports.com/sports/baseball"],
  ["Prairie View A&M","Panthers","Prairie View","TX","77446",30.093,-95.988,"Public","SWAC",null,9710,"@pvamubsb","@PVAMU_Baseball","Waskyla Cullivan","baseball@pvamu.edu","AJ Nettleton","baseball@pvamu.edu","https://pvpanthers.com/sports/baseball"],
  ["Arkansas-Pine Bluff","Golden Lions","Pine Bluff","AR","71601",34.229,-92.003,"Public","SWAC",null,8276,"@uapbbaseball","@UAPB_BSB","Carlos James","baseball@uapb.edu","Freddie Booker","baseball@uapb.edu","https://uapblionsroar.com/sports/baseball"],
  ["Bethune-Cookman","Wildcats","Daytona Beach","FL","32114",29.222,-81.016,"Private","SWAC",null,15130,"@bcubaseball","@BCU_Baseball","Jonathan Hernandez","baseball@cookman.edu","Greg Marron","baseball@cookman.edu","https://bcuathletics.com/sports/baseball"],
  ["Mississippi Valley State","Delta Devils","Itta Bena","MS","38941",33.499,-90.330,"Public","SWAC",null,7324,"@mvsubaseball","@MVSU_Baseball","Aaron Stevens","baseball@mvsu.edu","Jeremy Brown","baseball@mvsu.edu","https://mvsusports.com/sports/baseball"],
  ["Florida A&M","Rattlers","Tallahassee","FL","32307",30.424,-84.285,"Public","SWAC",null,5785,"@famubaseball","@FAMU_Baseball","Jamey Shouppe","baseball@famu.edu","Bryan Henry","baseball@famu.edu","https://famuathletics.com/sports/baseball"],
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

const total = (db.prepare("SELECT COUNT(*) as c FROM schools").get() as {c:number}).c;
const breakdown = db.prepare("SELECT conference, COUNT(*) as count FROM schools GROUP BY conference ORDER BY conference").all() as {conference:string,count:number}[];

console.log(`Part 2: added ${schools.length} more D1 schools`);
console.log(`Total in database: ${total} D1 programs`);
console.log("\nBreakdown by conference:");
for (const row of breakdown) {
  console.log(`  ${row.conference}: ${row.count}`);
}

db.close();
