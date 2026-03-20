# Venue Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the minimal `/dashboard` welcome page with a venue-owner dashboard showing new matches, unread messages, shows needing artists, and profile completion.

**Architecture:** Single async server component page fetches four data sets in parallel via `Promise.all`, passes them to a `VenueDashboard` client component that renders four stacked sections reusing existing `MatchCard`, `ConversationList`, and `ShowCard` components.

**Tech Stack:** Next.js App Router, Prisma, React server/client components, shadcn/ui

**Design doc:** `docs/plans/2026-03-19-venue-dashboard-design.md`

---

### Task 1: Create VenueDashboard Component Shell

**Files:**

- Create: `src/components/dashboard/venue-dashboard.tsx`

**Step 1: Create the component with typed props and empty sections**

```tsx
"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MatchCard } from "@/components/matches/match-card";
import { ShowCard } from "@/components/shows/show-card";
import type { MatchData } from "@/components/matches/match-queue";
import type { ConversationSummary } from "@/components/messages/conversation-list";
import type { ShowStatus } from "@prisma/client";

interface ShowData {
  id: string;
  date: string;
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

export function VenueDashboard({
  matches,
  conversations,
  shows,
  profileItems,
}: VenueDashboardProps) {
  const completedCount = profileItems.filter((i) => i.complete).length;
  const totalCount = profileItems.length;
  const allComplete = completedCount === totalCount;

  return (
    <div className="space-y-8">
      {/* Section 1: New Matches */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">New Matches</h2>
            {matches.length > 0 && (
              <Badge variant="secondary">{matches.length}</Badge>
            )}
          </div>
          <Link
            href="/matches"
            className="text-sm text-primary hover:underline"
          >
            View all
          </Link>
        </div>
        {matches.length === 0 ? (
          <p className="text-muted-foreground">No new matches yet.</p>
        ) : (
          <div className="grid gap-4">
            {matches.map((match) => (
              <MatchCard
                key={match.id}
                matchId={match.id}
                status={match.status}
                score={match.score}
                role="VENUE"
                tab="suggested"
                genres={match.genres}
                artistName={match.artistName}
                artistType={match.artistType}
                drawEstimate={match.drawEstimate}
                sampleUrls={match.sampleUrls}
                showTitle={match.showTitle}
                showDate={match.showDate ? new Date(match.showDate) : undefined}
              />
            ))}
          </div>
        )}
      </section>

      {/* Section 2: Unread Messages */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">Unread Messages</h2>
            {conversations.length > 0 && (
              <Badge variant="secondary">
                {conversations.reduce((sum, c) => sum + c.unreadCount, 0)}
              </Badge>
            )}
          </div>
          <Link
            href="/messages"
            className="text-sm text-primary hover:underline"
          >
            View all
          </Link>
        </div>
        {conversations.length === 0 ? (
          <p className="text-muted-foreground">You&apos;re all caught up!</p>
        ) : (
          <div className="space-y-2">
            {conversations.map((convo) => (
              <Link key={convo.id} href={`/messages/${convo.id}`}>
                <Card className="transition-shadow hover:shadow-md cursor-pointer">
                  <CardContent className="flex items-center gap-3 py-3 px-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-medium">
                      {convo.otherPartyName
                        .split(" ")
                        .map((w) => w[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </div>
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
                          {convo.lastMessageBody.length > 80
                            ? convo.lastMessageBody.slice(0, 80).trimEnd() +
                              "..."
                            : convo.lastMessageBody}
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

      {/* Section 3: Shows Needing Artists */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">Shows Needing Artists</h2>
            {shows.length > 0 && (
              <Badge variant="secondary">{shows.length}</Badge>
            )}
          </div>
          <Link href="/shows" className="text-sm text-primary hover:underline">
            View all
          </Link>
        </div>
        {shows.length === 0 ? (
          <p className="text-muted-foreground">
            All shows are fully booked!{" "}
            <Link href="/shows/new" className="text-primary hover:underline">
              Create a new show
            </Link>
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shows.map((show) => (
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

      {/* Section 4: Profile Completion */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">Profile Completion</h2>
            <Badge variant={allComplete ? "default" : "secondary"}>
              {completedCount}/{totalCount}
            </Badge>
          </div>
          <Link
            href="/profile"
            className="text-sm text-primary hover:underline"
          >
            Edit profile
          </Link>
        </div>
        {allComplete ? (
          <p className="text-muted-foreground">Profile complete!</p>
        ) : (
          <Card>
            <CardContent className="py-4">
              <ul className="space-y-2">
                {profileItems.map((item) => (
                  <li
                    key={item.label}
                    className="flex items-center gap-2 text-sm"
                  >
                    {item.complete ? (
                      <CheckIcon className="h-4 w-4 text-green-600" />
                    ) : (
                      <CircleIcon className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span
                      className={item.complete ? "text-muted-foreground" : ""}
                    >
                      {item.label}
                    </span>
                  </li>
                ))}
              </ul>
              <Button asChild size="sm" className="mt-4">
                <Link href="/profile">Complete Profile</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
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
```

