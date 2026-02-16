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
import { ArtistType } from "@prisma/client";

const ARTIST_TYPE_TO_LABEL: Record<ArtistType, string> = {
  SOLO: "Solo",
  DUO: "Duo",
  FULL_BAND: "Band",
};

export default async function AdminArtistsPage() {
  const artists = await db.artistProfile.findMany({
    include: { user: { select: { id: true, email: true } }, genres: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Artists</h1>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Members</TableHead>
            <TableHead>Draw</TableHead>
            <TableHead>Genres</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {artists.map((artist) => (
            <TableRow key={artist.id}>
              <TableCell>{artist.name}</TableCell>
              <TableCell>{artist.user.email}</TableCell>
              <TableCell>{artist.location}</TableCell>
              <TableCell>{ARTIST_TYPE_TO_LABEL[artist.artistType]}</TableCell>
              <TableCell>{artist.memberCount}</TableCell>
              <TableCell>{artist.drawEstimate ?? "N/A"}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {artist.genres.map((genre) => (
                    <Badge key={genre.id} variant="secondary">
                      {genre.name}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <DeleteButton userId={artist.user.id} label={artist.name} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
