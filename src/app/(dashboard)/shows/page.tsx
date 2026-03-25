import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShowCard } from "@/components/shows/show-card";
import { ArtistShows } from "@/components/shows/artist-shows";

export default async function ShowsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role === "ARTIST") {
    return <ArtistShowsView userId={session.user.id} />;
  }

  // VENUE role
  const venueProfile = await db.venueProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!venueProfile) {
    redirect("/onboarding");
  }

  const shows = await db.show.findMany({
    where: { venueId: venueProfile.id },
    include: { genres: { select: { id: true, name: true } } },
    orderBy: { date: "asc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Your Shows</h1>
        <Button asChild>
          <Link href="/shows/new">Create a Show</Link>
        </Button>
      </div>

      {shows.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">
            No shows yet. Create your first show!
          </p>
          <Button asChild className="mt-4">
            <Link href="/shows/new">Create a Show</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shows.map((show) => (
            <ShowCard
              key={show.id}
              id={show.id}
              date={show.date}
              title={show.title}
              genres={show.genres}
              slotsTotal={show.slotsTotal}
              slotsFilled={show.slotsFilled}
              status={show.status}
            />
          ))}
        </div>
      )}
    </div>
  );
}

async function ArtistShowsView({ userId }: { userId: string }) {
  const artistProfile = await db.artistProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!artistProfile) {
    redirect("/onboarding");
  }

  // Get all mutual matches (booked shows) for this artist
  const matches = await db.match.findMany({
    where: {
      artistId: artistProfile.id,
      status: "MUTUAL",
    },
    include: {
      show: {
        include: {
          venue: {
            select: {
              name: true,
              profileImage: true,
              address: true,
              city: true,
            },
          },
          genres: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { show: { date: "asc" } },
  });

  const now = new Date();

  const upcoming = matches
    .filter((m) => new Date(m.show.date) >= now)
    .map((m) => ({
      matchId: m.id,
      showId: m.show.id,
      venueName: m.show.venue.name,
      venueImage: m.show.venue.profileImage,
      venueCity: m.show.venue.city,
      showTitle: m.show.title,
      showDate: m.show.date.toISOString(),
      genres: m.show.genres,
      compensationType: m.show.compensationType,
      compensationNote: m.show.compensationNote,
      status: m.show.status,
    }));

  const past = matches
    .filter((m) => new Date(m.show.date) < now)
    .sort(
      (a, b) =>
        new Date(b.show.date).getTime() - new Date(a.show.date).getTime(),
    )
    .map((m) => ({
      matchId: m.id,
      showId: m.show.id,
      venueName: m.show.venue.name,
      venueImage: m.show.venue.profileImage,
      venueCity: m.show.venue.city,
      showTitle: m.show.title,
      showDate: m.show.date.toISOString(),
      genres: m.show.genres,
      compensationType: m.show.compensationType,
      compensationNote: m.show.compensationNote,
      status: m.show.status,
    }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Your Shows</h1>
        <p className="text-muted-foreground mt-1">
          Shows you&apos;ve been booked for through matches.
        </p>
      </div>

      <ArtistShows upcoming={upcoming} past={past} />
    </div>
  );
}
