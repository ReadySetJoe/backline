import { z } from "zod";

export const artistProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  bio: z.string().max(1000).optional(),
  location: z.string().min(1, "Location is required"),
  artistType: z.enum(["SOLO", "DUO", "FULL_BAND"]),
  memberCount: z.number().int().min(1).max(50),
  genreIds: z
    .array(z.string())
    .min(1, "Select at least 1 genre")
    .max(5, "Maximum 5 genres allowed"),
  spotifyUrl: z.string().url().optional().or(z.literal("")),
  bandcampUrl: z.string().url().optional().or(z.literal("")),
  instagramUrl: z.string().url().optional().or(z.literal("")),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  sampleUrls: z.array(z.string().url()).max(5).optional(),
  availabilityPreference: z
    .enum(["WEEKENDS", "WEEKNIGHTS", "ANY_NIGHT", "SPECIFIC_DATES"])
    .default("ANY_NIGHT"),
  typicalSetLength: z.number().int().min(5).max(240).optional(),
  drawEstimate: z.number().int().min(0).max(100000).optional(),
});

export type ArtistProfileInput = z.infer<typeof artistProfileSchema>;