**Step 2: Verify the file compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`

**Step 3: Commit**

```bash
git add src/components/dashboard/venue-dashboard.tsx
git commit -m "feat: add VenueDashboard component shell"
```

---

### Task 2: Update Dashboard Page with Venue Data Fetching

**Files:**

- Modify: `src/app/(dashboard)/dashboard/page.tsx`

**Step 1: Replace the dashboard page with parallel data fetching and role branching**

Replace the entire file with:

```tsx
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { VenueDashboard } from "@/components/dashboard/venue-dashboard";
import type { MatchData } from "@/components/matches/match-queue";
import type { ConversationSummary } from "@/components/messages/conversation-list";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role === "VENUE") {
    return <VenueDashboardView userId={session.user.id} />;
  }

  // Artist placeholder — same welcome message for now
  return (
    <div>
      <h1 className="text-2xl font-bold">Welcome to Backline</h1>
      <p className="text-muted-foreground mt-2">
        Find shows looking for your sound.
      </p>
    </div>
  );
}

async function VenueDashboardView({ userId }: { userId: string }) {
  const venueProfile = await db.venueProfile.findUnique({
    where: { userId },
    select: {
      id: true,
      bio: true,
      profileImage: true,
      stageSize: true,
      hasPa: true,
      hasBackline: true,
      websiteUrl: true,
      instagramUrl: true,
    },
  });

  if (!venueProfile) {
    redirect("/onboarding");
  }

  const [dbMatches, conversations, dbShows] = await Promise.all([
    // 1. New matches: SUGGESTED or LIKED_BY_ARTIST, top 5 by score
    db.match.findMany({
      where: {
        show: { venueId: venueProfile.id },
        status: { in: ["SUGGESTED", "LIKED_BY_ARTIST"] },
      },
      include: {
        artist: {
          select: {
            name: true,
            artistType: true,
            drawEstimate: true,
            sampleUrls: true,
            genres: { select: { id: true, name: true } },
          },
        },
        show: {
          select: { title: true, date: true },
        },
      },
      orderBy: { score: "desc" },
      take: 5,
    }),

    // 2. All conversations (we filter to unread after counting)
    db.conversation.findMany({
      where: {
        match: {
          OR: [{ artist: { userId } }, { show: { venue: { userId } } }],
        },
      },
      include: {
        match: {
          include: {
            artist: { select: { name: true, userId: true } },
            show: {
              include: {
                venue: { select: { name: true, userId: true } },
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { body: true, createdAt: true },
        },
      },
    }),

    // 3. Shows needing artists: OPEN with unfilled slots, top 3 by date
    db.show.findMany({
      where: {
        venueId: venueProfile.id,
        status: "OPEN",
        slotsFilled: { lt: db.$queryRawUnsafe("slots_total") as never },
      },
      include: { genres: { select: { id: true, name: true } } },
      orderBy: { date: "asc" },
      take: 3,
    }),
  ]);

  // Note: Prisma can't do slotsFilled < slotsTotal in a where clause directly.
  // We fetch OPEN shows and filter in JS instead.
  // Re-fetch shows without the broken raw query:
  const openShows = await db.show.findMany({
    where: {
      venueId: venueProfile.id,
      status: "OPEN",
    },
    include: { genres: { select: { id: true, name: true } } },
    orderBy: { date: "asc" },
  });
  const needsArtistsShows = openShows
    .filter((s) => s.slotsFilled < s.slotsTotal)
    .slice(0, 3);

  // Transform matches
  const matches: MatchData[] = dbMatches.map((m) => ({
    id: m.id,
    status: m.status,
    score: m.score,
    genres: m.artist.genres,
    artistName: m.artist.name,
    artistType: m.artist.artistType,
    drawEstimate: m.artist.drawEstimate,
    sampleUrls: m.artist.sampleUrls,
    showTitle: m.show.title,
    showDate: m.show.date.toISOString(),
  }));

  // Transform conversations — filter to unread only, limit 3
  const conversationsWithUnread = await Promise.all(
    conversations.map(async (convo) => {
      const unreadCount = await db.message.count({
        where: {
          conversationId: convo.id,
          senderId: { not: userId },
          read: false,
        },
      });
      const isArtist = convo.match.artist.userId === userId;
      const otherPartyName = isArtist
        ? convo.match.show.venue.name
        : convo.match.artist.name;
      const lastMessage = convo.messages[0] ?? null;

      return {
        id: convo.id,
        otherPartyName,
        showTitle: convo.match.show.title,
        lastMessageBody: lastMessage?.body ?? null,
        lastMessageAt: lastMessage?.createdAt?.toISOString() ?? null,
        unreadCount,
      } satisfies ConversationSummary;
    }),
  );

  const unreadConversations = conversationsWithUnread
    .filter((c) => c.unreadCount > 0)
    .sort((a, b) => {
      const aDate = a.lastMessageAt ?? "";
      const bDate = b.lastMessageAt ?? "";
      return bDate.localeCompare(aDate);
    })
    .slice(0, 3);

  // Transform shows
  const shows = needsArtistsShows.map((s) => ({
    id: s.id,
    date: s.date.toISOString(),
    title: s.title,
    genres: s.genres,
    slotsTotal: s.slotsTotal,
    slotsFilled: s.slotsFilled,
    status: s.status,
  }));

  // Profile completion checklist
  const profileItems = [
    { label: "Add a bio", complete: !!venueProfile.bio },
    { label: "Upload a profile image", complete: !!venueProfile.profileImage },
    { label: "Add website URL", complete: !!venueProfile.websiteUrl },
    { label: "Add Instagram URL", complete: !!venueProfile.instagramUrl },
    { label: "Specify stage size", complete: !!venueProfile.stageSize },
    { label: "Indicate PA system availability", complete: venueProfile.hasPa },
    {
      label: "Indicate backline availability",
      complete: venueProfile.hasBackline,
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Find the right artists for your shows.
        </p>
      </div>
      <VenueDashboard
        matches={matches}
        conversations={unreadConversations}
        shows={shows}
        profileItems={profileItems}
      />
    </div>
  );
}
```

**Important note:** The initial `Promise.all` attempt includes a broken `slotsFilled < slotsTotal` Prisma query. Prisma doesn't support cross-column comparisons in `where`. The correct approach is to fetch all OPEN shows and filter in JS. The plan code above handles this — remove the `dbShows` from the `Promise.all` destructure and use the `openShows` query instead. Here is the corrected `Promise.all`:

```tsx
const [dbMatches, conversations, openShows] = await Promise.all([
  // matches query (same as above)...
  // conversations query (same as above)...
  // shows: fetch all OPEN, filter in JS
  db.show.findMany({
    where: {
      venueId: venueProfile.id,
      status: "OPEN",
    },
    include: { genres: { select: { id: true, name: true } } },
    orderBy: { date: "asc" },
  }),
]);

const needsArtistsShows = openShows
  .filter((s) => s.slotsFilled < s.slotsTotal)
  .slice(0, 3);
```

**Step 2: Verify the build compiles**

Run: `npm run build 2>&1 | tail -20`

**Step 3: Commit**

```bash
git add src/app/\(dashboard\)/dashboard/page.tsx
git commit -m "feat: wire up venue dashboard with parallel data fetching"
```

---

### Task 3: Verify and Fix Build

**Step 1: Run the build**

Run: `npm run build`

Fix any TypeScript or import errors that surface.

**Step 2: Run existing tests to check for regressions**

Run: `npm run test`

All 45 tests should pass (dashboard changes don't touch matching logic).

**Step 3: Commit any fixes**

```bash
git add -u
git commit -m "fix: resolve build errors in venue dashboard"
```

---

### Task 4: Manual Smoke Test

**Step 1: Start the dev server**

Run: `npm run dev`

**Step 2: Verify venue dashboard**

Navigate to `http://localhost:3000/dashboard` as a venue owner. Confirm:

- New Matches section shows SUGGESTED and LIKED_BY_ARTIST matches with "They're interested!" indicator
- Unread Messages section shows conversations with unread messages
- Shows Needing Artists section shows OPEN shows with unfilled slots
- Profile Completion checklist reflects actual profile state
- All "View all" links navigate correctly
- Empty states render when no data exists

**Step 3: Verify artist fallback**

Navigate to `/dashboard` as an artist. Confirm the welcome message still shows.

---
