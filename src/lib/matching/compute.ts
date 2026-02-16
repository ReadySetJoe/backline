/**
 * Matching Algorithm — Combined Score Computation
 *
 * Combines individual scoring functions into a single match score
 * for an artist/show pair.
 */

import {
  genreScore,
  locationScore,
  capacityDrawScore,
  availabilityScore,
  compensationScore,
  totalScore,
  haversineDistance,
  MAX_MATCH_DISTANCE_MILES,
} from "./score";

export interface ArtistMatchData {
  genres: string[];
  location: string;
  latitude: number | null;
  longitude: number | null;
  drawEstimate: number | null;
  availabilityPreference: string;
}

export interface ShowMatchData {
  genres: string[];
  venueCity: string;
  venueLatitude: number | null;
  venueLongitude: number | null;
  venueCapacity: number;
  showDate: Date;
  compensationType: string | null;
}

/**
 * Compute the overall match score (0–100) for an artist/show pair.
 *
 * Combines weighted scores across:
 *   - Genre similarity (Jaccard, 30%)
 *   - Location match (25%)
 *   - Capacity/draw fit (20%)
 *   - Availability preference (15%)
 *   - Compensation alignment (10%)
 */
export function computeMatchScore(
  artist: ArtistMatchData,
  show: ShowMatchData,
): number {
  return totalScore({
    genre: genreScore(artist.genres, show.genres),
    location: locationScore(
      artist.latitude,
      artist.longitude,
      show.venueLatitude,
      show.venueLongitude,
    ),
    capacityDraw: capacityDrawScore(artist.drawEstimate, show.venueCapacity),
    availability: availabilityScore(
      artist.availabilityPreference,
      show.showDate,
    ),
    compensation: compensationScore(show.compensationType),
  });
}

/**
 * Returns true if the artist is within the max match distance of the venue,
 * or if either is missing coordinates (fallback to score-based filtering).
 */
export function isWithinMatchDistance(
  artist: ArtistMatchData,
  show: ShowMatchData,
): boolean {
  if (
    artist.latitude == null ||
    artist.longitude == null ||
    show.venueLatitude == null ||
    show.venueLongitude == null
  ) {
    return true; // Allow match, let score handle it
  }
  return (
    haversineDistance(
      artist.latitude,
      artist.longitude,
      show.venueLatitude,
      show.venueLongitude,
    ) <= MAX_MATCH_DISTANCE_MILES
  );
}
