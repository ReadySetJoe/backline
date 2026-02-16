# Backline

A matchmaking platform that connects artists and venues to book live shows. Backline uses a scoring algorithm to suggest artist-venue pairings based on genre, location, capacity, availability, and compensation — then lets mutual matches message each other directly.

## Tech Stack

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** NextAuth.js 5 (credentials provider, JWT sessions)
- **Real-time:** Pusher (live messaging)
- **UI:** Tailwind CSS 4 + shadcn/ui (Radix primitives)
- **Location:** Google Maps Places Autocomplete
- **Uploads:** UploadThing
- **Testing:** Vitest (unit) + Playwright (E2E)

## Getting Started

### Prerequisites

- Node.js 22+
- PostgreSQL running locally (or a remote connection string)

### Setup

```bash
# Install dependencies
npm install

# Copy env template and fill in values (see Environment Variables below)
cp .env.example .env

# Generate Prisma client and run migrations
npx prisma generate
npx prisma migrate dev

# Seed genres
npx prisma db seed

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

| Variable                          | Description                                        |
| --------------------------------- | -------------------------------------------------- |
| `DATABASE_URL`                    | PostgreSQL connection string                       |
| `NEXTAUTH_SECRET`                 | Session encryption key (`openssl rand -base64 32`) |
| `NEXTAUTH_URL`                    | App URL (e.g. `http://localhost:3000`)             |
| `PUSHER_APP_ID`                   | Pusher app ID (server-side)                        |
| `PUSHER_KEY`                      | Pusher key (server-side)                           |
| `PUSHER_SECRET`                   | Pusher secret (server-side)                        |
| `PUSHER_CLUSTER`                  | Pusher cluster (e.g. `us2`)                        |
| `NEXT_PUBLIC_PUSHER_KEY`          | Pusher key (client-side)                           |
| `NEXT_PUBLIC_PUSHER_CLUSTER`      | Pusher cluster (client-side)                       |
| `UPLOADTHING_SECRET`              | UploadThing API secret                             |
| `UPLOADTHING_APP_ID`              | UploadThing app ID                                 |
| `CRON_SECRET`                     | Bearer token for `/api/matching/run`               |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps API key (Places API enabled)           |

## Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint
npm run test         # Vitest (unit tests)
npm run test:watch   # Vitest in watch mode
npm run test:e2e     # Playwright (E2E, requires dev server running)
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Public routes: login, signup, onboarding
│   ├── (dashboard)/        # Protected routes: dashboard, profile, matches, messages, shows
│   └── api/                # API routes: auth handler, matching cron
├── actions/                # Server actions (auth, profiles, shows, matches, messages)
├── components/
│   ├── ui/                 # shadcn/ui primitives (button, card, input, etc.)
│   ├── layout/             # Header + sidebar
│   ├── auth/               # Login/signup forms
│   ├── onboarding/         # Artist/venue onboarding wizards
│   ├── profile/            # Artist/venue profile edit forms
│   ├── matches/            # Match discovery queue
│   ├── messages/           # Conversation list + chat
│   └── shows/              # Show cards + creation form
├── lib/
│   ├── auth/               # NextAuth config
│   ├── db/                 # Prisma client singleton
│   ├── matching/           # Scoring algorithm (score.ts, compute.ts, generate.ts)
│   ├── pusher/             # Pusher client/server singletons
│   ├── validations/        # Zod schemas
│   └── google-maps.ts      # Google Maps loader
├── hooks/                  # Custom React hooks
└── types/                  # NextAuth type augmentation
prisma/
├── schema.prisma           # Database schema
├── seed.ts                 # Genre seed data
└── migrations/             # Migration history
e2e/                        # Playwright E2E tests
```

## Matching Algorithm

When a venue creates a show, the matching engine scores every artist against it using five weighted factors:

| Factor            | Weight | How it works                                              |
| ----------------- | ------ | --------------------------------------------------------- |
| **Genre**         | 30%    | Jaccard similarity between artist genres and show genres  |
| **Location**      | 25%    | Exact city match (case-insensitive, pre-comma extraction) |
| **Capacity/Draw** | 20%    | Sweet spot: artist draw is 60-90% of venue capacity       |
| **Availability**  | 15%    | Artist preference vs. show day-of-week                    |
| **Compensation**  | 10%    | MVP: neutral 0.5 (artist preference not yet captured)     |

Matches scoring 10+ (out of 100) are created as `SUGGESTED`. The flow is:

```
SUGGESTED → LIKED_BY_ARTIST or LIKED_BY_VENUE → MUTUAL → conversation created
                                               → PASSED (can reconsider)
```

Matching can also be triggered via `POST /api/matching/run` with a `Bearer` token (for cron jobs).

## Database

PostgreSQL with Prisma. Key models:

- **User** — email/password auth, role (ARTIST or VENUE)
- **ArtistProfile** — name, location, genres, draw, availability, links
- **VenueProfile** — name, address, city, capacity, genres, gear, links
- **Genre** — normalized lookup table (34 genres, many-to-many)
- **Show** — venue's event with date, slots, genres, compensation
- **Match** — artist-show pair with score and status
- **Conversation / Message** — chat between mutual matches

Run `npx prisma studio` to browse the database locally.
