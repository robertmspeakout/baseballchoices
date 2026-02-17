// Client-side school matching engine
// Scores all schools against player preferences using weighted criteria

import { type PlayerProfile, type PlayerPreferences } from "./playerProfile";
import { haversineDistance } from "./geo";

interface SchoolData {
  id: number;
  name: string;
  mascot: string;
  city: string;
  state: string;
  division: string;
  public_private: string;
  conference: string;
  current_ranking: number | null;
  tuition: number | null;
  enrollment: number | null;
  acceptance_rate: number | null;
  graduation_rate: number | null;
  last_season_record: string | null;
  logo_url: string | null;
  latitude: number | null;
  longitude: number | null;
  cws_appearances: number;
  ncaa_regionals: number;
  mlb_draft_picks: number;
  scholarship_limit: number;
  head_coach_name: string | null;
}

export interface MatchResult {
  school: SchoolData;
  score: number; // 0-100
  distance: number | null; // miles
  reasons: string[]; // human-readable match reasons
}

// Weights for each scoring category (must sum to 100)
const WEIGHTS = {
  division: 15,
  distance: 15,
  stateRegion: 8,
  tuition: 13,
  schoolSize: 7,
  publicPrivate: 5,
  academics: 10,
  competitiveness: 15,
  draftPicks: 7,
  conference: 5,
};

function categorizeSize(enrollment: number | null): "small" | "medium" | "large" | null {
  if (enrollment == null) return null;
  if (enrollment < 5000) return "small";
  if (enrollment <= 15000) return "medium";
  return "large";
}

