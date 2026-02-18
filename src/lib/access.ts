/** Check if user has active access (trial still valid or membership active) */
export function hasAccess(user: {
  membershipActive: boolean;
  trialExpiresAt: string;
}): boolean {
  if (user.membershipActive) return true;
  return new Date(user.trialExpiresAt) > new Date();
}

/** Check if user's trial has expired */
export function isTrialExpired(trialExpiresAt: string): boolean {
  return new Date(trialExpiresAt) <= new Date();
}

/** Days remaining on trial */
export function trialDaysRemaining(trialExpiresAt: string): number {
  const diff = new Date(trialExpiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
