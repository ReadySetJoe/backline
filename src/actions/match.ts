"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function likeMatch(matchId: string) {
  const session = await auth();
  if (!session?.user) {
    return { success: false as const, error: "Not authenticated" };
  }

  const match = await db.match.findUnique({
    where: { id: matchId },
    include: {
      artist: { select: { userId: true } },
      show: {
        include: {
          venue: { select: { userId: true } },
        },
      },
    },
  });

  if (!match) {
    return { success: false as const, error: "Match not found" };
  }

  // Determine the user's role in this match
  const isArtistSide = match.artist.userId === session.user.id;
  const isVenueSide = match.show.venue.userId === session.user.id;

  if (!isArtistSide && !isVenueSide) {
    return { success: false as const, error: "You do not own this match" };
  }

  // Determine new status based on current status and who is liking
  let newStatus = match.status;

  if (isArtistSide) {
    if (match.status === "SUGGESTED") {
      newStatus = "LIKED_BY_ARTIST";
    } else if (match.status === "LIKED_BY_VENUE") {
      newStatus = "MUTUAL";
    }
    // If already LIKED_BY_ARTIST or MUTUAL, no change
  } else if (isVenueSide) {
    if (match.status === "SUGGESTED") {
      newStatus = "LIKED_BY_VENUE";
    } else if (match.status === "LIKED_BY_ARTIST") {
      newStatus = "MUTUAL";
    }
    // If already LIKED_BY_VENUE or MUTUAL, no change
  }

  if (newStatus !== match.status) {
    await db.match.update({
      where: { id: matchId },
      data: { status: newStatus },
    });

    // If the match is now mutual, create a conversation
    if (newStatus === "MUTUAL") {
      await db.conversation.create({
        data: { matchId },
      });
    }
  }

  revalidatePath("/matches");

  return { success: true as const, data: { status: newStatus } };
}

export async function passMatch(matchId: string) {
  const session = await auth();
  if (!session?.user) {
    return { success: false as const, error: "Not authenticated" };
  }

  const match = await db.match.findUnique({
    where: { id: matchId },
    include: {
      artist: { select: { userId: true } },
      show: {
        include: {
          venue: { select: { userId: true } },
        },
      },
    },
  });

  if (!match) {
    return { success: false as const, error: "Match not found" };
  }

  const isArtistSide = match.artist.userId === session.user.id;
  const isVenueSide = match.show.venue.userId === session.user.id;

  if (!isArtistSide && !isVenueSide) {
    return { success: false as const, error: "You do not own this match" };
  }

  await db.match.update({
    where: { id: matchId },
    data: { status: "PASSED" },
  });

  revalidatePath("/matches");

  return { success: true as const };
}

export async function reconsiderMatch(matchId: string) {
  const session = await auth();
  if (!session?.user) {
    return { success: false as const, error: "Not authenticated" };
  }

  const match = await db.match.findUnique({
    where: { id: matchId },
    include: {
      artist: { select: { userId: true } },
      show: {
        include: {
          venue: { select: { userId: true } },
        },
      },
    },
  });

  if (!match) {
    return { success: false as const, error: "Match not found" };
  }

  const isArtistSide = match.artist.userId === session.user.id;
  const isVenueSide = match.show.venue.userId === session.user.id;

  if (!isArtistSide && !isVenueSide) {
    return { success: false as const, error: "You do not own this match" };
  }

  await db.match.update({
    where: { id: matchId },
    data: { status: "SUGGESTED" },
  });

  revalidatePath("/matches");

  return { success: true as const };
}
