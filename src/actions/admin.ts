"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

async function requireSuperAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return null;
  }
  return session;
}

export async function deleteUser(userId: string) {
  const session = await requireSuperAdmin();
  if (!session) {
    return { success: false as const, error: "Unauthorized" };
  }

  if (userId === session.user.id) {
    return { success: false as const, error: "Cannot delete your own account" };
  }

  const targetUser = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (targetUser?.role === "SUPER_ADMIN") {
    return { success: false as const, error: "Cannot delete admin users" };
  }

  try {
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
  const session = await requireSuperAdmin();
  if (!session) {
    return { success: false as const, error: "Unauthorized" };
  }

  try {
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
  const session = await requireSuperAdmin();
  if (!session) {
    return { success: false as const, error: "Unauthorized" };
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.conversation.deleteMany({ where: { matchId } });
      await tx.match.update({
        where: { id: matchId },
        data: { status: "SUGGESTED" },
      });
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
