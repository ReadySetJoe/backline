import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShowCard } from "@/components/shows/show-card";

export default async function ShowsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "VENUE") {
    redirect("/dashboard");
  }

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
