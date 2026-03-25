import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { VenueDashboard } from "@/components/dashboard/venue-dashboard";
import { ArtistDashboard } from "@/components/dashboard/artist-dashboard";
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

  return <ArtistDashboardView userId={session.user.id} />;
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
        show: { venueId: venueProfile.id, date: { gte: new Date() } },
        status: { in: ["SUGGESTED", "LIKED_BY_ARTIST"] },
      },
      include: {
        artist: {
          select: {
            name: true,
            profileImage: true,
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
            artist: {
              select: { name: true, userId: true, profileImage: true },
            },
            show: {
              include: {
                venue: {
                  select: { name: true, userId: true, profileImage: true },
                },
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
    profileImage: m.artist.profileImage,
    artistName: m.artist.name,
    artistType: m.artist.artistType,
    drawEstimate: m.artist.drawEstimate,
    sampleUrls: m.artist.sampleUrls,
    showTitle: m.show.title,
    showDate: m.show.date.toISOString(),
  }));

  // Batch unread counts in a single query instead of N+1
  const conversationIds = conversations.map((c) => c.id);
  const unreadCounts =
    conversationIds.length > 0
      ? await db.message.groupBy({
          by: ["conversationId"],
          where: {
            conversationId: { in: conversationIds },
            senderId: { not: userId },
            read: false,
          },
          _count: { id: true },
        })
      : [];

  const unreadMap = new Map(
    unreadCounts.map((uc) => [uc.conversationId, uc._count.id]),
  );

  const conversationSummaries = conversations.map((convo) => {
    const isArtist = convo.match.artist.userId === userId;
    const otherPartyName = isArtist
      ? convo.match.show.venue.name
      : convo.match.artist.name;
    const otherPartyImage = isArtist
      ? convo.match.show.venue.profileImage
      : convo.match.artist.profileImage;

    const lastMessage = convo.messages[0] ?? null;

    return {
      id: convo.id,
      otherPartyName,
      otherPartyImage,
      showTitle: convo.match.show.title,
      lastMessageBody: lastMessage?.body ?? null,
      lastMessageAt: lastMessage?.createdAt?.toISOString() ?? null,
      unreadCount: unreadMap.get(convo.id) ?? 0,
    } satisfies ConversationSummary;
  });

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

async function ArtistDashboardView({ userId }: { userId: string }) {
  const artistProfile = await db.artistProfile.findUnique({
    where: { userId },
    select: {
      id: true,
      bio: true,
      profileImage: true,
      spotifyUrl: true,
      bandcampUrl: true,
      instagramUrl: true,
      websiteUrl: true,
      location: true,
      drawEstimate: true,
    },
  });

  if (!artistProfile) {
    redirect("/onboarding");
  }

  const [dbMatches, conversations] = await Promise.all([
    // All matches for this artist
    db.match.findMany({
      where: {
        artistId: artistProfile.id,
        show: { date: { gte: new Date() } },
      },
      include: {
        show: {
          include: {
            venue: {
              select: {
                name: true,
                capacity: true,
                profileImage: true,
              },
            },
            genres: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { score: "desc" },
    }),

    // Conversations
    db.conversation.findMany({
      where: {
        match: {
          OR: [{ artist: { userId } }, { show: { venue: { userId } } }],
        },
      },
      include: {
        match: {
          include: {
            artist: {
              select: { name: true, userId: true, profileImage: true },
            },
            show: {
              include: {
                venue: {
                  select: { name: true, userId: true, profileImage: true },
                },
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
  ]);

  // Split matches: new opportunities vs booked shows
  const suggestedMatches: MatchData[] = dbMatches
    .filter((m) => m.status === "SUGGESTED" || m.status === "LIKED_BY_VENUE")
    .slice(0, 6)
    .map((m) => ({
      id: m.id,
      status: m.status,
      score: m.score,
      genres: m.show.genres,
      profileImage: m.show.venue.profileImage,
      venueName: m.show.venue.name,
      showTitle: m.show.title,
      showDate: m.show.date.toISOString(),
      venueCapacity: m.show.venue.capacity,
      compensationType: m.show.compensationType,
    }));

  const upcomingShows = dbMatches
    .filter((m) => m.status === "MUTUAL")
    .filter((m) => new Date(m.show.date) >= new Date())
    .sort(
      (a, b) =>
        new Date(a.show.date).getTime() - new Date(b.show.date).getTime(),
    )
    .map((m) => ({
      matchId: m.id,
      venueName: m.show.venue.name,
      venueImage: m.show.venue.profileImage,
      showTitle: m.show.title,
      showDate: m.show.date.toISOString(),
      compensationType: m.show.compensationType,
    }));

  // Batch unread counts
  const conversationIds = conversations.map((c) => c.id);
  const unreadCounts =
    conversationIds.length > 0
      ? await db.message.groupBy({
          by: ["conversationId"],
          where: {
            conversationId: { in: conversationIds },
            senderId: { not: userId },
            read: false,
          },
          _count: { id: true },
        })
      : [];

  const unreadMap = new Map(
    unreadCounts.map((uc) => [uc.conversationId, uc._count.id]),
  );

  const unreadConversations = conversations
    .map((convo) => {
      const isArtist = convo.match.artist.userId === userId;
      const otherPartyName = isArtist
        ? convo.match.show.venue.name
        : convo.match.artist.name;
      const otherPartyImage = isArtist
        ? convo.match.show.venue.profileImage
        : convo.match.artist.profileImage;

      const lastMessage = convo.messages[0] ?? null;

      return {
        id: convo.id,
        otherPartyName,
        otherPartyImage,
        showTitle: convo.match.show.title,
        lastMessageBody: lastMessage?.body ?? null,
        lastMessageAt: lastMessage?.createdAt?.toISOString() ?? null,
        unreadCount: unreadMap.get(convo.id) ?? 0,
      } satisfies ConversationSummary;
    })
    .filter((c) => c.unreadCount > 0)
    .sort((a, b) => {
      const aDate = a.lastMessageAt ?? "";
      const bDate = b.lastMessageAt ?? "";
      return bDate.localeCompare(aDate);
    })
    .slice(0, 3);

  // Profile completion checklist
  const profileItems = [
    { label: "Add a bio", complete: !!artistProfile.bio },
    {
      label: "Upload a profile image",
      complete: !!artistProfile.profileImage,
    },
    { label: "Add Spotify URL", complete: !!artistProfile.spotifyUrl },
    { label: "Add Bandcamp URL", complete: !!artistProfile.bandcampUrl },
    { label: "Add Instagram URL", complete: !!artistProfile.instagramUrl },
    { label: "Add website URL", complete: !!artistProfile.websiteUrl },
    {
      label: "Set your draw estimate",
      complete: artistProfile.drawEstimate != null,
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Find shows looking for your sound.
        </p>
      </div>
      <ArtistDashboard
        matches={suggestedMatches}
        upcomingShows={upcomingShows}
        conversations={unreadConversations}
        profileItems={profileItems}
      />
    </div>
  );
}
