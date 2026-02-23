import type { UserData } from "./userData";

export interface LevelInfo {
  level: number;
  name: string;
  description: string;
  color: string;       // Tailwind bg class for the badge
  textColor: string;   // Tailwind text class
  borderColor: string; // Tailwind border class
}

const LEVELS: LevelInfo[] = [
  { level: 1, name: "Rookie",     description: "Welcome to the game",   color: "bg-gray-500",    textColor: "text-gray-500",    borderColor: "border-gray-400" },
  { level: 2, name: "Scout",      description: "Building your list",    color: "bg-blue-600",    textColor: "text-blue-600",    borderColor: "border-blue-500" },
  { level: 3, name: "Prospect",   description: "On the radar",          color: "bg-emerald-600", textColor: "text-emerald-600", borderColor: "border-emerald-500" },
  { level: 4, name: "Contender",  description: "Making connections",    color: "bg-red-600",     textColor: "text-red-600",     borderColor: "border-red-500" },
  { level: 5, name: "All-Star",   description: "Recruiting pro",        color: "bg-yellow-500",  textColor: "text-yellow-600",  borderColor: "border-yellow-400" },
];

/**
 * Compute a player's level based on their recruiting activity.
 *
 * Level 1 (Rookie)     — Default starting level
 * Level 2 (Scout)      — 5+ schools rated
 * Level 3 (Prospect)   — 10+ schools rated AND 3+ with a recruiting status
 * Level 4 (Contender)  — 15+ schools rated AND 5+ contacted
 * Level 5 (All-Star)   — 20+ schools rated AND 10+ contacted AND has an offer or commitment
 */
export function computeLevel(userData: Record<string, UserData>): LevelInfo {
  const entries = Object.values(userData);

  const rated = entries.filter((ud) => ud.priority > 0).length;
  const withStatus = entries.filter((ud) => ud.recruiting_status && ud.recruiting_status !== "Researching").length;
  const contacted = entries.filter((ud) => ud.last_contacted).length;
  const hasOfferOrCommitted = entries.some(
    (ud) => ud.recruiting_status === "Offer" || ud.recruiting_status === "Committed"
  );

  if (rated >= 20 && contacted >= 10 && hasOfferOrCommitted) return LEVELS[4]; // All-Star
  if (rated >= 15 && contacted >= 5)                         return LEVELS[3]; // Contender
  if (rated >= 10 && withStatus >= 3)                        return LEVELS[2]; // Prospect
  if (rated >= 5)                                            return LEVELS[1]; // Scout
  return LEVELS[0]; // Rookie
}
