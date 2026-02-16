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
import { DeleteButton } from "@/components/admin/delete-button";

function formatAgeRestriction(restriction: string) {
  switch (restriction) {
    case "ALL_AGES":
      return "All Ages";
    case "EIGHTEEN_PLUS":
      return "18+";
    case "TWENTY_ONE_PLUS":
      return "21+";
    default:
      return restriction;
  }
}

export default async function AdminVenuesPage() {
  const venues = await db.venueProfile.findMany({
    include: {
      user: { select: { id: true, email: true } },
      genres: true,
      _count: { select: { shows: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Venues</h1>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>City</TableHead>
            <TableHead>Capacity</TableHead>
            <TableHead>Age Restriction</TableHead>
            <TableHead>PA / Backline</TableHead>
            <TableHead>Shows</TableHead>
            <TableHead>Genres</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {venues.map((venue) => (
            <TableRow key={venue.id}>
              <TableCell>{venue.name}</TableCell>
              <TableCell>{venue.user.email}</TableCell>
              <TableCell>{venue.city}</TableCell>
              <TableCell>{venue.capacity}</TableCell>
              <TableCell>
                {formatAgeRestriction(venue.ageRestriction)}
              </TableCell>
              <TableCell>
                {venue.hasPa ? "Yes" : "No"} /{" "}
                {venue.hasBackline ? "Yes" : "No"}
              </TableCell>
              <TableCell>{venue._count.shows}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {venue.genres.map((genre) => (
                    <Badge key={genre.id} variant="secondary">
                      {genre.name}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <DeleteButton userId={venue.user.id} label={venue.name} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
