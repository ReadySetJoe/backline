"use client";

import Link from "next/link";
import type { CompensationType, ShowStatus } from "@prisma/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface ArtistShow {
  matchId: string;
  showId: string;
  venueName: string;
  venueImage: string | null;
  venueCity: string;
  showTitle: string | null;
  showDate: string;
  genres: { id: string; name: string }[];
  compensationType: CompensationType | null;
  compensationNote: string | null;
  status: ShowStatus;
}

interface ArtistShowsProps {
  upcoming: ArtistShow[];
  past: ArtistShow[];
}

const COMPENSATION_LABELS: Record<CompensationType, string> = {
  DOOR_SPLIT: "Door Split",
  GUARANTEE: "Guarantee",
  GUARANTEE_PLUS_DOOR_SPLIT: "Guarantee + Door",
  OTHER: "Other",
};

const STATUS_STYLES: Record<ShowStatus, { label: string; className: string }> =
  {
    OPEN: {
      label: "Confirmed",
      className:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    },
    FULL: {
      label: "Full Lineup",
      className:
        "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    },
    CANCELLED: {
      label: "Cancelled",
      className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    },
  };

function formatShowDate(dateString: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateString));
}

function getInitials(name: string): string {
  if (!name.trim()) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function ShowListItem({ show, isPast }: { show: ArtistShow; isPast: boolean }) {
  const statusStyle = STATUS_STYLES[show.status];

  return (
    <Link href={`/messages`}>
      <Card
        className={`transition-shadow hover:shadow-md cursor-pointer ${isPast ? "opacity-75" : ""}`}
      >
        <CardContent className="flex gap-4 py-4 px-4">
          <Avatar className="h-12 w-12 shrink-0">
            {show.venueImage && <AvatarImage src={show.venueImage} alt="" />}
            <AvatarFallback>{getInitials(show.venueName)}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-sm truncate">
                  {show.showTitle || "Show"} at {show.venueName}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {formatShowDate(show.showDate)} &middot; {show.venueCity}
                </p>
              </div>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0 ${statusStyle.className}`}
              >
                {isPast ? "Played" : statusStyle.label}
              </span>
            </div>

            {show.genres.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {show.genres.map((genre) => (
                  <Badge key={genre.id} variant="secondary" className="text-xs">
                    {genre.name}
                  </Badge>
                ))}
              </div>
            )}

            {show.compensationType && (
              <p className="text-xs text-muted-foreground">
                {COMPENSATION_LABELS[show.compensationType]}
                {show.compensationNote && ` \u2014 ${show.compensationNote}`}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function ArtistShows({ upcoming, past }: ArtistShowsProps) {
  const hasShows = upcoming.length > 0 || past.length > 0;

  if (!hasShows) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg">No shows yet.</p>
        <p className="text-muted-foreground text-sm mt-1">
          When you and a venue both like each other, the show will appear here.
        </p>
      </div>
    );
  }

  return (
    <Tabs defaultValue="upcoming" className="w-full">
      <TabsList>
        <TabsTrigger value="upcoming">
          Upcoming{upcoming.length > 0 && ` (${upcoming.length})`}
        </TabsTrigger>
        <TabsTrigger value="past">
          Past{past.length > 0 && ` (${past.length})`}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="upcoming" className="mt-4">
        {upcoming.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              No upcoming shows. Check your matches!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((show) => (
              <ShowListItem key={show.matchId} show={show} isPast={false} />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="past" className="mt-4">
        {past.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No past shows yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {past.map((show) => (
              <ShowListItem key={show.matchId} show={show} isPast={true} />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
