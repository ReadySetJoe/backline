# Distance-Based Match Filtering

## Problem

The matching algorithm uses binary city-name matching for location scoring — same city = 1.0, different city = 0.0. This means a band 30 miles away in a neighboring city scores identically to one 1,000 miles away. The platform is for booking local acts, so matches should be distance-aware with a hard cutoff.

## Solution

Store latitude/longitude coordinates on artist and venue profiles, captured at input time from the existing Google Places Autocomplete geocode response. Use Haversine distance to replace binary city matching with graduated scoring and a 150-mile hard cutoff.

## Design

### Database: Add coordinate columns

Add `latitude Float?` and `longitude Float?` to both `ArtistProfile` and `VenueProfile`. Nullable so existing users without coordinates still work until they update their profile.

### PlacesAutocomplete: Extract lat/lng from existing geocode

The `handleSelect` function already calls `getGeocode()` which returns `results[0].geometry.location`. Extract `.lat()` and `.lng()` and pass them through the `onPlaceSelect` callback by extending `PlaceDetails` to include `latitude` and `longitude`.

### Onboarding/profile forms: Pass coordinates to server actions

Forms using PlacesAutocomplete capture lat/lng from `onPlaceSelect` and include them in the server action payload. Update Zod schemas to accept optional `latitude`/`longitude` fields.

### Scoring: Graduated distance scoring with hard cutoff

- Replace `locationScore(artistLocation, venueCity)` with `locationScore(artistLat, artistLng, venueLat, venueLng)` using Haversine distance.
- Score: 1.0 at 0 miles, linearly decreasing to 0.0 at 150 miles.
- Add `haversineDistance(lat1, lng1, lat2, lng2)` pure function in `score.ts`.
- Add `MAX_MATCH_DISTANCE_MILES = 150` constant.

### Match generation: Hard cutoff

In `generate.ts`, compute distance before scoring. If distance > 150 miles, skip match creation entirely. When either party is missing coordinates, fall back to city-name matching.

### Seed file: Hardcode coordinates

Add `latitude` and `longitude` to `ArtistSeed` and `VenueSeed` types and provide coordinates for all seed locations.

### Tests

Update `score.test.ts` for new `locationScore` signature with coordinate inputs. Add Haversine distance tests. Add cutoff boundary tests.

## Decisions

- **Hard cutoff at 150 miles** — artists beyond this radius are never matched. Global default, not configurable per-venue (can add later).
- **Graduated scoring within radius** — closer artists score higher than farther ones, improving match quality.
- **Nullable coordinates** — graceful fallback to city-name matching for profiles without coordinates.
- **No additional API calls** — coordinates come from the geocode response already being fetched.
