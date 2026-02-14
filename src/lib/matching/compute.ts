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
} from "./score";

export interface ArtistMatchData {
  genres: string[];
  location: string;
  drawEstimate: number | null;
  availabilityPreference: string;
}

export interface ShowMatchData {
  genres: string[];
  venueCity: string;
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
  show: ShowMatchData
): number {
  return totalScore({
    genre: genreScore(artist.genres, show.genres),
    location: locationScore(artist.location, show.venueCity),
    capacityDraw: capacityDrawScore(artist.drawEstimate, show.venueCapacity),
    availability: availabilityScore(artist.availabilityPreference, show.showDate),
    compensation: compensationScore(show.compensationType),
  });
}
