# CLAUDE.md

Project context for AI assistants working on the Backline codebase.

## What is Backline?

Artist-venue matchmaking platform. Venues create shows, the matching engine scores every artist against each show, and mutual matches can message each other to book gigs. Location is a critical factor — 25% of the match score.

## Commands

```bash
npm run dev          # Dev server (http://localhost:3000)
npm run build        # Production build (use to verify changes compile)
npm run test         # Vitest unit tests (45 tests across 4 files)
npm run test:e2e     # Playwright E2E (requires dev server running)
npm run lint         # ESLint
npx prisma studio    # Browse database
npx prisma migrate dev --name <name>  # Create migration after schema changes
npx prisma db seed   # Seed genres
```

## Architecture

- **Next.js 16 App Router** — server components by default, `"use client"` only when needed
- **Server Actions** in `src/actions/` — all mutations go through these, not API routes
- **API routes** are minimal: just the NextAuth handler and a cron endpoint for matching
- **Prisma** for all database access via `db` singleton from `src/lib/db/`
- **Zod 4** schemas in `src/lib/validations/` — validate all server action inputs
- **shadcn/ui** components in `src/components/ui/` — do not modify these directly, use `npx shadcn add <component>` to add new ones
- **Pusher** for real-time messaging — server singleton in `src/lib/pusher/server.ts`, client in `src/lib/pusher/client.ts`
- **Google Maps** loaded via `@googlemaps/js-api-loader` functional API (`setOptions` + `importLibrary`), not the deprecated `Loader` class

## Key Patterns

### Singletons

External service clients use lazy singletons (initialize once, reuse):

- `src/lib/db/index.ts` — Prisma client
- `src/lib/pusher/server.ts` — `getPusherServer()`
- `src/lib/pusher/client.ts` — `getPusherClient()`
- `src/lib/google-maps.ts` — `loadGoogleMaps()`

### Server Actions

All actions follow this pattern:

1. Parse input with Zod schema
2. Check auth with `auth()`
3. Verify ownership/permissions
4. Perform mutation
5. Call `revalidatePath()` for cache invalidation
6. Return `{ success: boolean, error?: string | object }`

### Forms

Forms use controlled state with `useState` (not React Hook Form in onboarding/profile forms). The `<PlacesAutocomplete>` component is a drop-in replacement for `<Input>` with `value`/`onValueChange` props.

### Matching

Scoring logic is in `src/lib/matching/score.ts` (pure functions, well-tested). Match generation is in `generate.ts`. Threshold is 10/100. Compensation scoring is a placeholder (returns 0.5).

## File Layout

```
src/actions/        → Server actions (auth, artist, venue, profile, show, match, message)
src/app/(auth)/     → Public pages (login, signup, onboarding)
src/app/(dashboard)/ → Protected pages (dashboard, profile, matches, messages, shows)
src/components/ui/  → shadcn/ui primitives
src/lib/matching/   → Scoring algorithm + match generation
src/lib/validations/ → Zod schemas
prisma/schema.prisma → Source of truth for database models
prisma/seed.ts      → 34 music genres
e2e/                → Playwright tests
```

## Database

PostgreSQL + Prisma. The schema uses enums for roles, statuses, and types. Key relationships:

- User 1:1 ArtistProfile or VenueProfile
- VenueProfile 1:N Show
- Show N:M Genre
- Match = ArtistProfile + Show (unique pair)
- Match 1:1 Conversation (created on MUTUAL)
- Conversation 1:N Message

## Testing

- **Unit tests** (`npm run test`): Matching algorithm scoring in `src/lib/matching/__tests__/`. Validation schemas in `src/lib/validations/__tests__/`. 45 tests total.
- **E2E tests** (`npm run test:e2e`): Auth flows and onboarding in `e2e/`. Requires dev server running.
- When modifying matching logic, always run `npm run test` to verify scoring behavior.
- When modifying forms or auth flows, run `npm run test:e2e` against a running dev server.

## Common Tasks

**Add a new shadcn component:** `npx shadcn add <name>`

**Add a new server action:** Create in `src/actions/`, add Zod schema in `src/lib/validations/`, follow existing action patterns.

**Modify the database schema:** Edit `prisma/schema.prisma`, then `npx prisma migrate dev --name <description>`.

**Add a new page:** Create in the appropriate route group — `(auth)` for public, `(dashboard)` for protected. Protected pages should check `auth()` and redirect if unauthenticated.
