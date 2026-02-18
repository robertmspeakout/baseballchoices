// Player profile and preferences - stored in localStorage

// Region-to-states mapping (single source of truth)
export const REGIONS: Record<string, string[]> = {
  "Northeast": ["ME","NH","VT","MA","RI","CT","NY","NJ","PA"],
  "Mid-Atlantic": ["DE","MD","VA","WV","NC","SC"],
  "Southeast": ["GA","FL","AL","MS","TN","KY"],
  "Midwest": ["OH","MI","IN","IL","WI","MN","IA","MO"],
  "Great Plains": ["ND","SD","NE","KS","OK"],
  "Texas": ["TX"],
  "Mountain West": ["MT","ID","WY","CO","UT","NV","NM","AZ"],
  "Pacific NW": ["WA","OR","AK"],
  "California": ["CA","HI"],
};

// Convert region names to state codes
export function regionsToStates(regions: string[]): string[] {
  const states: string[] = [];
  for (const region of regions) {
    if (REGIONS[region]) {
      states.push(...REGIONS[region]);
    }
  }
  return states;
}

export interface PlayerProfile {
  // Basic info (existing fields from current profile)
  playerName: string;
  gradYear: string;
  primaryPosition: string;
  secondaryPosition: string;
  city: string;
  state: string;
  highSchool: string;
  travelBall: string;
  profilePic: string | null;
  backgroundPic: string | null;
  // Zip for distance
  zipCode: string;
  // Academics
  gpa: number | null;
  gpaType: "weighted" | "unweighted" | "";
  satScore: number | null;
  actScore: number | null;
}

export interface PlayerPreferences {
  divisionPreference: "D1" | "D2" | "both";
  maxDistanceFromHome: number | null; // miles, null = any
  preferredRegions: string[]; // Region names like "Pacific NW", "Southeast"
  maxTuition: number | null; // dollars, null = any
  schoolSize: "small" | "medium" | "large" | "any"; // small <5K, med 5-15K, large 15K+
  highAcademic: boolean;
  competitiveness: "top25" | "postseason" | "any";
  // top25 = currently ranked or frequently ranked
  // postseason = has regional/CWS appearances
  draftImportance: "yes" | "no"; // wants a school that produces draft picks
  preferredConferences: string[];
  preferredTiers: string[]; // "Power", "High-Major", "Mid-Major", "Low-Major"
}

const PROFILE_KEY = "nextbase_profile";
const PREFS_KEY = "nextbase_preferences";

const DEFAULT_PROFILE: PlayerProfile = {
  playerName: "",
  gradYear: "",
  primaryPosition: "",
  secondaryPosition: "",
  city: "",
  state: "",
  highSchool: "",
  travelBall: "",
  profilePic: null,
  backgroundPic: null,
  zipCode: "",
  gpa: null,
  gpaType: "",
  satScore: null,
  actScore: null,
};

const DEFAULT_PREFERENCES: PlayerPreferences = {
  divisionPreference: "both",
  maxDistanceFromHome: null,
  preferredRegions: [],
  maxTuition: null,
  schoolSize: "any",
  highAcademic: false,
  competitiveness: "any",
  draftImportance: "no",
  preferredConferences: [],
  preferredTiers: [],
};

export function loadProfile(): PlayerProfile {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveProfile(profile: Partial<PlayerProfile>) {
  if (typeof window === "undefined") return;
  const existing = loadProfile();
  localStorage.setItem(PROFILE_KEY, JSON.stringify({ ...existing, ...profile }));
}

export function loadPreferences(): PlayerPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(prefs: Partial<PlayerPreferences>) {
  if (typeof window === "undefined") return;
  const existing = loadPreferences();
  localStorage.setItem(PREFS_KEY, JSON.stringify({ ...existing, ...prefs }));
}

export function isProfileComplete(profile: PlayerProfile): boolean {
  return !!(profile.playerName && profile.gradYear && profile.primaryPosition);
}

export function isPreferencesComplete(prefs: PlayerPreferences): boolean {
  return prefs.divisionPreference !== "both" ||
    prefs.maxDistanceFromHome !== null ||
    prefs.maxTuition !== null ||
    prefs.competitiveness !== "any";
}
