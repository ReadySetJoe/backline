import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Check for profile existence — redirect to onboarding if not set up
  let profileName: string | null = null;

  if (session.user.role === "ARTIST") {
    const profile = await db.artistProfile.findUnique({
      where: { userId: session.user.id },
      select: { name: true },
    });
    if (!profile) {
      redirect("/onboarding");
    }
    profileName = profile.name;
  } else if (session.user.role === "VENUE") {
    const profile = await db.venueProfile.findUnique({
      where: { userId: session.user.id },
      select: { name: true },
    });
    if (!profile) {
      redirect("/onboarding");
    }
    profileName = profile.name;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar role={session.user.role} />

      {/* Main content area — offset for desktop sidebar */}
      <div className="md:pl-64">
        <Header
          userEmail={session.user.email}
          profileName={profileName}
        />
        <main className="p-4 md:p-6 pb-20 md:pb-6">{children}</main>
      </div>
    </div>
  );
}
