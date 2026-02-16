# Distance-Based Match Filtering Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace binary city-name location matching with Haversine distance scoring and a 150-mile hard cutoff so only local/regional artists are matched to shows.

**Architecture:** Store lat/lng coordinates on ArtistProfile and VenueProfile (captured from the existing Google Places geocode response). Compute Haversine distance at match generation time. Skip matches beyond 150 miles. Graduate location score from 1.0 (0 mi) to 0.0 (150 mi).

**Tech Stack:** Prisma (schema migration), TypeScript, Vitest, Google Maps Places API (already integrated)

---

### Task 1: Prisma Schema Migration

**Files:**

- Modify: `prisma/schema.prisma:117-141` (ArtistProfile model)
- Modify: `prisma/schema.prisma:143-165` (VenueProfile model)

**Step 1: Add latitude/longitude columns to both models**

In `prisma/schema.prisma`, add to `ArtistProfile` after `location` (line 125):

```prisma
latitude           Float?
longitude          Float?
```

Add to `VenueProfile` after `city` (line 151):

```prisma
latitude           Float?
longitude          Float?
```

**Step 2: Create and apply migration**

Run: `npx prisma migrate dev --name add-lat-lng-coordinates`
Expected: Migration created and applied successfully.

**Step 3: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add latitude/longitude columns to ArtistProfile and VenueProfile"
```

---

### Task 2: Haversine Distance Function (TDD)

**Files:**

- Modify: `src/lib/matching/score.ts`
- Modify: `src/lib/matching/__tests__/score.test.ts`

**Step 1: Write failing tests for haversineDistance**

Add to `src/lib/matching/__tests__/score.test.ts`:

```typescript
import {
  genreScore,
  locationScore,
  capacityDrawScore,
  availabilityScore,
  compensationScore,
  totalScore,
  haversineDistance,
  MAX_MATCH_DISTANCE_MILES,
} from "../score";

