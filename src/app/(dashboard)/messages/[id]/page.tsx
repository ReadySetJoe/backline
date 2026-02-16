import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { Chat, type ChatMessage } from "@/components/messages/chat";

interface ConversationPageProps {
  params: Promise<{ id: string }>;
}

export default async function ConversationPage({
  params,
}: ConversationPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { id: conversationId } = await params;

  // Fetch conversation with all messages, match context, participant info
  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
    include: {
      match: {
        include: {
          artist: {
            select: { name: true, userId: true },
          },
          show: {
            select: {
              title: true,
              date: true,
              venue: {
                select: { name: true, userId: true },
              },
            },
          },
        },
      },
      messages: {
        orderBy: { createdAt: "asc" },
        include: {
          sender: {
            select: { id: true, email: true },
          },
        },
      },
    },
  });

  if (!conversation) {
    notFound();
  }

  // Verify user is a participant
  const isArtist = conversation.match.artist.userId === session.user.id;
  const isVenue = conversation.match.show.venue.userId === session.user.id;

  if (!isArtist && !isVenue) {
    notFound();
  }

  // Mark unread messages from the other party as read
  await db.message.updateMany({
    where: {
      conversationId,
      senderId: { not: session.user.id },
      read: false,
    },
    data: { read: true },
  });

  // Determine the other party's name
  const otherPartyName = isArtist
    ? conversation.match.show.venue.name
    : conversation.match.artist.name;

  // Map messages to serializable format
  const chatMessages: ChatMessage[] = conversation.messages.map((msg) => ({
    id: msg.id,
    conversationId: msg.conversationId,
    senderId: msg.senderId,
    senderEmail: msg.sender.email,
    body: msg.body,
    read: msg.read,
    createdAt: msg.createdAt.toISOString(),
  }));

  return (
    <Chat
      conversationId={conversationId}
      initialMessages={chatMessages}
      currentUserId={session.user.id}
      currentUserEmail={session.user.email}
      otherPartyName={otherPartyName}
      showTitle={conversation.match.show.title}
      artistName={conversation.match.artist.name}
      venueName={conversation.match.show.venue.name}
    />
  );
}
