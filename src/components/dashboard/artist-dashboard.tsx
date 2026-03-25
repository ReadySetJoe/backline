"use client";

import Link from "next/link";
import type { MatchData } from "@/components/matches/match-queue";
import type { ConversationSummary } from "@/components/messages/conversation-list";
import type { CompensationType } from "@prisma/client";
import { MatchCard } from "@/components/matches/match-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

// ── Types ──────────────────────────────────────────────────────────────

interface UpcomingShow {
  matchId: string;
  venueName: string;
  venueImage: string | null;
  showTitle: string | null;
  showDate: string;
  compensationType: CompensationType | null;
}

interface ProfileCompletionItem {
  label: string;
  complete: boolean;
}

interface ArtistDashboardProps {
  matches: MatchData[];
  upcomingShows: UpcomingShow[];
  conversations: ConversationSummary[];
  profileItems: ProfileCompletionItem[];
}

// ── Helpers ────────────────────────────────────────────────────────────

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

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatShowDate(dateString: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(dateString));
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "...";
}

const COMPENSATION_LABELS: Record<CompensationType, string> = {
  DOOR_SPLIT: "Door Split",
  GUARANTEE: "Guarantee",
  GUARANTEE_PLUS_DOOR_SPLIT: "Guarantee + Door",
  OTHER: "Other",
};

// ── Inline SVG Icons ───────────────────────────────────────────────────

function CheckIcon({ className }: { className?: string }) {
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
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function CircleIcon({ className }: { className?: string }) {
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
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}

// ── Section Header ─────────────────────────────────────────────────────

function SectionHeader({
  title,
  count,
  viewAllHref,
}: {
  title: string;
  count: number;
  viewAllHref: string;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">{title}</h2>
        {count > 0 && (
          <Badge variant="secondary" className="rounded-full text-xs">
            {count}
          </Badge>
        )}
      </div>
      <Link
        href={viewAllHref}
        className="text-sm text-primary hover:underline underline-offset-2"
      >
        View all
      </Link>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────

export function ArtistDashboard({
  matches,
  upcomingShows,
  conversations,
  profileItems,
}: ArtistDashboardProps) {
  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);
  const completedCount = profileItems.filter((i) => i.complete).length;
  const allComplete = completedCount === profileItems.length;

  return (
    <div className="space-y-10">
      {/* ── New Opportunities ──────────────────────────────────────── */}
      <section>
        <SectionHeader
          title="New Opportunities"
          count={matches.length}
          viewAllHref="/matches"
        />
        {matches.length === 0 ? (
          <p className="text-muted-foreground">
            No new show opportunities yet. Check back soon!
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {matches.slice(0, 6).map((match) => (
              <MatchCard
                key={match.id}
                matchId={match.id}
                status={match.status}
                score={match.score}
                role="ARTIST"
                tab="suggested"
                genres={match.genres}
                profileImage={match.profileImage}
                venueName={match.venueName}
                showTitle={match.showTitle}
                showDate={match.showDate ? new Date(match.showDate) : undefined}
                venueCapacity={match.venueCapacity}
                compensationType={match.compensationType}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Upcoming Shows (Mutual matches) ────────────────────────── */}
      <section>
        <SectionHeader
          title="Upcoming Shows"
          count={upcomingShows.length}
          viewAllHref="/matches"
        />
        {upcomingShows.length === 0 ? (
          <p className="text-muted-foreground">
            No booked shows yet. Like some matches to get started!
          </p>
        ) : (
          <div className="space-y-2">
            {upcomingShows.slice(0, 5).map((show) => (
              <Link key={show.matchId} href="/messages">
                <Card className="transition-shadow hover:shadow-md cursor-pointer">
                  <CardContent className="flex items-center gap-3 py-3 px-4">
                    <Avatar>
                      {show.venueImage && (
                        <AvatarImage src={show.venueImage} alt="" />
                      )}
                      <AvatarFallback>
                        {getInitials(show.venueName)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-sm truncate">
                          {show.venueName}
                        </span>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {formatShowDate(show.showDate)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {show.showTitle || "Show"}
                        {show.compensationType &&
                          ` \u2014 ${COMPENSATION_LABELS[show.compensationType]}`}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── Unread Messages ──────────────────────────────────────── */}
      <section>
        <SectionHeader
          title="Unread Messages"
          count={totalUnread}
          viewAllHref="/messages"
        />
        {conversations.length === 0 ? (
          <p className="text-muted-foreground">You&apos;re all caught up!</p>
        ) : (
          <div className="space-y-2">
            {conversations.slice(0, 3).map((convo) => (
              <Link key={convo.id} href={`/messages/${convo.id}`}>
                <Card className="transition-shadow hover:shadow-md cursor-pointer">
                  <CardContent className="flex items-center gap-3 py-3 px-4">
                    <Avatar>
                      {convo.otherPartyImage && (
                        <AvatarImage src={convo.otherPartyImage} alt="" />
                      )}
                      <AvatarFallback>
                        {getInitials(convo.otherPartyName)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-sm truncate">
                          {convo.otherPartyName}
                        </span>
                        {convo.lastMessageAt && (
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatTimeAgo(convo.lastMessageAt)}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {convo.showTitle || "Match conversation"}
                      </p>

                      {convo.lastMessageBody && (
                        <p className="text-sm text-muted-foreground truncate mt-0.5">
                          {truncate(convo.lastMessageBody, 80)}
                        </p>
                      )}
                    </div>

                    {convo.unreadCount > 0 && (
                      <Badge
                        variant="default"
                        className="rounded-full text-xs px-2 py-0.5"
                      >
                        {convo.unreadCount}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── Profile Completion ────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Profile Completion</h2>
            <Badge variant="secondary" className="rounded-full text-xs">
              {completedCount}/{profileItems.length} complete
            </Badge>
          </div>
          <Link
            href="/profile"
            className="text-sm text-primary hover:underline underline-offset-2"
          >
            Edit profile
          </Link>
        </div>

        {allComplete ? (
          <p className="text-muted-foreground">Profile complete!</p>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Complete your profile to get better match results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-2">
                {profileItems.map((item) => (
                  <li key={item.label} className="flex items-center gap-2">
                    {item.complete ? (
                      <CheckIcon className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
                    ) : (
                      <CircleIcon className="h-5 w-5 text-muted-foreground shrink-0" />
                    )}
                    <span
                      className={
                        item.complete
                          ? "text-muted-foreground line-through"
                          : ""
                      }
                    >
                      {item.label}
                    </span>
                  </li>
                ))}
              </ul>

              <Button asChild size="sm" className="mt-2">
                <Link href="/profile">Complete Profile</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
