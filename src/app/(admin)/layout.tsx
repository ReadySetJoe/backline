import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { Header } from "@/components/layout/header";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />

      {/* Main content area — offset for desktop sidebar */}
      <div className="md:pl-64">
        <Header userEmail={session.user.email} profileName="Admin" />
        <main className="p-4 md:p-6 pb-20 md:pb-6">{children}</main>
      </div>
    </div>
  );
}
