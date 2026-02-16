"use client";

import type { MatchStatus, ArtistType } from "@prisma/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

export function MatchQueue({ matches, role }: MatchQueueProps) {
  // "Suggested" = needs action: new suggestions + the other side liked you
  const suggestedStatuses: MatchStatus[] =
    role === "ARTIST"
      ? ["SUGGESTED", "LIKED_BY_VENUE"]
      : ["SUGGESTED", "LIKED_BY_ARTIST"];

  // "Interested" = you acted: you liked (waiting) + mutual
  const interestedStatuses: MatchStatus[] =
    role === "ARTIST"
      ? ["LIKED_BY_ARTIST", "MUTUAL"]
      : ["LIKED_BY_VENUE", "MUTUAL"];

  const suggestedMatches = matches.filter((m) =>
    suggestedStatuses.includes(m.status),
  );
  const interestedMatches = matches.filter((m) =>
    interestedStatuses.includes(m.status),
  );
  const passedMatches = matches.filter((m) => m.status === "PASSED");

  function renderCards(
    list: MatchData[],
    tab: "suggested" | "interested" | "passed",
  ) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((match) => (
          <MatchCard
            key={match.id}
            matchId={match.id}
            status={match.status}
            score={match.score}
            role={role}
            tab={tab}
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
    );
  }

  return (
    <Tabs defaultValue="suggested" className="w-full">
      <TabsList>
        <TabsTrigger value="suggested">
          Suggested
          {suggestedMatches.length > 0 && ` (${suggestedMatches.length})`}
        </TabsTrigger>
        <TabsTrigger value="interested">
          Interested
          {interestedMatches.length > 0 && ` (${interestedMatches.length})`}
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
          renderCards(suggestedMatches, "suggested")
        )}
      </TabsContent>

      <TabsContent value="interested" className="mt-4">
        {interestedMatches.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              No interested matches yet. Like some suggestions to get started!
            </p>
          </div>
        ) : (
          renderCards(interestedMatches, "interested")
        )}
      </TabsContent>

      <TabsContent value="passed" className="mt-4">
        {passedMatches.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No passed matches.</p>
          </div>
        ) : (
          renderCards(passedMatches, "passed")
        )}
      </TabsContent>
    </Tabs>
  );
}
