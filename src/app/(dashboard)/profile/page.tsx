import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { ArtistProfileForm } from "@/components/profile/artist-profile-form";
import { VenueProfileForm } from "@/components/profile/venue-profile-form";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const genres = await db.genre.findMany({
    orderBy: { name: "asc" },
  });

  if (session.user.role === "ARTIST") {
    const profile = await db.artistProfile.findUnique({
      where: { userId: session.user.id },
      include: { genres: true },
    });

    if (!profile) {
      redirect("/onboarding");
    }

    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>
        <ArtistProfileForm
          profile={{
            name: profile.name,
            bio: profile.bio ?? "",
            location: profile.location,
            latitude: profile.latitude ?? null,
            longitude: profile.longitude ?? null,
            artistType: profile.artistType,
            memberCount: profile.memberCount,
            genreIds: profile.genres.map((g) => g.id),
            spotifyUrl: profile.spotifyUrl ?? "",
            bandcampUrl: profile.bandcampUrl ?? "",
            instagramUrl: profile.instagramUrl ?? "",
            websiteUrl: profile.websiteUrl ?? "",
            availabilityPreference: profile.availabilityPreference,
            typicalSetLength: profile.typicalSetLength ?? undefined,
            drawEstimate: profile.drawEstimate ?? undefined,
          }}
          genres={genres}
        />
      </div>
    );
  }

  // VENUE role
  const profile = await db.venueProfile.findUnique({
    where: { userId: session.user.id },
    include: { genres: true },
  });

  if (!profile) {
    redirect("/onboarding");
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>
      <VenueProfileForm
        profile={{
          name: profile.name,
          bio: profile.bio ?? "",
          address: profile.address,
          city: profile.city,
          latitude: profile.latitude ?? null,
          longitude: profile.longitude ?? null,
          capacity: profile.capacity,
          genreIds: profile.genres.map((g) => g.id),
          hasPa: profile.hasPa,
          hasBackline: profile.hasBackline,
          stageSize: profile.stageSize ?? "",
          ageRestriction: profile.ageRestriction,
          websiteUrl: profile.websiteUrl ?? "",
          instagramUrl: profile.instagramUrl ?? "",
        }}
        genres={genres}
      />
    </div>
  );
}
