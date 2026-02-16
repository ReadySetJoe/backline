import { db } from "@/lib/db";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ResetMatchButton } from "@/components/admin/reset-match-button";

const statusLabels: Record<string, string> = {
  SUGGESTED: "Suggested",
  LIKED_BY_ARTIST: "Liked by Artist",
  LIKED_BY_VENUE: "Liked by Venue",
  MUTUAL: "Mutual",
  PASSED: "Passed",
};

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "SUGGESTED":
      return <Badge variant="secondary">{statusLabels[status]}</Badge>;
    case "LIKED_BY_ARTIST":
    case "LIKED_BY_VENUE":
      return <Badge variant="default">{statusLabels[status]}</Badge>;
    case "MUTUAL":
      return (
        <Badge className="bg-green-100 text-green-800">
          {statusLabels[status]}
        </Badge>
      );
    case "PASSED":
      return <Badge variant="destructive">{statusLabels[status]}</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export default async function AdminMatchesPage() {
  const matches = await db.match.findMany({
    include: {
      artist: { select: { name: true } },
      show: {
        select: {
          title: true,
          date: true,
          venue: { select: { name: true } },
        },
      },
    },
    orderBy: { score: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Matches</h1>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Artist</TableHead>
            <TableHead>Show</TableHead>
            <TableHead>Venue</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {matches.map((match) => (
            <TableRow key={match.id}>
              <TableCell>{match.artist.name}</TableCell>
              <TableCell>{match.show.title || "Untitled"}</TableCell>
              <TableCell>{match.show.venue.name}</TableCell>
              <TableCell>{match.score}</TableCell>
              <TableCell>
                <StatusBadge status={match.status} />
              </TableCell>
              <TableCell>
                {match.status !== "SUGGESTED" && (
                  <ResetMatchButton
                    matchId={match.id}
                    artistName={match.artist.name}
                  />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
