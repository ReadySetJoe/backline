/**
 * Matching Algorithm — Individual Scoring Functions
 *
 * Each function returns a score between 0.0 and 1.0.
 * The totalScore function applies weights and returns 0–100.
 */

const WEIGHTS = {
  genre: 0.3,
  location: 0.25,
  capacityDraw: 0.2,
  availability: 0.15,
  compensation: 0.1,
} as const;

/**
 * Genre match using Jaccard similarity (intersection / union).
 * Returns 0.0 if either set is empty.
 */
export function genreScore(
  artistGenres: string[],
  showGenres: string[]
): number {
  if (artistGenres.length === 0 || showGenres.length === 0) return 0;

  const setA = new Set(artistGenres);
  const setB = new Set(showGenres);
  const intersection = new Set(Array.from(setA).filter((x) => setB.has(x)));
  const union = new Set([...Array.from(setA), ...Array.from(setB)]);

  return intersection.size / union.size;
}

/**
 * Location match — city name match (case-insensitive).
 * Extracts city name before comma (e.g., "Columbus, OH" → "columbus").
 * Returns 1.0 for same city, 0.0 otherwise.
 */
export function locationScore(
  artistLocation: string,
  venueCity: string
): number {
  const normalize = (s: string) => s.split(",")[0].toLowerCase().trim();
  return normalize(artistLocation) === normalize(venueCity) ? 1.0 : 0.0;
}

/**
 * Capacity/draw fit score.
 * Sweet spot: draw is 60–90% of capacity (returns 1.0).
 * Score degrades as the ratio moves away from this range.
 * Returns 0 if draw or capacity is null/undefined.
 */
export function capacityDrawScore(
  draw: number | null | undefined,
  capacity: number | null | undefined
): number {
  if (!draw || !capacity) return 0;

  const ratio = draw / capacity;
  const ideal = 0.75;
  const distance = Math.abs(ratio - ideal);

  // Sweet spot: 60-90% of capacity
  if (ratio >= 0.6 && ratio <= 0.9) return 1.0;

  // Over capacity: penalize more steeply
  if (ratio > 1.0) return Math.max(0, 1.0 - (ratio - 1.0) * 2);

  // Under or slightly over sweet spot
  return Math.max(0, 1.0 - distance * 2);
}

/**
 * Availability preference match.
 * Uses UTC day to avoid timezone issues with date-only strings.
 *
 * ANY_NIGHT: always 1.0
 * WEEKENDS: 1.0 for Fri/Sat/Sun, 0.0 otherwise
 * WEEKNIGHTS: 1.0 for Mon–Thu, 0.0 otherwise
 * SPECIFIC_DATES: 0.5 (neutral — requires separate date check)
 */
export function availabilityScore(
  preference: string,
  showDate: Date
): number {
  if (preference === "ANY_NIGHT") return 1.0;

  const day = showDate.getUTCDay();
  const isWeekend = day === 0 || day === 5 || day === 6; // Sun, Fri, Sat

  if (preference === "WEEKENDS") return isWeekend ? 1.0 : 0.0;
  if (preference === "WEEKNIGHTS") return isWeekend ? 0.0 : 1.0;

  return 0.5; // SPECIFIC_DATES or unknown
}

/**
 * Compensation match score.
 * MVP: returns 0.5 (neutral) for all inputs since artist
 * compensation preference is not yet captured.
 */
export function compensationScore(
  showCompensationType: string | null,
  _artistPreference?: string | null
): number {
  return 0.5; // MVP: neutral
}

/**
 * Compute weighted total score from individual scores.
 * Returns a rounded integer between 0 and 100.
 *
 * Weights:
 *   genre:        30%
 *   location:     25%
 *   capacityDraw: 20%
 *   availability: 15%
 *   compensation: 10%
 */
export function totalScore(scores: {
  genre: number;
  location: number;
  capacityDraw: number;
  availability: number;
  compensation: number;
}): number {
  return Math.round(
    (scores.genre * WEIGHTS.genre +
      scores.location * WEIGHTS.location +
      scores.capacityDraw * WEIGHTS.capacityDraw +
      scores.availability * WEIGHTS.availability +
      scores.compensation * WEIGHTS.compensation) *
      100
  );
}
