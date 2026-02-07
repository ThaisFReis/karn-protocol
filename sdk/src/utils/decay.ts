/**
 * Client-side Mana decay calculation
 */

const MEMBER_FLOOR = 5;
const VACANCY_PERIOD = 15552000; // 180 days in seconds

/**
 * Calculate current Mana based on level and last activity
 *
 * Formula: Mana = floor + bonus
 * - floor = MEMBER_FLOOR (fixed constant, e.g. 5)
 * - extra_level = level - floor
 * - bonus = (extra_level * time_remaining) / VACANCY_PERIOD
 *
 * @param level Total level (including permanent)
 * @param permanentLevel Permanent level (Founder badge)
 * @param expiry Expiry timestamp (Unix seconds)
 * @param currentTimestamp Current timestamp (Unix seconds)
 * @returns Current Mana
 */
export function calculateMana(
  level: number,
  permanentLevel: number,
  expiry: number,
  currentTimestamp: number
): number {
  // 1. Calculate decaying portion
  const decayingLevel = Math.max(0, level - permanentLevel);

  
  // 2. Calculate time remaining
  const timeRemaining = Math.max(0, expiry - currentTimestamp);
  
  // 3. Calculate bonus
  // Use Math.floor to match integer arithmetic
  // bonus = (DecayingLevel * TimeRemaining) / VacancyPeriod
  const bonus = Math.floor((decayingLevel * timeRemaining) / VACANCY_PERIOD);
  
  // 4. Default floor logic
  // Contract: Mana = MemberFloor + bonus + PermanentLevel

  return MEMBER_FLOOR + bonus + permanentLevel;
}
