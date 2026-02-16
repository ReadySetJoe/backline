import { db } from "@/lib/db";
import { computeMatchScore, isWithinMatchDistance } from "./compute";

/**
 * Generate matches for a specific show.
 * Computes scores for all artists and upserts Match records.
 */
export async function generateMatchesForShow(showId: string) {
  const show = await db.show.findUnique({
    where: { id: showId },
    include: {
      venue: true,
      genres: true,
    },
  });

  if (!show || show.status !== "OPEN") return;

  const artists = await db.artistProfile.findMany({
    include: { genres: true },
  });

  const showGenreSlugs = show.genres.map((g) => g.slug);

  for (const artist of artists) {
    const artistData = {
      genres: artist.genres.map((g) => g.slug),
      location: artist.location,
      latitude: artist.latitude,
      longitude: artist.longitude,
      drawEstimate: artist.drawEstimate,
      availabilityPreference: artist.availabilityPreference,
    };

    const showData = {
      genres: showGenreSlugs,
      venueCity: show.venue.city,
      venueLatitude: show.venue.latitude,
      venueLongitude: show.venue.longitude,
      venueCapacity: show.venue.capacity,
      showDate: show.date,
      compensationType: show.compensationType,
    };

    // Hard distance cutoff — skip artists beyond max range
    if (!isWithinMatchDistance(artistData, showData)) continue;

    const score = computeMatchScore(artistData, showData);

    if (score >= 10) {
      await db.match.upsert({
        where: {
          artistId_showId: { artistId: artist.id, showId: show.id },
        },
        create: {
          artistId: artist.id,
          showId: show.id,
          score,
        },
        update: {
          score,
        },
      });
    }
  }
}

/**
 * Generate matches for all open shows.
 */
export async function generateAllMatches() {
  const openShows = await db.show.findMany({
    where: { status: "OPEN" },
    select: { id: true },
  });

  for (const show of openShows) {
    await generateMatchesForShow(show.id);
  }

  return { processed: openShows.length };
}
