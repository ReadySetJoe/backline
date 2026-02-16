"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

async function requireSuperAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function deleteUser(userId: string) {
  try {
    await requireSuperAdmin();

    await db.user.delete({ where: { id: userId } });

    revalidatePath("/admin/artists");
    revalidatePath("/admin/venues");

    return { success: true as const };
  } catch {
    return {
      success: false as const,
      error: "Failed to delete user",
    };
  }
}

export async function cancelShow(showId: string) {
  try {
    await requireSuperAdmin();

    await db.show.update({
      where: { id: showId },
      data: { status: "CANCELLED" },
    });

    revalidatePath("/admin/shows");

    return { success: true as const };
  } catch {
    return {
      success: false as const,
      error: "Failed to cancel show",
    };
  }
}

export async function resetMatch(matchId: string) {
  try {
    await requireSuperAdmin();

    const conversation = await db.conversation.findUnique({
      where: { matchId },
    });

    if (conversation) {
      await db.conversation.delete({ where: { matchId } });
    }

    await db.match.update({
      where: { id: matchId },
      data: { status: "SUGGESTED" },
    });

    revalidatePath("/admin/matches");

    return { success: true as const };
  } catch {
    return {
      success: false as const,
      error: "Failed to reset match",
    };
  }
}
