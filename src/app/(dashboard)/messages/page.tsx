import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import {
  ConversationList,
  type ConversationSummary,
} from "@/components/messages/conversation-list";

export default async function MessagesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const userId = session.user.id;

  // Find all conversations the user is part of (via Match -> ArtistProfile or VenueProfile)
  const conversations = await db.conversation.findMany({
    where: {
      match: {
        OR: [{ artist: { userId } }, { show: { venue: { userId } } }],
      },
    },
    include: {
      match: {
        include: {
          artist: {
            select: { name: true, userId: true },
          },
          show: {
            include: {
              venue: {
                select: { name: true, userId: true },
              },
            },
          },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          body: true,
          createdAt: true,
        },
      },
    },
  });

  // Build summaries with unread counts
  const summariesWithUnread = await Promise.all(
    conversations.map(async (convo) => {
      const unreadCount = await db.message.count({
        where: {
          conversationId: convo.id,
          senderId: { not: userId },
          read: false,
        },
      });

      // Determine who the "other party" is
      const isArtist = convo.match.artist.userId === userId;
      const otherPartyName = isArtist
        ? convo.match.show.venue.name
        : convo.match.artist.name;

      const lastMessage = convo.messages[0] ?? null;

      return {
        id: convo.id,
        otherPartyName,
        showTitle: convo.match.show.title,
        lastMessageBody: lastMessage?.body ?? null,
        lastMessageAt: lastMessage?.createdAt?.toISOString() ?? null,
        unreadCount,
      } satisfies ConversationSummary;
    }),
  );

  // Order by most recent message (conversations with messages first, then by creation)
  summariesWithUnread.sort((a, b) => {
    const aDate = a.lastMessageAt ?? "";
    const bDate = b.lastMessageAt ?? "";
    return bDate.localeCompare(aDate);
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Messages</h1>
        <p className="text-muted-foreground mt-1">
          Chat with your mutual matches.
        </p>
      </div>

      <ConversationList conversations={summariesWithUnread} />
    </div>
  );
}
