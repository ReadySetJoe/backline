"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { showSchema, type ShowInput } from "@/lib/validations/show";
import { revalidatePath } from "next/cache";
import type { ShowStatus } from "@prisma/client";

export async function createShow(input: ShowInput) {
  const session = await auth();
  if (!session?.user) {
    return { success: false as const, error: "Not authenticated" };
  }

  if (session.user.role !== "VENUE") {
    return { success: false as const, error: "Only venues can create shows" };
  }

  const parsed = showSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.flatten().fieldErrors,
    };
  }

  const venueProfile = await db.venueProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!venueProfile) {
    return { success: false as const, error: "Venue profile not found" };
  }

  const { genreIds, ...data } = parsed.data;

  try {
    const show = await db.show.create({
      data: {
        ...data,
        venueId: venueProfile.id,
        genres: { connect: genreIds.map((id) => ({ id })) },
      },
    });

    revalidatePath("/shows");

    return { success: true as const, data: { id: show.id } };
  } catch {
    return {
      success: false as const,
      error: "Failed to create show",
    };
  }
}

export async function updateShowStatus(
  showId: string,
  status: ShowStatus
) {
  const session = await auth();
  if (!session?.user) {
    return { success: false as const, error: "Not authenticated" };
  }

  if (session.user.role !== "VENUE") {
    return { success: false as const, error: "Only venues can manage shows" };
  }

  // Verify ownership: show's venue must belong to current user
  const show = await db.show.findUnique({
    where: { id: showId },
    include: { venue: { select: { userId: true } } },
  });

  if (!show) {
    return { success: false as const, error: "Show not found" };
  }

  if (show.venue.userId !== session.user.id) {
    return { success: false as const, error: "You do not own this show" };
  }

  try {
    await db.show.update({
      where: { id: showId },
      data: { status },
    });

    revalidatePath("/shows");
    revalidatePath(`/shows/${showId}`);

    return { success: true as const };
  } catch {
    return {
      success: false as const,
      error: "Failed to update show status",
    };
  }
}
