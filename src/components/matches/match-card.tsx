"use client";

import { useState, useTransition } from "react";
import type { MatchStatus, ArtistType } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { likeMatch, passMatch, reconsiderMatch } from "@/actions/match";

interface MatchCardProps {
  matchId: string;
  status: MatchStatus;
  score: number;
  role: "ARTIST" | "VENUE";
  tab: "suggested" | "passed";
  // For artists viewing shows/venues
  venueName?: string;
  showTitle?: string | null;
  showDate?: Date;
  venueCapacity?: number;
  compensationType?: string | null;
  // For venues viewing artists
  artistName?: string;
  drawEstimate?: number | null;
  artistType?: ArtistType;
  sampleUrls?: string[];
  // Shared
  genres: { id: string; name: string }[];
}

export const ARTIST_TYPE_LABELS: Record<ArtistType, string> = {
  SOLO: "Solo",
  DUO: "Duo",
  FULL_BAND: "Full Band",
};

export const PAYMENT_TYPE_LABELS: Record<string, string> = {
  door_split: "Door Split",
  guarantee: "Guarantee",
  other: "Other",
};

function formatShowDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function MatchCard({
  matchId,
  status,
  score,
  role,
  tab,
  venueName,
  showTitle,
  showDate,
  venueCapacity,
  compensationType,
  artistName,
  drawEstimate,
  artistType,
  sampleUrls,
  genres,
}: MatchCardProps) {
  const [isPending, startTransition] = useTransition();
  const [currentStatus, setCurrentStatus] = useState(status);

  // Determine if the other side has already liked
  const otherSideLiked =
    (role === "ARTIST" && currentStatus === "LIKED_BY_VENUE") ||
    (role === "VENUE" && currentStatus === "LIKED_BY_ARTIST");

  const isMutual = currentStatus === "MUTUAL";

  function handleLike() {
    startTransition(async () => {
      const result = await likeMatch(matchId);
      if (result.success && result.data) {
        setCurrentStatus(result.data.status);
      }
    });
  }

  function handlePass() {
    startTransition(async () => {
      const result = await passMatch(matchId);
      if (result.success) {
        setCurrentStatus("PASSED");
      }
    });
  }

  function handleReconsider() {
    startTransition(async () => {
      const result = await reconsiderMatch(matchId);
      if (result.success) {
        setCurrentStatus("SUGGESTED");
      }
    });
  }

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            {role === "ARTIST" ? (
              <>
                <CardTitle className="text-lg">{venueName}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {showTitle || "Untitled Show"}
                  {showDate && ` \u2014 ${formatShowDate(showDate)}`}
                </p>
              </>
            ) : (
              <>
                <CardTitle className="text-lg">{artistName}</CardTitle>
                {artistType && (
                  <p className="text-sm text-muted-foreground">
                    {ARTIST_TYPE_LABELS[artistType]}
                  </p>
                )}
              </>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              {score}% match
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {genres.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {genres.map((genre) => (
              <Badge key={genre.id} variant="secondary">
                {genre.name}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {role === "ARTIST" && (
            <>
              {venueCapacity != null && <span>Capacity: {venueCapacity}</span>}
              {compensationType && (
                <span>Pay: {PAYMENT_TYPE_LABELS[compensationType]}</span>
              )}
            </>
          )}

          {role === "VENUE" && (
            <>
              {drawEstimate != null && <span>Draw: ~{drawEstimate}</span>}
              {sampleUrls && sampleUrls.length > 0 && (
                <a
                  href={sampleUrls[0]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-2 hover:text-primary/80"
                >
                  Listen to sample
                </a>
              )}
            </>
          )}
        </div>

        {otherSideLiked && (
          <>
            <Separator />
            <p className="text-sm font-medium text-green-600 dark:text-green-400">
              They&apos;re interested!
            </p>
          </>
        )}

        {isMutual && (
          <>
            <Separator />
            <p className="text-sm font-medium text-primary">
              It&apos;s a match! Check your messages.
            </p>
          </>
        )}
      </CardContent>

      <CardFooter className="gap-2">
        {tab === "suggested" && !isMutual && (
          <>
            <Button
              size="sm"
              onClick={handleLike}
              disabled={isPending}
              className="flex-1"
            >
              <HeartIcon className="mr-1.5 h-4 w-4" />
              Interested
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handlePass}
              disabled={isPending}
              className="flex-1"
            >
              <XIcon className="mr-1.5 h-4 w-4" />
              Pass
            </Button>
          </>
        )}

        {tab === "suggested" && isMutual && (
          <Button size="sm" variant="outline" disabled className="flex-1">
            Matched
          </Button>
        )}

        {tab === "passed" && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleReconsider}
            disabled={isPending}
            className="flex-1"
          >
            <UndoIcon className="mr-1.5 h-4 w-4" />
            Reconsider
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

// Inline SVG icons to avoid external dependencies

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function UndoIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
  );
}
