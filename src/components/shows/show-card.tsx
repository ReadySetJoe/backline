import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ShowStatus } from "@prisma/client";

interface ShowCardProps {
  id: string;
  date: Date;
  title: string | null;
  genres: { id: string; name: string }[];
  slotsTotal: number;
  slotsFilled: number;
  status: ShowStatus;
}

const STATUS_STYLES: Record<ShowStatus, { label: string; className: string }> = {
  OPEN: { label: "Open", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  FULL: { label: "Full", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  CANCELLED: { label: "Cancelled", className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
};

function formatShowDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function ShowCard({
  id,
  date,
  title,
  genres,
  slotsTotal,
  slotsFilled,
  status,
}: ShowCardProps) {
  const statusStyle = STATUS_STYLES[status];

  return (
    <Link href={`/shows/${id}`} className="block">
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                {formatShowDate(date)}
              </p>
              <CardTitle className="text-lg">
                {title || "Untitled Show"}
              </CardTitle>
            </div>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyle.className}`}
            >
              {statusStyle.label}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {genres.map((genre) => (
                  <Badge key={genre.id} variant="secondary">
                    {genre.name}
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              {slotsFilled} of {slotsTotal} slots filled
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
