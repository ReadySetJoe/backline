import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShowStatusButtons } from "@/components/shows/show-status-buttons";

interface ShowDetailPageProps {
  params: Promise<{ id: string }>;
}

function formatShowDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

const STATUS_STYLES = {
  OPEN: { label: "Open", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  FULL: { label: "Full", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  CANCELLED: { label: "Cancelled", className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
} as const;

export default async function ShowDetailPage({ params }: ShowDetailPageProps) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const show = await db.show.findUnique({
    where: { id },
    include: {
      genres: { select: { id: true, name: true } },
      venue: { select: { userId: true, name: true } },
    },
  });

  if (!show) {
    notFound();
  }

  // Verify current user owns this show
  if (show.venue.userId !== session.user.id) {
    redirect("/dashboard");
  }

  const statusStyle = STATUS_STYLES[show.status];

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-sm text-muted-foreground mb-1">
            {formatShowDate(show.date)}
          </p>
          <h1 className="text-2xl font-bold">
            {show.title || "Untitled Show"}
          </h1>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${statusStyle.className}`}
        >
          {statusStyle.label}
        </span>
      </div>

      <Separator className="mb-6" />

      {/* Show details */}
      <div className="space-y-6">
        {/* Genres */}
        {show.genres.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-muted-foreground mb-2">
              Genres
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {show.genres.map((genre) => (
                <Badge key={genre.id} variant="secondary">
                  {genre.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Slots */}
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-1">
            Artist Slots
          </h2>
          <p className="text-foreground">
            {show.slotsFilled} of {show.slotsTotal} filled
          </p>
        </div>

        {/* Description */}
        {show.note && (
          <div>
            <h2 className="text-sm font-medium text-muted-foreground mb-1">
              Description
            </h2>
            <p className="text-foreground whitespace-pre-wrap">{show.note}</p>
          </div>
        )}

        {/* Compensation */}
        {(show.compensationType || show.compensationNote) && (
          <div>
            <h2 className="text-sm font-medium text-muted-foreground mb-1">
              Compensation
            </h2>
            {show.compensationType && (
              <p className="text-foreground font-medium">
                {show.compensationType}
              </p>
            )}
            {show.compensationNote && (
              <p className="text-foreground text-sm mt-1">
                {show.compensationNote}
              </p>
            )}
          </div>
        )}

        <Separator />

        {/* Status management */}
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">
            Manage Status
          </h2>
          <ShowStatusButtons showId={show.id} currentStatus={show.status} />
        </div>

        <Separator />

        {/* Matches placeholder */}
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-2">
            Matched Artists
          </h2>
          <div className="rounded-md border border-dashed border-border p-6 text-center">
            <p className="text-muted-foreground text-sm">
              Matches will appear here
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
