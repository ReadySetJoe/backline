import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { VenueDashboard } from "@/components/dashboard/venue-dashboard";
import type { MatchData } from "@/components/matches/match-queue";
import type { ConversationSummary } from "@/components/messages/conversation-list";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role === "VENUE") {
    return <VenueDashboardView userId={session.user.id} />;
  }

  // ARTIST role — keep the current welcome placeholder
  return (
    <div>
      <h1 className="text-2xl font-bold">Welcome to Backline</h1>
      <p className="text-muted-foreground mt-2">
        Find shows looking for your sound.
      </p>
    </div>
  );
}

async function VenueDashboardView({ userId }: { userId: string }) {
  const venueProfile = await db.venueProfile.findUnique({
    where: { userId },
    select: {
      id: true,
      bio: true,
      profileImage: true,
      stageSize: true,
      hasPa: true,
      hasBackline: true,
      websiteUrl: true,
      instagramUrl: true,
    },
  });

  if (!venueProfile) {
    redirect("/onboarding");
  }

  // Fetch matches, conversations, and shows in parallel
  const [dbMatches, conversations, dbShows] = await Promise.all([
    // Matches: suggested or liked by artist, top 5 by score
    db.match.findMany({
      where: {
        show: { venueId: venueProfile.id },
        status: { in: ["SUGGESTED", "LIKED_BY_ARTIST"] },
      },
      include: {
        artist: {
          select: {
            name: true,
            artistType: true,
            drawEstimate: true,
            sampleUrls: true,
            genres: { select: { id: true, name: true } },
          },
        },
        show: {
          select: {
            title: true,
            date: true,
          },
        },
      },
      orderBy: { score: "desc" },
      take: 5,
    }),

    // Conversations: all conversations this user is part of
    db.conversation.findMany({
      where: {
        match: {
          OR: [{ artist: { userId } }, { show: { venue: { userId } } }],
        },
      },
      include: {
        match: {
          include: {
            artist: { select: { name: true, userId: true } },
            show: {
              include: {
                venue: { select: { name: true, userId: true } },
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { body: true, createdAt: true },
        },
      },
    }),

    // Shows: all open shows for this venue
    db.show.findMany({
      where: {
        venueId: venueProfile.id,
        status: "OPEN",
      },
      include: {
        genres: { select: { id: true, name: true } },
      },
      orderBy: { date: "asc" },
    }),
  ]);

  // Transform matches → MatchData[]
  const matches: MatchData[] = dbMatches.map((m) => ({
    id: m.id,
    status: m.status,
    score: m.score,
    genres: m.artist.genres,
    artistName: m.artist.name,
    artistType: m.artist.artistType,
    drawEstimate: m.artist.drawEstimate,
    sampleUrls: m.artist.sampleUrls,
    showTitle: m.show.title,
    showDate: m.show.date.toISOString(),
  }));

  // Transform conversations → filter to unread only
  const conversationSummaries = await Promise.all(
    conversations.map(async (convo) => {
      const unreadCount = await db.message.count({
        where: {
          conversationId: convo.id,
          senderId: { not: userId },
          read: false,
        },
      });

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

  // Filter to unread only, sort by recency, take 3
  const unreadConversations = conversationSummaries
    .filter((c) => c.unreadCount > 0)
    .sort((a, b) => {
      const aDate = a.lastMessageAt ?? "";
      const bDate = b.lastMessageAt ?? "";
      return bDate.localeCompare(aDate);
    })
    .slice(0, 3);

  // Filter shows with available slots (Prisma can't compare two columns), take 3
  const shows = dbShows
    .filter((s) => s.slotsFilled < s.slotsTotal)
    .slice(0, 3)
    .map((s) => ({
      id: s.id,
      date: s.date.toISOString(),
      title: s.title,
      genres: s.genres,
      slotsTotal: s.slotsTotal,
      slotsFilled: s.slotsFilled,
      status: s.status,
    }));

  // Build profile completion checklist
  const profileItems = [
    { label: "Add a bio", complete: !!venueProfile.bio },
    { label: "Upload a profile image", complete: !!venueProfile.profileImage },
    { label: "Add website URL", complete: !!venueProfile.websiteUrl },
    { label: "Add Instagram URL", complete: !!venueProfile.instagramUrl },
    { label: "Specify stage size", complete: !!venueProfile.stageSize },
    { label: "Indicate PA system availability", complete: venueProfile.hasPa },
    {
      label: "Indicate backline availability",
      complete: venueProfile.hasBackline,
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Find the right artists for your shows.
        </p>
      </div>
      <VenueDashboard
        matches={matches}
        conversations={unreadConversations}
        shows={shows}
        profileItems={profileItems}
      />
    </div>
  );
}
