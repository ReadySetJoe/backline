"use client";

import type { MatchStatus, ArtistType } from "@prisma/client";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { MatchCard } from "@/components/matches/match-card";

export interface MatchData {
  id: string;
  status: MatchStatus;
  score: number;
  genres: { id: string; name: string }[];
  // Artist viewing shows/venues
  venueName?: string;
  showTitle?: string | null;
  showDate?: string; // serialized from server
  venueCapacity?: number;
  compensationType?: string | null;
  // Venue viewing artists
  artistName?: string;
  drawEstimate?: number | null;
  artistType?: ArtistType;
  sampleUrls?: string[];
}

interface MatchQueueProps {
  matches: MatchData[];
  role: "ARTIST" | "VENUE";
}

const ACTIVE_STATUSES: MatchStatus[] = [
  "SUGGESTED",
  "LIKED_BY_ARTIST",
  "LIKED_BY_VENUE",
  "MUTUAL",
];

export function MatchQueue({ matches, role }: MatchQueueProps) {
  const suggestedMatches = matches.filter((m) =>
    ACTIVE_STATUSES.includes(m.status)
  );
  const passedMatches = matches.filter((m) => m.status === "PASSED");

  return (
    <Tabs defaultValue="suggested" className="w-full">
      <TabsList>
        <TabsTrigger value="suggested">
          Suggested{suggestedMatches.length > 0 && ` (${suggestedMatches.length})`}
        </TabsTrigger>
        <TabsTrigger value="passed">
          Passed{passedMatches.length > 0 && ` (${passedMatches.length})`}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="suggested" className="mt-4">
        {suggestedMatches.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              No matches yet. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {suggestedMatches.map((match) => (
              <MatchCard
                key={match.id}
                matchId={match.id}
                status={match.status}
                score={match.score}
                role={role}
                tab="suggested"
                genres={match.genres}
                venueName={match.venueName}
                showTitle={match.showTitle}
                showDate={match.showDate ? new Date(match.showDate) : undefined}
                venueCapacity={match.venueCapacity}
                compensationType={match.compensationType}
                artistName={match.artistName}
                drawEstimate={match.drawEstimate}
                artistType={match.artistType}
                sampleUrls={match.sampleUrls}
              />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="passed" className="mt-4">
        {passedMatches.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              No passed matches.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {passedMatches.map((match) => (
              <MatchCard
                key={match.id}
                matchId={match.id}
                status={match.status}
                score={match.score}
                role={role}
                tab="passed"
                genres={match.genres}
                venueName={match.venueName}
                showTitle={match.showTitle}
                showDate={match.showDate ? new Date(match.showDate) : undefined}
                venueCapacity={match.venueCapacity}
                compensationType={match.compensationType}
                artistName={match.artistName}
                drawEstimate={match.drawEstimate}
                artistType={match.artistType}
                sampleUrls={match.sampleUrls}
              />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
