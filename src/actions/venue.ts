"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  venueProfileSchema,
  type VenueProfileInput,
} from "@/lib/validations/venue";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";

export async function createVenueProfile(input: VenueProfileInput) {
  const session = await auth();
  if (!session?.user) return { success: false as const, error: "Not authenticated" };

  const parsed = venueProfileSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.flatten().fieldErrors,
    };
  }

  const { genreIds, ...data } = parsed.data;

  try {
    await db.venueProfile.create({
      data: {
        ...data,
        userId: session.user.id,
        genres: { connect: genreIds.map((id) => ({ id })) },
      },
    });

    redirect("/dashboard");
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    return {
      success: false as const,
      error: "Failed to create venue profile",
    };
  }
}
