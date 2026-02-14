// @vitest-environment node
import { describe, it, expect } from "vitest";
import { artistProfileSchema } from "../artist";

describe("artistProfileSchema", () => {
  it("accepts valid artist profile", () => {
    const result = artistProfileSchema.safeParse({
      name: "The Rattlesnakes",
      location: "Columbus, OH",
      artistType: "FULL_BAND",
      memberCount: 4,
      genreIds: ["1", "2"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects more than 5 genres", () => {
    const result = artistProfileSchema.safeParse({
      name: "The Rattlesnakes",
      location: "Columbus, OH",
      artistType: "FULL_BAND",
      memberCount: 4,
      genreIds: ["1", "2", "3", "4", "5", "6"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty name", () => {
    const result = artistProfileSchema.safeParse({
      name: "",
      location: "Columbus, OH",
      artistType: "SOLO",
      memberCount: 1,
      genreIds: ["1"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty genreIds array", () => {
    const result = artistProfileSchema.safeParse({
      name: "The Rattlesnakes",
      location: "Columbus, OH",
      artistType: "FULL_BAND",
      memberCount: 4,
      genreIds: [],
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional fields when provided", () => {
    const result = artistProfileSchema.safeParse({
      name: "The Rattlesnakes",
      location: "Columbus, OH",
      artistType: "FULL_BAND",
      memberCount: 4,
      genreIds: ["1", "2"],
      bio: "A great band from Columbus",
      spotifyUrl: "https://open.spotify.com/artist/123",
      typicalSetLength: 45,
      drawEstimate: 100,
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty string for optional URL fields", () => {
    const result = artistProfileSchema.safeParse({
      name: "The Rattlesnakes",
      location: "Columbus, OH",
      artistType: "FULL_BAND",
      memberCount: 4,
      genreIds: ["1"],
      spotifyUrl: "",
      bandcampUrl: "",
      instagramUrl: "",
      websiteUrl: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid URL for optional URL fields", () => {
    const result = artistProfileSchema.safeParse({
      name: "The Rattlesnakes",
      location: "Columbus, OH",
      artistType: "FULL_BAND",
      memberCount: 4,
      genreIds: ["1"],
      spotifyUrl: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid artistType", () => {
    const result = artistProfileSchema.safeParse({
      name: "The Rattlesnakes",
      location: "Columbus, OH",
      artistType: "ORCHESTRA",
      memberCount: 4,
      genreIds: ["1"],
    });
    expect(result.success).toBe(false);
  });

  it("uses default availabilityPreference when not provided", () => {
    const result = artistProfileSchema.safeParse({
      name: "The Rattlesnakes",
      location: "Columbus, OH",
      artistType: "FULL_BAND",
      memberCount: 4,
      genreIds: ["1"],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.availabilityPreference).toBe("ANY_NIGHT");
    }
  });
});
