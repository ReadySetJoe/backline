import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { MatchQueue, type MatchData } from "@/components/matches/match-queue";

export default async function MatchesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  let matches: MatchData[] = [];

  if (session.user.role === "ARTIST") {
    const artistProfile = await db.artistProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!artistProfile) {
      redirect("/onboarding");
    }

    const dbMatches = await db.match.findMany({
      where: { artistId: artistProfile.id },
      include: {
        show: {
          include: {
            venue: {
              select: {
                name: true,
                capacity: true,
              },
            },
            genres: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { score: "desc" },
    });

    matches = dbMatches.map((m) => ({
      id: m.id,
      status: m.status,
      score: m.score,
      genres: m.show.genres,
      venueName: m.show.venue.name,
      showTitle: m.show.title,
      showDate: m.show.date.toISOString(),
      venueCapacity: m.show.venue.capacity,
      compensationType: m.show.compensationType,
    }));
  } else if (session.user.role === "VENUE") {
    const venueProfile = await db.venueProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!venueProfile) {
      redirect("/onboarding");
    }

    const dbMatches = await db.match.findMany({
      where: {
        show: {
          venueId: venueProfile.id,
        },
      },
      include: {
        artist: {
          select: {
            name: true,
            artistType: true,
            drawEstimate: true,
            sampleUrls: true,
            genres: {
              select: { id: true, name: true },
            },
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
    });

    matches = dbMatches.map((m) => ({
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
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Your Matches</h1>
        <p className="text-muted-foreground mt-1">
          {session.user.role === "ARTIST"
            ? "Discover shows and venues looking for artists like you."
            : "Find the right artists for your upcoming shows."}
        </p>
      </div>

      <MatchQueue
        matches={matches}
        role={session.user.role as "ARTIST" | "VENUE"}
      />
    </div>
  );
}
