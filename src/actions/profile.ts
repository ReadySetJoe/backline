"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  artistProfileSchema,
  type ArtistProfileInput,
} from "@/lib/validations/artist";
import {
  venueProfileSchema,
  type VenueProfileInput,
} from "@/lib/validations/venue";
import { revalidatePath } from "next/cache";

export async function updateArtistProfile(input: ArtistProfileInput) {
  const session = await auth();
  if (!session?.user) {
    return { success: false as const, error: "Not authenticated" };
  }

  if (session.user.role !== "ARTIST") {
    return { success: false as const, error: "Not an artist account" };
  }

  const parsed = artistProfileSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.flatten().fieldErrors,
    };
  }

  const { genreIds, ...data } = parsed.data;

  try {
    await db.artistProfile.update({
      where: { userId: session.user.id },
      data: {
        ...data,
        genres: { set: genreIds.map((id) => ({ id })) },
      },
    });

    revalidatePath("/profile");

    return { success: true as const };
  } catch {
    return {
      success: false as const,
      error: "Failed to update artist profile",
    };
  }
}

export async function updateVenueProfile(input: VenueProfileInput) {
  const session = await auth();
  if (!session?.user) {
    return { success: false as const, error: "Not authenticated" };
  }

  if (session.user.role !== "VENUE") {
    return { success: false as const, error: "Not a venue account" };
  }

  const parsed = venueProfileSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.flatten().fieldErrors,
    };
  }

  const { genreIds, ...data } = parsed.data;

  try {
    await db.venueProfile.update({
      where: { userId: session.user.id },
      data: {
        ...data,
        genres: { set: genreIds.map((id) => ({ id })) },
      },
    });

    revalidatePath("/profile");

    return { success: true as const };
  } catch {
    return {
      success: false as const,
      error: "Failed to update venue profile",
    };
  }
}
