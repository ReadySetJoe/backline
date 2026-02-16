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

export const MAX_MATCH_DISTANCE_MILES = 150;

/**
 * Haversine formula — straight-line distance in miles between two lat/lng points.
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 3958.8; // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Genre match using Jaccard similarity (intersection / union).
 * Returns 0.0 if either set is empty.
 */
export function genreScore(
  artistGenres: string[],
  showGenres: string[],
): number {
  if (artistGenres.length === 0 || showGenres.length === 0) return 0;

  const setA = new Set(artistGenres);
  const setB = new Set(showGenres);
  const intersection = new Set(Array.from(setA).filter((x) => setB.has(x)));
  const union = new Set([...Array.from(setA), ...Array.from(setB)]);

  return intersection.size / union.size;
}

/**
 * Location match — graduated distance scoring.
 * Returns 1.0 at 0 miles, linearly decreasing to 0.0 at MAX_MATCH_DISTANCE_MILES.
 * Returns 0.0 if any coordinate is null (profile missing coordinates).
 */
export function locationScore(
  artistLat: number | null,
  artistLng: number | null,
  venueLat: number | null,
  venueLng: number | null,
): number {
  if (
    artistLat == null ||
    artistLng == null ||
    venueLat == null ||
    venueLng == null
  ) {
    return 0.0;
  }

  const distance = haversineDistance(artistLat, artistLng, venueLat, venueLng);
  if (distance >= MAX_MATCH_DISTANCE_MILES) return 0.0;

  return 1.0 - distance / MAX_MATCH_DISTANCE_MILES;
}

/**
 * Capacity/draw fit score.
 * Sweet spot: draw is 60–90% of capacity (returns 1.0).
 * Score degrades as the ratio moves away from this range.
 * Returns 0 if draw or capacity is null/undefined.
 */
export function capacityDrawScore(
  draw: number | null | undefined,
  capacity: number | null | undefined,
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
export function availabilityScore(preference: string, showDate: Date): number {
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
  _artistPreference?: string | null,
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
      100,
  );
}