describe("haversineDistance", () => {
  it("returns 0 for identical coordinates", () => {
    expect(haversineDistance(34.8526, -82.394, 34.8526, -82.394)).toBe(0);
  });

  it("computes correct distance between Greenville SC and Asheville NC (~60 mi)", () => {
    const dist = haversineDistance(34.8526, -82.394, 35.5951, -82.5515);
    expect(dist).toBeGreaterThan(55);
    expect(dist).toBeLessThan(65);
  });

  it("computes correct distance between NYC and Hoboken NJ (~3 mi)", () => {
    const dist = haversineDistance(40.7128, -74.006, 40.744, -74.0324);
    expect(dist).toBeGreaterThan(2);
    expect(dist).toBeLessThan(5);
  });

  it("computes correct distance between NYC and Austin TX (~1700 mi)", () => {
    const dist = haversineDistance(40.7128, -74.006, 30.2672, -97.7431);
    expect(dist).toBeGreaterThan(1600);
    expect(dist).toBeLessThan(1800);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm run test`
Expected: FAIL — `haversineDistance` is not exported.

**Step 3: Implement haversineDistance and MAX_MATCH_DISTANCE_MILES**

Add to `src/lib/matching/score.ts` at the top (after the WEIGHTS constant):

```typescript
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
```

**Step 4: Run tests to verify they pass**

Run: `npm run test`
Expected: All haversineDistance tests PASS.

**Step 5: Commit**

```bash
git add src/lib/matching/score.ts src/lib/matching/__tests__/score.test.ts
git commit -m "feat: add haversineDistance function with tests"
```

---

### Task 3: Update locationScore to Use Coordinates (TDD)

**Files:**

- Modify: `src/lib/matching/score.ts:38-45` (locationScore function)
- Modify: `src/lib/matching/__tests__/score.test.ts:39-55` (locationScore tests)

**Step 1: Replace locationScore tests**

Replace the existing `describe("locationScore", ...)` block in `score.test.ts` with:

```typescript
describe("locationScore", () => {
  it("returns 1.0 for same coordinates (0 miles)", () => {
    expect(locationScore(34.8526, -82.394, 34.8526, -82.394)).toBe(1.0);
  });

  it("returns high score for nearby coordinates (~3 mi, NYC to Hoboken)", () => {
    const score = locationScore(40.7128, -74.006, 40.744, -74.0324);
    expect(score).toBeGreaterThan(0.95);
  });

  it("returns moderate score for ~75 miles (half of max)", () => {
    // Greenville SC to Atlanta GA is ~145 miles
    // Use Nashville to Murfreesboro (~34 miles) for a mid-range test
    const score = locationScore(36.1627, -86.7816, 35.8456, -86.3903);
    expect(score).toBeGreaterThan(0.7);
    expect(score).toBeLessThan(0.85);
  });

  it("returns 0.0 for coordinates beyond 150 miles", () => {
    // NYC to Columbus OH (~530 miles)
    expect(locationScore(40.7128, -74.006, 39.9612, -82.9988)).toBe(0.0);
  });

  it("returns 0.0 when any coordinate is null (fallback disabled)", () => {
    expect(locationScore(null, null, 34.8526, -82.394)).toBe(0.0);
    expect(locationScore(34.8526, -82.394, null, null)).toBe(0.0);
    expect(locationScore(null, null, null, null)).toBe(0.0);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm run test`
Expected: FAIL — locationScore still expects string arguments.

**Step 3: Replace locationScore implementation**

Replace the `locationScore` function in `src/lib/matching/score.ts`:

```typescript
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
```

**Step 4: Run tests to verify they pass**

Run: `npm run test`
Expected: locationScore tests PASS, but `compute.test.ts` will now fail (expected — next task fixes it).

**Step 5: Commit**

```bash
git add src/lib/matching/score.ts src/lib/matching/__tests__/score.test.ts
git commit -m "feat: replace binary locationScore with graduated distance scoring"
```

---

### Task 4: Update Compute Layer and Match Generation

**Files:**

- Modify: `src/lib/matching/compute.ts:17-56` (interfaces + computeMatchScore)
- Modify: `src/lib/matching/generate.ts:1-76` (generateMatchesForShow)
- Modify: `src/lib/matching/__tests__/compute.test.ts`

**Step 1: Update ArtistMatchData and ShowMatchData interfaces**

In `src/lib/matching/compute.ts`, replace the interfaces and computeMatchScore:

```typescript
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
```

**Step 2: Update computeMatchScore to pass coordinates**

Replace the `computeMatchScore` function body:

```typescript
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
```

**Step 3: Add isWithinMatchDistance helper and export it**

Add below `computeMatchScore`:

```typescript
import { haversineDistance, MAX_MATCH_DISTANCE_MILES } from "./score";

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
```

Note: Make sure the import of `haversineDistance` and `MAX_MATCH_DISTANCE_MILES` is added to the import block at the top of `compute.ts`.

**Step 4: Update generate.ts to add distance cutoff and pass coordinates**

In `src/lib/matching/generate.ts`, update the `generateMatchesForShow` function:

1. Update the `show` query to include `venue.latitude` and `venue.longitude` (already included via `venue: true`).
2. Build the `ShowMatchData` with coordinates:

```typescript
import { computeMatchScore, isWithinMatchDistance } from "./compute";
```

In the loop, update the artist/show data construction and add the distance check:

```typescript
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

  // Only create matches above a minimum threshold
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
```

**Step 5: Update compute.test.ts**

Update the test data to include coordinates. Use Greenville SC coords for both artist and venue in the "great match" test, NYC/Columbus for the "poor match" test:

```typescript
describe("computeMatchScore", () => {
  it("computes a high score for a great match", () => {
    const score = computeMatchScore(
      {
        genres: ["punk", "hardcore"],
        location: "Greenville, SC",
        latitude: 34.8526,
        longitude: -82.394,
        drawEstimate: 60,
        availabilityPreference: "ANY_NIGHT",
      },
      {
        genres: ["punk", "hardcore"],
        venueCity: "Greenville, SC",
        venueLatitude: 34.851,
        venueLongitude: -82.3985,
        venueCapacity: 80,
        showDate: new Date("2026-03-14"),
        compensationType: "door_split",
      },
    );
    expect(score).toBeGreaterThan(80);
  });

  it("computes a low score for a poor match", () => {
    const score = computeMatchScore(
      {
        genres: ["jazz", "blues"],
        location: "New York, NY",
        latitude: 40.7128,
        longitude: -74.006,
        drawEstimate: 500,
        availabilityPreference: "WEEKENDS",
      },
      {
        genres: ["punk", "hardcore"],
        venueCity: "Columbus, OH",
        venueLatitude: 39.9612,
        venueLongitude: -82.9988,
        venueCapacity: 50,
        showDate: new Date("2026-03-11"),
        compensationType: "guarantee",
      },
    );
    expect(score).toBeLessThan(20);
  });

  it("computes a medium score for partial match", () => {
    const score = computeMatchScore(
      {
        genres: ["punk", "indie-rock"],
        location: "Greenville, SC",
        latitude: 34.8526,
        longitude: -82.394,
        drawEstimate: 30,
        availabilityPreference: "WEEKENDS",
      },
      {
        genres: ["punk", "hardcore", "metal"],
        venueCity: "Greenville, SC",
        venueLatitude: 34.851,
        venueLongitude: -82.3985,
        venueCapacity: 200,
        showDate: new Date("2026-03-14"),
        compensationType: "door_split",
      },
    );
    expect(score).toBeGreaterThan(30);
    expect(score).toBeLessThan(70);
  });

  it("falls back gracefully when coordinates are null", () => {
    const score = computeMatchScore(
      {
        genres: ["punk"],
        location: "Greenville, SC",
        latitude: null,
        longitude: null,
        drawEstimate: 60,
        availabilityPreference: "ANY_NIGHT",
      },
      {
        genres: ["punk"],
        venueCity: "Greenville, SC",
        venueLatitude: 34.851,
        venueLongitude: -82.3985,
        venueCapacity: 80,
        showDate: new Date("2026-03-14"),
        compensationType: "door_split",
      },
    );
    // Location score will be 0 (null coords), but other scores still contribute
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(80);
  });
});
```

**Step 6: Run all tests**

Run: `npm run test`
Expected: All tests PASS.

**Step 7: Commit**

```bash
git add src/lib/matching/compute.ts src/lib/matching/generate.ts src/lib/matching/__tests__/compute.test.ts
git commit -m "feat: add distance cutoff to match generation and update compute layer"
```

---

### Task 5: Update PlacesAutocomplete to Extract Coordinates

**Files:**

- Modify: `src/components/ui/places-autocomplete.tsx:8-11` (PlaceDetails interface)
- Modify: `src/components/ui/places-autocomplete.tsx:98-119` (handleSelect function)

**Step 1: Extend PlaceDetails interface**

In `src/components/ui/places-autocomplete.tsx`, update:

```typescript
interface PlaceDetails {
  city: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
}
```

**Step 2: Extract coordinates in handleSelect**

In the `handleSelect` function, after the `getGeocode` call, extract lat/lng and pass them through. Update the `try` block:

```typescript
try {
  const results = await getGeocode({ placeId });
  const { city, state } = extractCityState(results[0].address_components);
  const location = results[0].geometry.location;
  const latitude = location.lat();
  const longitude = location.lng();

  if (type === "(cities)") {
    const formatted = state ? `${city}, ${state}` : city;
    onValueChange(formatted);
    setAutocompleteValue(formatted, false);
    onPlaceSelect?.({ city, state, latitude, longitude });
  } else {
    onValueChange(description);
    setAutocompleteValue(description, false);
    onPlaceSelect?.({ city, state, latitude, longitude });
  }
} catch {
  // On geocode failure, just use the description as-is
  onValueChange(description);
  setAutocompleteValue(description, false);
}
```

Note: The `(cities)` branch now also calls `onPlaceSelect` (it didn't before) — this is needed so artist onboarding can capture coordinates from the city picker.

**Step 3: Verify build compiles**

Run: `npm run build`
Expected: Build succeeds (callers using `onPlaceSelect` only destructured `city` and `state` before, so adding new optional fields is backwards-compatible at the call site).

**Step 4: Commit**

```bash
git add src/components/ui/places-autocomplete.tsx
git commit -m "feat: extract lat/lng from geocode in PlacesAutocomplete"
```

---

### Task 6: Update Zod Schemas

**Files:**

- Modify: `src/lib/validations/artist.ts:3-23`
- Modify: `src/lib/validations/venue.ts:3-18`

**Step 1: Add latitude/longitude to artist schema**

In `src/lib/validations/artist.ts`, add after the `location` field:

```typescript
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
```

**Step 2: Add latitude/longitude to venue schema**

In `src/lib/validations/venue.ts`, add after the `city` field:

```typescript
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
```

**Step 3: Run tests to make sure nothing breaks**

Run: `npm run test`
Expected: All tests PASS (new fields are optional).

**Step 4: Commit**

```bash
git add src/lib/validations/artist.ts src/lib/validations/venue.ts
git commit -m "feat: add latitude/longitude to Zod validation schemas"
```

---

### Task 7: Update Artist Forms (Onboarding + Profile Edit)

**Files:**

- Modify: `src/components/onboarding/artist-onboarding.tsx:46,108,262-269`
- Modify: `src/components/profile/artist-profile-form.tsx:26-40,62,100,265-272`
- Modify: `src/app/(dashboard)/profile/page.tsx:32-46`

**Step 1: Update artist onboarding form**

In `src/components/onboarding/artist-onboarding.tsx`:

Add state variables after `location` state (line 46):

```typescript
const [latitude, setLatitude] = useState<number | null>(null);
const [longitude, setLongitude] = useState<number | null>(null);
```

In `handleSubmit`, add to the `createArtistProfile` call (after `location: location.trim()`):

```typescript
        latitude,
        longitude,
```

Update the `PlacesAutocomplete` for location to add an `onPlaceSelect` handler. Find the PlacesAutocomplete usage in the location field (around line 262-269) and add:

```tsx
<PlacesAutocomplete
  id="location"
  type="(cities)"
  value={location}
  onValueChange={setLocation}
  onPlaceSelect={(details) => {
    setLatitude(details.latitude);
    setLongitude(details.longitude);
  }}
  placeholder="e.g. Nashville, TN"
  required
/>
```

**Step 2: Update artist profile edit form**

In `src/components/profile/artist-profile-form.tsx`:

Add to the `ArtistProfileData` interface (after `location`):

```typescript
latitude: number | null;
longitude: number | null;
```

Add state variables (after `location` state, around line 62):

```typescript
const [latitude, setLatitude] = useState<number | null>(profile.latitude);
const [longitude, setLongitude] = useState<number | null>(profile.longitude);
```

In `handleSubmit`, add to the `updateArtistProfile` call (after `location: location.trim()`):

```typescript
        latitude,
        longitude,
```

Update the PlacesAutocomplete usage for location to add `onPlaceSelect`:

```tsx
<PlacesAutocomplete
  id="location"
  type="(cities)"
  value={location}
  onValueChange={setLocation}
  onPlaceSelect={(details) => {
    setLatitude(details.latitude);
    setLongitude(details.longitude);
  }}
  placeholder="e.g. Nashville, TN"
  required
/>
```

**Step 3: Update profile page to pass lat/lng to artist form**

In `src/app/(dashboard)/profile/page.tsx`, in the artist profile section (around line 35), add:

```typescript
            latitude: profile.latitude ?? null,
            longitude: profile.longitude ?? null,
```

**Step 4: Verify build**

Run: `npm run build`
Expected: Build succeeds.

**Step 5: Commit**

```bash
git add src/components/onboarding/artist-onboarding.tsx src/components/profile/artist-profile-form.tsx src/app/\(dashboard\)/profile/page.tsx
git commit -m "feat: capture lat/lng in artist onboarding and profile forms"
```

---

### Task 8: Update Venue Forms (Onboarding + Profile Edit)

**Files:**

- Modify: `src/components/onboarding/venue-onboarding.tsx:39,99-114,182-190`
- Modify: `src/components/profile/venue-profile-form.tsx:26-39,54-55,81-97,167-175`
- Modify: `src/app/(dashboard)/profile/page.tsx:67-80`

**Step 1: Update venue onboarding form**

In `src/components/onboarding/venue-onboarding.tsx`:

Add state after `city` (around line 39):

```typescript
const [latitude, setLatitude] = useState<number | null>(null);
const [longitude, setLongitude] = useState<number | null>(null);
```

In `handleSubmit`, add to `createVenueProfile` call (after `city: city.trim()`):

```typescript
        latitude,
        longitude,
```

Update the `PlacesAutocomplete` `onPlaceSelect` to also capture coordinates. Find the existing handler `onPlaceSelect={(details) => setCity(details.city)}` and replace with:

```tsx
                onPlaceSelect={(details) => {
                  setCity(details.city);
                  setLatitude(details.latitude);
                  setLongitude(details.longitude);
                }}
```

**Step 2: Update venue profile edit form**

In `src/components/profile/venue-profile-form.tsx`:

Add to `VenueProfileData` interface (after `city`):

```typescript
latitude: number | null;
longitude: number | null;
```

Add state (after `city` state, around line 55):

```typescript
const [latitude, setLatitude] = useState<number | null>(profile.latitude);
const [longitude, setLongitude] = useState<number | null>(profile.longitude);
```

In `handleSubmit`, add to `updateVenueProfile` call (after `city: city.trim()`):

```typescript
        latitude,
        longitude,
```

Update the `onPlaceSelect` handler on the address PlacesAutocomplete from:

```tsx
onPlaceSelect={(details) => setCity(details.city)}
```

to:

```tsx
onPlaceSelect={(details) => {
  setCity(details.city);
  setLatitude(details.latitude);
  setLongitude(details.longitude);
}}
```

**Step 3: Update profile page to pass lat/lng to venue form**

In `src/app/(dashboard)/profile/page.tsx`, in the venue profile section (around line 71), add:

```typescript
          latitude: profile.latitude ?? null,
          longitude: profile.longitude ?? null,
```

**Step 4: Verify build**

Run: `npm run build`
Expected: Build succeeds.

**Step 5: Commit**

```bash
git add src/components/onboarding/venue-onboarding.tsx src/components/profile/venue-profile-form.tsx src/app/\(dashboard\)/profile/page.tsx
git commit -m "feat: capture lat/lng in venue onboarding and profile forms"
```

---

### Task 9: Update Seed File with Coordinates

**Files:**

- Modify: `prisma/seed.ts`

**Step 1: Add latitude/longitude to ArtistSeed and VenueSeed types**

In `prisma/seed.ts`, update the `ArtistSeed` type (around line 67) to add:

```typescript
latitude: number;
longitude: number;
```

Update `VenueSeed` type (around line 577) to add:

```typescript
latitude: number;
longitude: number;
```

**Step 2: Add coordinates to all artist seed data**

Add `latitude` and `longitude` to each artist entry. Coordinates by location:

| Location           | Latitude | Longitude |
| ------------------ | -------- | --------- |
| New York, NY       | 40.7128  | -74.0060  |
| Hoboken, NJ        | 40.7440  | -74.0324  |
| Jersey City, NJ    | 40.7178  | -74.0431  |
| Austin, TX         | 30.2672  | -97.7431  |
| Round Rock, TX     | 30.5083  | -97.6789  |
| San Marcos, TX     | 29.8833  | -97.9414  |
| Nashville, TN      | 36.1627  | -86.7816  |
| Franklin, TN       | 35.9251  | -86.8689  |
| Murfreesboro, TN   | 35.8456  | -86.3903  |
| Atlanta, GA        | 33.7490  | -84.3880  |
| Decatur, GA        | 33.7748  | -84.2963  |
| Marietta, GA       | 33.9526  | -84.5499  |
| Asheville, NC      | 35.5951  | -82.5515  |
| Black Mountain, NC | 35.6179  | -82.3212  |
| Greenville, SC     | 34.8526  | -82.3940  |
| Spartanburg, SC    | 34.9496  | -81.9320  |

Add the appropriate lat/lng to each artist entry based on their `location` field.

**Step 3: Add coordinates to all venue seed data**

Use the same coordinate lookup for each venue based on their `city` field. Add `latitude` and `longitude` to each venue entry.

**Step 4: Update seed execution to save coordinates**

In the artist creation block (around line 1284-1303), add to the `artistProfile.create` data:

```typescript
            latitude: a.latitude,
            longitude: a.longitude,
```

In the venue creation block (around line 1324-1336), add to the `venueProfile.create` data:

```typescript
            latitude: v.latitude,
            longitude: v.longitude,
```

**Step 5: Verify seed compiles**

Run: `npx tsc --noEmit prisma/seed.ts` or `npm run build`
Expected: No type errors.

**Step 6: Commit**

```bash
git add prisma/seed.ts
git commit -m "feat: add lat/lng coordinates to all seed data"
```

---

### Task 10: Final Verification

**Step 1: Run all unit tests**

Run: `npm run test`
Expected: All tests pass.

**Step 2: Run build**

Run: `npm run build`
Expected: Build succeeds with no errors.

**Step 3: Run lint**

Run: `npm run lint`
Expected: No lint errors.

**Step 4: Commit any remaining fixes if needed**

**Step 5: Final commit — squash or leave as feature branch**

Verify the full diff looks correct with `git log --oneline` and `git diff main`.
