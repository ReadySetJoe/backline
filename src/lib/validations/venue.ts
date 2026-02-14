import { z } from "zod";

export const venueProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  bio: z.string().max(1000).optional(),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  capacity: z.number().int().min(1, "Capacity must be at least 1"),
  genreIds: z.array(z.string()).min(1, "Select at least 1 genre"),
  hasPa: z.boolean().default(false),
  hasBackline: z.boolean().default(false),
  stageSize: z.string().optional(),
  ageRestriction: z
    .enum(["ALL_AGES", "EIGHTEEN_PLUS", "TWENTY_ONE_PLUS"])
    .default("ALL_AGES"),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  instagramUrl: z.string().url().optional().or(z.literal("")),
});

export type VenueProfileInput = z.infer<typeof venueProfileSchema>;
