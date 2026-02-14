import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { ArtistOnboarding } from "@/components/onboarding/artist-onboarding";
import { VenueOnboarding } from "@/components/onboarding/venue-onboarding";

export default async function OnboardingPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Check if user already has a profile
  if (session.user.role === "ARTIST") {
    const existing = await db.artistProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (existing) redirect("/dashboard");
  } else if (session.user.role === "VENUE") {
    const existing = await db.venueProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (existing) redirect("/dashboard");
  }

  const genres = await db.genre.findMany({
    orderBy: { name: "asc" },
  });

  if (session.user.role === "ARTIST") {
    return <ArtistOnboarding genres={genres} />;
  }

  return <VenueOnboarding genres={genres} />;
}
