"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { messageSchema } from "@/lib/validations/message";
import { getPusherServer } from "@/lib/pusher/server";
import { revalidatePath } from "next/cache";

export async function sendMessage(input: {
  conversationId: string;
  body: string;
}) {
  const session = await auth();
  if (!session?.user) {
    return { success: false as const, error: "Not authenticated" };
  }

  const parsed = messageSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: "Invalid message" };
  }

  const { conversationId, body } = parsed.data;

  // Fetch conversation with match context to verify participant
  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
    include: {
      match: {
        include: {
          artist: { select: { userId: true } },
          show: {
            include: {
              venue: { select: { userId: true } },
            },
          },
        },
      },
    },
  });

  if (!conversation) {
    return { success: false as const, error: "Conversation not found" };
  }

  // Check user is a participant
  const isArtist = conversation.match.artist.userId === session.user.id;
  const isVenue = conversation.match.show.venue.userId === session.user.id;

  if (!isArtist && !isVenue) {
    return { success: false as const, error: "Not a participant" };
  }

  // Create message in DB
  const message = await db.message.create({
    data: {
      conversationId,
      senderId: session.user.id,
      body,
    },
    include: {
      sender: {
        select: { id: true, email: true },
      },
    },
  });

  // Broadcast via Pusher (best-effort, don't fail the action if Pusher is down)
  try {
    const pusher = getPusherServer();
    await pusher.trigger(`conversation-${conversationId}`, "new-message", {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      senderEmail: message.sender.email,
      body: message.body,
      read: message.read,
      createdAt: message.createdAt.toISOString(),
    });
  } catch {
    // Pusher broadcast failed — message is still saved in DB
    console.error("Failed to broadcast message via Pusher");
  }

  revalidatePath("/messages");

  return {
    success: true as const,
    data: {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      senderEmail: message.sender.email,
      body: message.body,
      read: message.read,
      createdAt: message.createdAt.toISOString(),
    },
  };
}

export async function markMessagesRead(conversationId: string) {
  const session = await auth();
  if (!session?.user) {
    return { success: false as const, error: "Not authenticated" };
  }

  // Verify user is a participant
  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
    include: {
      match: {
        include: {
          artist: { select: { userId: true } },
          show: {
            include: {
              venue: { select: { userId: true } },
            },
          },
        },
      },
    },
  });

  if (!conversation) {
    return { success: false as const, error: "Conversation not found" };
  }

  const isArtist = conversation.match.artist.userId === session.user.id;
  const isVenue = conversation.match.show.venue.userId === session.user.id;

  if (!isArtist && !isVenue) {
    return { success: false as const, error: "Not a participant" };
  }

  // Mark all unread messages where sender is NOT the current user
  await db.message.updateMany({
    where: {
      conversationId,
      senderId: { not: session.user.id },
      read: false,
    },
    data: { read: true },
  });

  revalidatePath("/messages");

  return { success: true as const };
}
