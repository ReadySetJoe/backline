"use client";

import Link from "next/link";
import type { MatchData } from "@/components/matches/match-queue";
import type { ConversationSummary } from "@/components/messages/conversation-list";
import type { ShowStatus } from "@prisma/client";
import { MatchCard } from "@/components/matches/match-card";
import { ShowCard } from "@/components/shows/show-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// ── Types ──────────────────────────────────────────────────────────────

interface ShowData {
  id: string;
  date: string; // ISO string, convert to Date when passing to ShowCard
  title: string | null;
  genres: { id: string; name: string }[];
  slotsTotal: number;
  slotsFilled: number;
  status: ShowStatus;
}

interface ProfileCompletionItem {
  label: string;
  complete: boolean;
}

interface VenueDashboardProps {
  matches: MatchData[];
  conversations: ConversationSummary[];
  shows: ShowData[];
  profileItems: ProfileCompletionItem[];
}

// ── Helpers ────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(" ")
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

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "...";
}

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

export function VenueDashboard({
  matches,
  conversations,
  shows,
  profileItems,
}: VenueDashboardProps) {
  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);
  const completedCount = profileItems.filter((i) => i.complete).length;
  const allComplete = completedCount === profileItems.length;

  return (
    <div className="space-y-10">
      {/* ── New Matches ──────────────────────────────────────────── */}
      <section>
        <SectionHeader
          title="New Matches"
          count={matches.length}
          viewAllHref="/matches"
        />
        {matches.length === 0 ? (
          <p className="text-muted-foreground">No new matches yet.</p>
        ) : (
          <div className="grid gap-4">
            {matches.slice(0, 5).map((match) => (
              <MatchCard
                key={match.id}
                matchId={match.id}
                status={match.status}
                score={match.score}
                role="VENUE"
                tab="suggested"
                genres={match.genres}
                artistName={match.artistName}
                drawEstimate={match.drawEstimate}
                artistType={match.artistType}
                sampleUrls={match.sampleUrls}
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

      {/* ── Shows Needing Artists ─────────────────────────────────── */}
      <section>
        <SectionHeader
          title="Shows Needing Artists"
          count={shows.length}
          viewAllHref="/shows"
        />
        {shows.length === 0 ? (
          <div className="text-muted-foreground">
            <p>All shows are fully booked!</p>
            <Link
              href="/shows/new"
              className="text-sm text-primary hover:underline underline-offset-2 mt-1 inline-block"
            >
              Create a new show
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shows.slice(0, 3).map((show) => (
              <ShowCard
                key={show.id}
                id={show.id}
                date={new Date(show.date)}
                title={show.title}
                genres={show.genres}
                slotsTotal={show.slotsTotal}
                slotsFilled={show.slotsFilled}
                status={show.status}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Profile Completion ────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold">Profile Completion</h2>
          <Badge variant="secondary" className="rounded-full text-xs">
            {completedCount}/{profileItems.length} complete
          </Badge>
        </div>

        {allComplete ? (
          <p className="text-muted-foreground">Profile complete!</p>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Complete your profile to improve match quality
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
