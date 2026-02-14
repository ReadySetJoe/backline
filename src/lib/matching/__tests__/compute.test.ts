// @vitest-environment node
import { describe, it, expect } from "vitest";
import { computeMatchScore } from "../compute";

describe("computeMatchScore", () => {
  it("computes a high score for a great match", () => {
    const score = computeMatchScore(
      {
        genres: ["punk", "hardcore"],
        location: "Columbus, OH",
        drawEstimate: 60,
        availabilityPreference: "ANY_NIGHT",
      },
      {
        genres: ["punk", "hardcore"],
        venueCity: "Columbus, OH",
        venueCapacity: 80,
        showDate: new Date("2026-03-14"),
        compensationType: "door_split",
      }
    );
    // Expected: genre=1.0, location=1.0, capacity=1.0, avail=1.0, comp=0.5
    // Total = (30 + 25 + 20 + 15 + 5) = 95
    expect(score).toBeGreaterThan(80);
  });

  it("computes a low score for a poor match", () => {
    const score = computeMatchScore(
      {
        genres: ["jazz", "blues"],
        location: "New York, NY",
        drawEstimate: 500,
        availabilityPreference: "WEEKENDS",
      },
      {
        genres: ["punk", "hardcore"],
        venueCity: "Columbus, OH",
        venueCapacity: 50,
        showDate: new Date("2026-03-11"), // Wednesday in UTC
        compensationType: "guarantee",
      }
    );
    // Expected: genre=0, location=0, capacity=0, avail=0, comp=0.5
    // Total = 5
    expect(score).toBeLessThan(20);
  });

  it("computes a medium score for partial match", () => {
    const score = computeMatchScore(
      {
        genres: ["punk", "indie-rock"],
        location: "Columbus, OH",
        drawEstimate: 30,
        availabilityPreference: "WEEKENDS",
      },
      {
        genres: ["punk", "hardcore", "metal"],
        venueCity: "Columbus, OH",
        venueCapacity: 200,
        showDate: new Date("2026-03-14"), // Saturday in UTC
        compensationType: "door_split",
      }
    );
    // Expected: genre≈0.25, location=1.0, capacity=0.0, avail=1.0, comp=0.5
    // Total ≈ (7.5 + 25 + 0 + 15 + 5) = 52.5 → 53
    expect(score).toBeGreaterThan(30);
    expect(score).toBeLessThan(70);
  });
});
