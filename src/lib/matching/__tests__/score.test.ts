// @vitest-environment node
import { describe, it, expect } from "vitest";
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

describe("genreScore", () => {
  it("returns 1.0 for identical genre sets", () => {
    expect(genreScore(["punk", "rock"], ["punk", "rock"])).toBe(1.0);
  });

  it("returns 0.0 for no overlap", () => {
    expect(genreScore(["punk", "rock"], ["jazz", "blues"])).toBe(0.0);
  });

  it("returns correct Jaccard similarity for partial overlap", () => {
    // intersection = 1 (punk), union = 3 (punk, rock, hardcore) → 1/3 ≈ 0.333
    expect(genreScore(["punk", "rock"], ["punk", "hardcore"])).toBeCloseTo(
      0.333,
      2,
    );
  });

  it("returns 0.0 for empty sets", () => {
    expect(genreScore([], [])).toBe(0.0);
  });

  it("returns 0.0 when one set is empty", () => {
    expect(genreScore(["punk"], [])).toBe(0.0);
    expect(genreScore([], ["punk"])).toBe(0.0);
  });
});

describe("haversineDistance", () => {
  it("returns 0 for identical coordinates", () => {
    expect(haversineDistance(34.8526, -82.394, 34.8526, -82.394)).toBe(0);
  });

  it("computes correct distance between Greenville SC and Asheville NC (~52 mi)", () => {
    const dist = haversineDistance(34.8526, -82.394, 35.5951, -82.5515);
    expect(dist).toBeGreaterThan(50);
    expect(dist).toBeLessThan(55);
  });

  it("computes correct distance between NYC and Hoboken NJ (~3 mi)", () => {
    const dist = haversineDistance(40.7128, -74.006, 40.744, -74.0324);
    expect(dist).toBeGreaterThan(2);
    expect(dist).toBeLessThan(5);
  });

  it("computes correct distance between NYC and Austin TX (~1511 mi)", () => {
    const dist = haversineDistance(40.7128, -74.006, 30.2672, -97.7431);
    expect(dist).toBeGreaterThan(1500);
    expect(dist).toBeLessThan(1520);
  });
});

describe("locationScore", () => {
  it("returns 1.0 for same coordinates (0 miles)", () => {
    expect(locationScore(34.8526, -82.394, 34.8526, -82.394)).toBe(1.0);
  });

  it("returns high score for nearby coordinates (~3 mi, NYC to Hoboken)", () => {
    const score = locationScore(40.7128, -74.006, 40.744, -74.0324);
    expect(score).toBeGreaterThan(0.95);
  });

  it("returns moderate score for ~34 miles (Nashville to Murfreesboro)", () => {
    const score = locationScore(36.1627, -86.7816, 35.8456, -86.3903);
    expect(score).toBeGreaterThan(0.7);
    expect(score).toBeLessThan(0.85);
  });

  it("returns 0.0 for coordinates beyond 150 miles", () => {
    // NYC to Columbus OH (~530 miles)
    expect(locationScore(40.7128, -74.006, 39.9612, -82.9988)).toBe(0.0);
  });

  it("returns 0.0 when any coordinate is null", () => {
    expect(locationScore(null, null, 34.8526, -82.394)).toBe(0.0);
    expect(locationScore(34.8526, -82.394, null, null)).toBe(0.0);
    expect(locationScore(null, null, null, null)).toBe(0.0);
  });
});

describe("capacityDrawScore", () => {
  it("returns 1.0 when draw is 75% of capacity (sweet spot)", () => {
    expect(capacityDrawScore(75, 100)).toBe(1.0);
  });

  it("returns 1.0 when draw is in 60-90% range", () => {
    expect(capacityDrawScore(60, 100)).toBe(1.0);
    expect(capacityDrawScore(90, 100)).toBe(1.0);
  });

  it("returns high score near the sweet spot", () => {
    const score = capacityDrawScore(80, 100);
    expect(score).toBeGreaterThanOrEqual(0.8);
  });

  it("returns low score when draw is way under capacity", () => {
    const score = capacityDrawScore(10, 500);
    expect(score).toBeLessThan(0.3);
  });

  it("returns lower score when draw exceeds capacity", () => {
    const score = capacityDrawScore(200, 100);
    expect(score).toBeLessThan(0.5);
  });

  it("returns 0 if draw is null", () => {
    expect(capacityDrawScore(null, 100)).toBe(0);
  });

  it("returns 0 if capacity is null", () => {
    expect(capacityDrawScore(50, null)).toBe(0);
  });
});

describe("availabilityScore", () => {
  it("returns 1.0 for ANY_NIGHT", () => {
    expect(availabilityScore("ANY_NIGHT", new Date("2026-03-14"))).toBe(1.0); // Saturday
    expect(availabilityScore("ANY_NIGHT", new Date("2026-03-11"))).toBe(1.0); // Wednesday
  });

  it("returns 1.0 for WEEKENDS on weekend dates", () => {
    expect(availabilityScore("WEEKENDS", new Date("2026-03-14"))).toBe(1.0); // Saturday
    expect(availabilityScore("WEEKENDS", new Date("2026-03-13"))).toBe(1.0); // Friday
  });

  it("returns 0.0 for WEEKENDS on weeknights", () => {
    expect(availabilityScore("WEEKENDS", new Date("2026-03-11"))).toBe(0.0); // Wednesday
  });

  it("returns 1.0 for WEEKNIGHTS on weeknights", () => {
    expect(availabilityScore("WEEKNIGHTS", new Date("2026-03-11"))).toBe(1.0); // Wednesday
  });

  it("returns 0.0 for WEEKNIGHTS on weekends", () => {
    expect(availabilityScore("WEEKNIGHTS", new Date("2026-03-14"))).toBe(0.0); // Saturday
  });

  it("returns 0.5 for SPECIFIC_DATES (neutral)", () => {
    expect(availabilityScore("SPECIFIC_DATES", new Date("2026-03-14"))).toBe(
      0.5,
    );
  });
});

describe("compensationScore", () => {
  it("returns 0.5 for any compensation type (MVP neutral)", () => {
    expect(compensationScore("door_split")).toBe(0.5);
    expect(compensationScore("guarantee")).toBe(0.5);
    expect(compensationScore(null)).toBe(0.5);
  });
});

describe("totalScore", () => {
  it("computes perfect 100 for all 1.0 scores", () => {
    const score = totalScore({
      genre: 1.0,
      location: 1.0,
      capacityDraw: 1.0,
      availability: 1.0,
      compensation: 1.0,
    });
    expect(score).toBe(100);
  });

  it("computes 0 for all 0.0 scores", () => {
    const score = totalScore({
      genre: 0.0,
      location: 0.0,
      capacityDraw: 0.0,
      availability: 0.0,
      compensation: 0.0,
    });
    expect(score).toBe(0);
  });

  it("computes correct weighted partial score", () => {
    const score = totalScore({
      genre: 1.0, // 30% = 30
      location: 0.0, // 25% = 0
      capacityDraw: 0.5, // 20% = 10
      availability: 1.0, // 15% = 15
      compensation: 0.0, // 10% = 0
    });
    expect(score).toBe(55);
  });
});
