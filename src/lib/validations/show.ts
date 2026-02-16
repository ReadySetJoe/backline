import { z } from "zod";

export const showSchema = z.object({
  date: z.coerce
    .date()
    .refine((d) => d > new Date(), "Date must be in the future"),
  title: z.string().max(100).optional(),
  note: z.string().max(500).optional(),
  slotsTotal: z.number().int().min(1).max(20).default(3),
  genreIds: z.array(z.string()).min(1, "Select at least 1 genre for this show"),
  compensationType: z.string().optional(),
  compensationNote: z.string().max(500).optional(),
});

export type ShowInput = z.infer<typeof showSchema>;
