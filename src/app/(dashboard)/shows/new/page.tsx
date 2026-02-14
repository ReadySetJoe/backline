import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { ShowForm } from "@/components/shows/show-form";

export default async function NewShowPage() {
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

  const genres = await db.genre.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex justify-center">
      <ShowForm genres={genres} />
    </div>
  );
}
