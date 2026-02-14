"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  artistProfileSchema,
  type ArtistProfileInput,
} from "@/lib/validations/artist";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";

export async function createArtistProfile(input: ArtistProfileInput) {
  const session = await auth();
  if (!session?.user) return { success: false as const, error: "Not authenticated" };

  const parsed = artistProfileSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.flatten().fieldErrors,
    };
  }

  const { genreIds, ...data } = parsed.data;

  try {
    await db.artistProfile.create({
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
      error: "Failed to create artist profile",
    };
  }
}