export function scoreSchool(
  school: SchoolData,
  profile: PlayerProfile,
  prefs: PlayerPreferences,
  homeCoords: { lat: number; lng: number } | null
): MatchResult {
  let score = 0;
  const reasons: string[] = [];
  let distance: number | null = null;

  // --- Division (15 pts) ---
  if (prefs.divisionPreference === "both" || school.division === prefs.divisionPreference) {
    score += WEIGHTS.division;
    if (prefs.divisionPreference !== "both") {
      reasons.push(`${school.division} program — matches your preference`);
    }
  } else {
    // Hard filter: wrong division gets 0 for this category
  }

  // --- Distance (15 pts) ---
  if (homeCoords && school.latitude && school.longitude) {
    distance = haversineDistance(homeCoords.lat, homeCoords.lng, school.latitude, school.longitude);

    if (prefs.maxDistanceFromHome == null) {
      // No distance preference = full points
      score += WEIGHTS.distance;
    } else if (distance <= prefs.maxDistanceFromHome) {
      score += WEIGHTS.distance;
      reasons.push(`${distance.toLocaleString()} miles from home — within your ${prefs.maxDistanceFromHome}-mile range`);
    } else {
      // Graduated penalty: lose 1 point per 100 miles over
      const over = distance - prefs.maxDistanceFromHome;
      const penalty = Math.min(WEIGHTS.distance, over / 100);
      score += Math.max(0, WEIGHTS.distance - penalty);
    }
  } else {
    // Can't calculate = give half credit
    score += WEIGHTS.distance * 0.5;
  }

  // --- State/Region (8 pts) ---
  if (prefs.preferredStates.length === 0) {
    score += WEIGHTS.stateRegion;
  } else if (prefs.preferredStates.includes(school.state)) {
    score += WEIGHTS.stateRegion;
    reasons.push(`Located in ${school.state} — one of your preferred states`);
  } else {
    // Not in preferred states = 0
  }

  // --- Tuition (13 pts) ---
  if (prefs.maxTuition == null) {
    score += WEIGHTS.tuition;
  } else if (school.tuition == null) {
    score += WEIGHTS.tuition * 0.5; // Unknown tuition = half credit
  } else if (school.tuition <= prefs.maxTuition) {
    score += WEIGHTS.tuition;
    const savings = prefs.maxTuition - school.tuition;
    if (savings > 5000) {
      reasons.push(`Tuition $${school.tuition.toLocaleString()}/yr — $${savings.toLocaleString()} under your budget`);
    } else {
      reasons.push(`Tuition $${school.tuition.toLocaleString()}/yr — within budget`);
    }
  } else {
    const overage = (school.tuition - prefs.maxTuition) / prefs.maxTuition;
    score += Math.max(0, WEIGHTS.tuition * (1 - overage));
  }

  // --- School Size (7 pts) ---
  if (prefs.schoolSize === "any") {
    score += WEIGHTS.schoolSize;
  } else {
    const size = categorizeSize(school.enrollment);
    if (size === prefs.schoolSize) {
      score += WEIGHTS.schoolSize;
      const sizeLabel = prefs.schoolSize === "small" ? "Small campus" :
        prefs.schoolSize === "medium" ? "Mid-size campus" : "Large campus";
      reasons.push(`${sizeLabel} (${school.enrollment?.toLocaleString()} students)`);
    } else if (size == null) {
      score += WEIGHTS.schoolSize * 0.5;
    } else {
      // Adjacent size gets partial credit
      const sizes = ["small", "medium", "large"];
      const diff = Math.abs(sizes.indexOf(size) - sizes.indexOf(prefs.schoolSize));
      score += diff === 1 ? WEIGHTS.schoolSize * 0.4 : 0;
    }
  }

  // --- Public/Private (5 pts) ---
  if (prefs.publicPrivate === "any" || school.public_private?.toLowerCase() === prefs.publicPrivate) {
    score += WEIGHTS.publicPrivate;
  }

  // --- Academic Fit (10 pts) ---
  if (profile.gpa && school.acceptance_rate) {
    // Higher GPA relative to acceptance rate = more likely admitted
    // A 4.0 GPA at a 50% acceptance school = great fit
    // A 2.5 GPA at a 10% acceptance school = poor fit
    const gpaStrength = profile.gpa / 4.0; // 0-1
    const admitDifficulty = 1 - school.acceptance_rate / 100; // Convert from int % to 0-1
    const fit = gpaStrength - admitDifficulty;
    if (fit >= 0) {
      score += WEIGHTS.academics;
      if (school.graduation_rate && school.graduation_rate > 70) {
        reasons.push(`${Math.round(school.graduation_rate)}% graduation rate`);
      }
    } else {
      // Partial credit - closer to threshold = more credit
      score += Math.max(0, WEIGHTS.academics * (1 + fit * 2));
    }
  } else {
    score += WEIGHTS.academics * 0.5; // Can't evaluate = half credit
  }

  // --- Competitiveness (15 pts) ---
  const isTop25 = school.current_ranking != null && school.current_ranking <= 25;
  const hasPostseason = school.ncaa_regionals > 0 || school.cws_appearances > 0;

  if (prefs.competitiveness === "any") {
    score += WEIGHTS.competitiveness;
  } else if (prefs.competitiveness === "top25") {
    if (isTop25) {
      score += WEIGHTS.competitiveness;
      reasons.push(`Ranked #${school.current_ranking} nationally`);
    } else if (hasPostseason) {
      score += WEIGHTS.competitiveness * 0.5;
    }
  } else if (prefs.competitiveness === "postseason") {
    if (hasPostseason || isTop25) {
      score += WEIGHTS.competitiveness;
      if (school.cws_appearances > 0) {
        reasons.push(`${school.cws_appearances} College World Series appearance${school.cws_appearances > 1 ? "s" : ""}`);
      } else if (school.ncaa_regionals > 0) {
        reasons.push(`${school.ncaa_regionals} NCAA Regional appearance${school.ncaa_regionals > 1 ? "s" : ""}`);
      }
    } else {
      score += WEIGHTS.competitiveness * 0.3;
    }
  }

  // --- Draft Picks (7 pts) ---
  if (prefs.draftImportance === "yes") {
    if (school.mlb_draft_picks > 5) {
      score += WEIGHTS.draftPicks;
      reasons.push(`${school.mlb_draft_picks} MLB draft picks — strong pipeline`);
    } else if (school.mlb_draft_picks > 0) {
      score += WEIGHTS.draftPicks * 0.6;
      reasons.push(`${school.mlb_draft_picks} MLB draft pick${school.mlb_draft_picks > 1 ? "s" : ""}`);
    }
  } else {
    score += WEIGHTS.draftPicks; // Not important = full credit for all
  }

  // --- Conference (5 pts) ---
  if (prefs.preferredConferences.length === 0) {
    score += WEIGHTS.conference;
  } else if (prefs.preferredConferences.includes(school.conference)) {
    score += WEIGHTS.conference;
    reasons.push(`${school.conference} — one of your preferred conferences`);
  }

  return {
    school,
    score: Math.round(Math.min(100, Math.max(0, score))),
    distance,
    reasons: reasons.slice(0, 4), // Cap at 4 reasons
  };
}

export function getMatchResults(
  schools: SchoolData[],
  profile: PlayerProfile,
  prefs: PlayerPreferences,
  homeCoords: { lat: number; lng: number } | null
): MatchResult[] {
  // First, apply hard filters
  let filtered = schools;

  // Division hard filter (if specific preference)
  if (prefs.divisionPreference !== "both") {
    filtered = filtered.filter((s) => s.division === prefs.divisionPreference);
  }

  // Score remaining schools
  const results = filtered.map((school) =>
    scoreSchool(school, profile, prefs, homeCoords)
  );

  // Sort by score descending, then by distance ascending
  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.distance != null && b.distance != null) return a.distance - b.distance;
    return 0;
  });

  return results;
}
