// @vitest-environment node
import { describe, it, expect } from "vitest";
import { computeMatchScore } from "../compute";

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
