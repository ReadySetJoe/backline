# Venue Owner Dashboard Design

## Overview

Replace the minimal welcome page at `/dashboard` with a role-aware dashboard that surfaces actionable information. The venue variant displays four stacked sections: new matches, unread messages, shows needing artists, and profile completion.

Artist variant will follow the same layout pattern with different data — deferred to a future task.

## Architecture

Single async server component at `src/app/(dashboard)/dashboard/page.tsx`. Checks `session.user.role` and renders the venue or artist variant.

Data fetching uses `Promise.all` with four parallel Prisma queries. No new API routes or server actions needed — the dashboard is read-only except for match actions already built into `MatchCard`.

## Sections

### 1. New Matches (top 5 by score)

- **Query:** Matches where venue owns the show, status `SUGGESTED` or `LIKED_BY_ARTIST`, ordered by score descending, limit 5.
- **Display:** Reuse `MatchCard` component. Shows artist name, type, genres, score, and Like/Pass buttons. `LIKED_BY_ARTIST` matches show the existing "They're interested!" indicator.
- **Header:** "New Matches" + count badge + "View all" link to `/matches`.
- **Empty state:** "No new matches yet."

### 2. Unread Messages (top 3 by recency)

- **Query:** Conversations with `unreadCount > 0` for this venue's user, ordered by last message timestamp descending, limit 3.
- **Display:** Reuse `ConversationList` item layout — avatar, name, show title, message preview, time ago, unread badge. Each links to `/messages/[id]`.
- **Header:** "Unread Messages" + total unread count badge + "View all" link to `/messages`.
- **Empty state:** "You're all caught up!"

### 3. Shows Needing Artists (top 3 by date)

- **Query:** Venue's shows where status is `OPEN` and `slotsFilled < slotsTotal`, ordered by date ascending, limit 3.
- **Display:** Reuse `ShowCard` component — date, title, genres, slot progress, status badge. Links to `/shows/[id]`.
- **Header:** "Shows Needing Artists" + count badge + "View all" link to `/shows`.
- **Empty state:** "All shows are fully booked!" or "Create your first show" with link to `/shows/new` if no shows exist.

### 4. Profile Completion

- **Data:** Check venue profile for optional fields: bio, websiteUrl, instagramUrl, profileImage, stageSize, hasPa, hasBackline.
- **Display:** Checklist of items with check/uncheck indicators. "Complete Profile" button linking to `/profile`. If all fields filled, show "Profile complete!" message.
- **Header:** "Profile Completion" + fraction (e.g. "4/7 complete").

## New Components

- `src/components/dashboard/venue-dashboard.tsx` — receives fetched data as props, renders the four sections.

## Reused Components

- `MatchCard` from `src/components/matches/match-card.tsx`
- `ConversationList` item layout from `src/components/messages/conversation-list.tsx`
- `ShowCard` from `src/components/shows/show-card.tsx`
- `Card`, `Badge`, `Button` from `src/components/ui/`

## Data Flow

```
/dashboard (page.tsx)
  ├─ auth() → session
  ├─ Promise.all([
  │    db.match.findMany(...)       → matches
  │    db.conversation.findMany(...) → conversations
  │    db.show.findMany(...)         → shows
  │    db.venueProfile.findUnique(...) → profile
  │  ])
  └─ <VenueDashboard matches={} conversations={} shows={} profile={} />
```
