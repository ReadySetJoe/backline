import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div>
      <h1 className="text-2xl font-bold">Welcome to Backline</h1>
      <p className="text-muted-foreground mt-2">
        {session?.user.role === "ARTIST"
          ? "Find shows looking for your sound."
          : "Find the right artists for your shows."}
      </p>
    </div>
  );
}
