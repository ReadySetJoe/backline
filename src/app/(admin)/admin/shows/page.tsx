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
import { CancelShowButton } from "@/components/admin/cancel-show-button";

export default async function AdminShowsPage() {
  const shows = await db.show.findMany({
    include: {
      venue: { select: { name: true } },
      genres: true,
      _count: { select: { matches: true } },
    },
    orderBy: { date: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Shows</h1>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Venue</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Slots</TableHead>
            <TableHead>Matches</TableHead>
            <TableHead>Genres</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shows.map((show) => (
            <TableRow key={show.id}>
              <TableCell>{show.title || "Untitled"}</TableCell>
              <TableCell>{show.venue.name}</TableCell>
              <TableCell>{show.date.toLocaleDateString()}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    show.status === "CANCELLED"
                      ? "destructive"
                      : show.status === "FULL"
                        ? "secondary"
                        : "outline"
                  }
                >
                  {show.status}
                </Badge>
              </TableCell>
              <TableCell>
                {show.slotsFilled} / {show.slotsTotal}
              </TableCell>
              <TableCell>{show._count.matches}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {show.genres.map((genre) => (
                    <Badge key={genre.id} variant="secondary">
                      {genre.name}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                {show.status === "OPEN" && (
                  <CancelShowButton
                    showId={show.id}
                    title={show.title || "Untitled"}
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
