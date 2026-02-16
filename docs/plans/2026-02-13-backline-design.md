# Backline — App Design

> A matchmaking platform connecting artists/bands with local venues and show organizers to book live shows.

## Overview

Backline is a two-sided platform where artists and venues (including DIY organizers, house shows, etc.) are equal first-class users. The app suggests pairings based on profile data, and mutual interest unlocks messaging. The long-term vision includes full booking flow (contracts, payments, calendar sync), but the MVP focuses on profiles, matching, and messaging.

- **Launch scope:** Single city/region
- **Monetization:** Deferred — focus on product-market fit first
- **Tech stack:** Next.js full-stack monolith + PostgreSQL
- **Future integrations:** Notion (build documentation), Jira (feature/epic tracking), Spotify (playlist export)

## Core Insight

The core unit is the **show**, not the venue. A "venue" can be a club, a basement, a backyard, or a VFW hall. The repeatable action is: "I want to put on a show on this date with these requirements — find me the right artists." The venue profile is supporting context (location, capacity, gear), not the primary matching surface.

## Data Model

### User

- email, password hash, role (`artist` | `venue`)
- Base account — one profile per role

### ArtistProfile

- name, bio, profile image, banner image
- genres (many-to-many, max 5 to prevent gaming)
- location (city/region)
- member count / type (solo, duo, full band)
- links (Spotify, Bandcamp, Instagram, website)
- audio/video samples (URLs)
- availability preferences (weekends only, any night, etc.)
- typical set length
- draw estimate (typical audience they bring)

### VenueProfile

- name, bio, profile image, banner image
- location (address, city/region)
- capacity
- genres typically booked (many-to-many)
- stage/sound specs (PA provided, backline gear available, stage size)
- age restriction (all ages, 18+, 21+)
- compensation models offered (door split, guarantee, tip jar, etc.)
- links (website, social)

### Show (elevated from VenueDate)

- venue_id, date
- title (optional — e.g., "Friday Night Punk Showcase")
- genre_tags (what fits this specific bill)
- note (e.g., "3-band bill, 30-min sets, all ages, BYOB")
- slots_total, slots_filled
- status: `open` | `full` | `cancelled`
- compensation details (per-show — may differ from venue defaults)

### Match

- artist_id, show_id (matches are per-show, not per-venue)
- score (0-100, computed by matching algorithm)
- status: `suggested` → `liked_by_artist` | `liked_by_venue` → `mutual` → `passed`
- `passed` is a filter state, not a deletion — fully reversible from a "Passed" tab

### Conversation

- Linked to a mutual match
- participants (artist user, venue user)

### Message

- conversation_id, sender_id, body, timestamp, read status

## Matching Algorithm

Weighted scoring (0-100) based on profile and show-level data:

| Factor                     | Weight | Logic                                                                                                      |
| -------------------------- | ------ | ---------------------------------------------------------------------------------------------------------- |
| Genre overlap              | 30%    | Jaccard similarity between artist genres and show genre tags (falls back to venue genres if show has none) |
| Location proximity         | 25%    | Distance between artist and venue. Mostly pass/fail for single-city MVP                                    |
| Capacity/draw fit          | 20%    | Artist draw vs. venue capacity. Sweet spot: 60-90% of capacity                                             |
| Availability overlap       | 15%    | Do artist's availability preferences intersect with show date?                                             |
| Compensation compatibility | 10%    | Does the show's pay model match artist expectations?                                                       |

### How it works

- Matching runs as a background job (cron or triggered on profile/show updates)
- Each artist sees a ranked list of shows looking for them
- Each venue sees a ranked list of artists for each of their open shows
- Like or Pass — Pass sends to a "Passed" tab, retrievable anytime
- Mutual like → notification → conversation opens
- Matching recomputes nightly or on profile/show update

### MVP simplifications

- Weights are hardcoded (not user-configurable)
- No ML — pure rule-based scoring
- Genre tags capped at 5 per artist to prevent gaming
- Single city simplifies location scoring

### Post-MVP enhancements

- Venue-adjustable algorithm weights (a dive bar cares about vibe, a concert hall cares about draw)
- Learn from successful bookings to refine weights
- "Boost" feature for visibility
- Spotify playlist export: venue exports a playlist of top tracks from all artists in their match queue

## Core User Flows

### Onboarding

1. Sign up (email/password)
2. Choose role: "I'm an artist" or "I'm a venue/organizer"
3. Guided step-by-step profile builder (not one giant form)
4. Artists: name, genres (max 5), location, draw estimate, links/samples, availability
5. Venues: name, address/location, capacity, genres booked, stage specs, compensation model
6. Profile goes live → matching begins

### Creating a Show (venue side)

1. From dashboard, "Create a Show"
2. Pick a date, set slots, add genre tags for this specific bill
3. Add a note describing what they're looking for
4. Set compensation for this show
5. Save → matching runs → suggested artists appear

### Matching / Discovery

1. **Artists** see: specific shows looking for their genre, ranked by match score
2. **Venues** see: ranked artists for each open show
3. Match card: name, photo, top genre tags, match score, key stats
4. Tap → full profile with details, audio/video samples
5. Like or Pass (Pass is reversible from "Passed" tab)
6. Mutual like → notification → conversation unlocks

### Messaging

1. Conversation list shows all mutual matches with active threads
2. Simple text messaging (no file attachments in MVP)
3. Unread indicators + email notifications
4. Messages tied to the match — context always visible

### Profile Management

1. Edit profile anytime
2. Venues manage shows (create, edit, mark full/cancelled)
3. Profile/show updates trigger match re-scoring

## Architecture & Tech Stack

- **Framework:** Next.js 14+ (App Router, server components, server actions)
- **Database:** PostgreSQL via Prisma ORM
- **Auth:** Auth.js (NextAuth v5) — email/password for MVP, OAuth later
- **Real-time messaging:** Pusher or Ably (managed WebSocket service)
- **File storage:** Uploadthing or S3-compatible
- **Styling:** Tailwind CSS + shadcn/ui
- **Deployment:** Vercel + Vercel Postgres (Neon) or standalone Neon/Supabase DB

### Project Structure

```
backline/
├── src/
│   ├── app/              # Next.js App Router pages & layouts
│   │   ├── (auth)/       # Login, signup, onboarding
│   │   ├── (dashboard)/  # Main app (matches, messages, profile)
│   │   └── api/          # API routes (webhooks, etc.)
│   ├── components/       # Shared UI components
│   ├── lib/
│   │   ├── db/           # Prisma client, queries
│   │   ├── matching/     # Scoring algorithm
│   │   └── auth/         # Auth config
│   ├── actions/          # Server actions (mutations)
│   └── types/            # Shared TypeScript types
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
└── public/
```

## Testing & Error Handling

### Testing strategy

- **Unit tests** (Vitest): matching algorithm, utilities, data transformations
- **Integration tests**: server actions, DB queries via Prisma against test DB
- **E2E tests** (Playwright): signup → profile → browse matches → like → mutual → message

### Error handling

- Server actions return typed `{ success, data, error }` responses
- Form validation: Zod schemas shared between client and server
- Optimistic UI for messaging
- Graceful fallbacks for slow matching (show cached results)

### MVP testing priority

1. Matching algorithm (core — must be correct)
2. Auth flows (can't break signup/login)
3. Messaging delivery (messages must arrive)
