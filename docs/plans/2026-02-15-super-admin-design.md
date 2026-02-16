# Super Admin Dashboard — Design

## Overview

Add a SUPER_ADMIN role and admin dashboard for platform operators to view and manage all artists, venues, shows, and matches. Multiple users can be promoted to SUPER_ADMIN by toggling their role.

## Schema Change

Add `SUPER_ADMIN` to the `Role` enum in `prisma/schema.prisma`. Super admins don't have artist/venue profiles — the dashboard layout skips the onboarding redirect for them. One seeded admin user (`admin@backline.com` / `password123`).

## Routing

New route group `src/app/(admin)/admin/` with its own layout. The admin layout checks `session.user.role === "SUPER_ADMIN"` and redirects non-admins to `/dashboard`. Gets its own sidebar separate from the artist/venue sidebar.

## Pages

| Page             | Purpose                                                                                      |
| ---------------- | -------------------------------------------------------------------------------------------- |
| `/admin`         | Overview — counts for artists, venues, shows, matches. Quick stats.                          |
| `/admin/artists` | Table of all artist profiles — name, location, genres, draw, type. Action: delete user.      |
| `/admin/venues`  | Table of all venue profiles — name, city, capacity, genres, show count. Action: delete user. |
| `/admin/shows`   | Table of all shows — title, venue, date, status, slots, match count. Action: cancel show.    |
| `/admin/matches` | Table of all matches — artist, show, score, status. Action: reset match to SUGGESTED.        |

## Sidebar

Super admins get a dedicated admin sidebar (not the artist/venue one). Nav items: Overview, Artists, Venues, Shows, Matches.

## Server Actions

New `src/actions/admin.ts` with actions gated by SUPER_ADMIN role check:

- `deleteUser(userId)` — cascading delete of user + profile + related data
- `cancelShow(showId)` — sets show status to CANCELLED
- `resetMatch(matchId)` — resets match status to SUGGESTED

## Auth Changes

- Update `src/types/auth.ts` — no changes needed (already uses `Role` from Prisma)
- Update `src/app/(dashboard)/layout.tsx` — skip onboarding redirect for SUPER_ADMIN
- Update `src/app/(dashboard)/dashboard/page.tsx` — redirect SUPER_ADMIN to `/admin`
- Update `src/components/layout/sidebar.tsx` — no changes needed (SUPER_ADMIN uses admin layout)
