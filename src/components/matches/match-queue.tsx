"use client";

import { useState, useMemo } from "react";
import type { MatchStatus, ArtistType, CompensationType } from "@prisma/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MatchCard } from "@/components/matches/match-card";

export interface MatchData {
  id: string;
  status: MatchStatus;
  score: number;
  genres: { id: string; name: string }[];
  profileImage?: string | null;
  // Artist viewing shows/venues
  venueName?: string;
  showTitle?: string | null;
  showDate?: string; // serialized from server
  venueCapacity?: number;
  compensationType?: CompensationType | null;
  // Venue viewing artists
  artistName?: string;
  drawEstimate?: number | null;
  artistType?: ArtistType;
  sampleUrls?: string[];
}

type SortOption = "best-match" | "soonest-show" | "newest";

interface MatchQueueProps {
  matches: MatchData[];
  role: "ARTIST" | "VENUE";
}

function sortMatches(list: MatchData[], sort: SortOption): MatchData[] {
  const sorted = [...list];
  switch (sort) {
    case "best-match":
      return sorted.sort((a, b) => b.score - a.score);
    case "soonest-show":
      return sorted.sort((a, b) => {
        const aDate = a.showDate ?? "";
        const bDate = b.showDate ?? "";
        if (!aDate && !bDate) return b.score - a.score;
        if (!aDate) return 1;
        if (!bDate) return -1;
        return aDate.localeCompare(bDate);
      });
    case "newest":
      return sorted.sort((a, b) => {
        const aDate = a.showDate ?? "";
        const bDate = b.showDate ?? "";
        if (!aDate && !bDate) return b.score - a.score;
        if (!aDate) return 1;
        if (!bDate) return -1;
        return bDate.localeCompare(aDate);
      });
    default:
      return sorted;
  }
}

export function MatchQueue({ matches, role }: MatchQueueProps) {
  const [sort, setSort] = useState<SortOption>("best-match");

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

  const suggestedMatches = useMemo(
    () =>
      sortMatches(
        matches.filter((m) => suggestedStatuses.includes(m.status)),
        sort,
      ),
    [matches, sort, suggestedStatuses],
  );
  const interestedMatches = useMemo(
    () =>
      sortMatches(
        matches.filter((m) => interestedStatuses.includes(m.status)),
        sort,
      ),
    [matches, sort, interestedStatuses],
  );
  const passedMatches = useMemo(
    () =>
      sortMatches(
        matches.filter((m) => m.status === "PASSED"),
        sort,
      ),
    [matches, sort],
  );

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
            profileImage={match.profileImage}
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
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Tabs defaultValue="suggested" className="w-full">
          <div className="flex items-center justify-between gap-4">
            <TabsList>
              <TabsTrigger value="suggested">
                Suggested
                {suggestedMatches.length > 0 && ` (${suggestedMatches.length})`}
              </TabsTrigger>
              <TabsTrigger value="interested">
                Interested
                {interestedMatches.length > 0 &&
                  ` (${interestedMatches.length})`}
              </TabsTrigger>
              <TabsTrigger value="passed">
                Passed
                {passedMatches.length > 0 && ` (${passedMatches.length})`}
              </TabsTrigger>
            </TabsList>

            <Select
              value={sort}
              onValueChange={(v) => setSort(v as SortOption)}
            >
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="best-match">Best Match</SelectItem>
                <SelectItem value="soonest-show">Soonest Show</SelectItem>
                <SelectItem value="newest">Newest Show</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
                  No interested matches yet. Like some suggestions to get
                  started!
                </p>
              </div>
            ) : (
              renderCards(interestedMatches, "interested")
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
              renderCards(passedMatches, "passed")
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
