import { db } from "@/lib/db";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default async function AdminOverviewPage() {
  const [
    totalArtists,
    totalVenues,
    totalShows,
    openShows,
    totalMatches,
    mutualMatches,
    totalConversations,
    totalMessages,
  ] = await Promise.all([
    db.artistProfile.count(),
    db.venueProfile.count(),
    db.show.count(),
    db.show.count({ where: { status: "OPEN" } }),
    db.match.count(),
    db.match.count({ where: { status: "MUTUAL" } }),
    db.conversation.count(),
    db.message.count(),
  ]);

  const stats = [
    { label: "Total Artists", value: totalArtists },
    { label: "Total Venues", value: totalVenues },
    {
      label: "Total Shows",
      value: totalShows,
      secondary: `${openShows} open`,
    },
    {
      label: "Total Matches",
      value: totalMatches,
      secondary: `${mutualMatches} mutual`,
    },
    { label: "Total Conversations", value: totalConversations },
    { label: "Total Messages", value: totalMessages },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader>
              <CardTitle>
                <span className="text-2xl font-bold">
                  {stat.value}
                  {stat.secondary && (
                    <span className="text-sm text-muted-foreground font-normal ml-2">
                      ({stat.secondary})
                    </span>
                  )}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
