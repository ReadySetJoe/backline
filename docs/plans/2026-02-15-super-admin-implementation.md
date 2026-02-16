# Super Admin Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a SUPER_ADMIN role with a dedicated admin dashboard to view and manage all artists, venues, shows, and matches.

**Architecture:** New `SUPER_ADMIN` value on the existing Prisma `Role` enum. A separate `(admin)` route group with its own layout and sidebar. Server actions in `src/actions/admin.ts` gated by role check. All admin pages are server components with data fetched directly via Prisma.

**Tech Stack:** Next.js App Router, Prisma, shadcn/ui (table component needed), existing auth system (NextAuth + JWT).

---

### Task 1: Add SUPER_ADMIN to Role enum + migrate

**Files:**

- Modify: `prisma/schema.prisma` (Role enum)

**Step 1: Update the Role enum**

In `prisma/schema.prisma`, change the `Role` enum:

```prisma
enum Role {
  ARTIST
  VENUE
  SUPER_ADMIN
}
```

**Step 2: Create the migration**

Run: `npx prisma migrate dev --name add-super-admin-role`
Expected: Migration created successfully.

**Step 3: Commit**

```bash
git add prisma/
git commit -m "feat: add SUPER_ADMIN to Role enum"
```

---

### Task 2: Update dashboard layout to handle SUPER_ADMIN

**Files:**

- Modify: `src/app/(dashboard)/layout.tsx`
- Modify: `src/app/(dashboard)/dashboard/page.tsx`

**Step 1: Skip onboarding redirect for SUPER_ADMIN**

In `src/app/(dashboard)/layout.tsx`, add an early return for SUPER_ADMIN before the profile checks. SUPER_ADMIN users don't have profiles, so they should skip onboarding. Also redirect them to `/admin`:

```tsx
if (session.user.role === "SUPER_ADMIN") {
  redirect("/admin");
}
```

Add this right after the `if (!session?.user)` check, before the profile existence checks.

**Step 2: Update dashboard page welcome message**

In `src/app/(dashboard)/dashboard/page.tsx`, no changes needed — SUPER_ADMIN redirects before reaching this page.

**Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add src/app/(dashboard)/layout.tsx
git commit -m "feat: redirect SUPER_ADMIN to /admin from dashboard"
```

---

### Task 3: Add shadcn table component

**Step 1: Install table component**

Run: `npx shadcn add table`
Expected: Table component files added to `src/components/ui/table.tsx`.

**Step 2: Commit**

```bash
git add src/components/ui/table.tsx
git commit -m "chore: add shadcn table component"
```

---

### Task 4: Create admin layout and sidebar

**Files:**

- Create: `src/app/(admin)/layout.tsx`
- Create: `src/components/layout/admin-sidebar.tsx`

**Step 1: Create admin sidebar component**

Create `src/components/layout/admin-sidebar.tsx` — a client component similar to the existing `sidebar.tsx` but with admin-specific nav items: Overview, Artists, Venues, Shows, Matches. Use the same visual structure (desktop sidebar + mobile bottom nav). All links prefixed with `/admin`.

Nav items:

- `/admin` — Overview (home icon)
- `/admin/artists` — Artists (user icon)
- `/admin/venues` — Venues (building icon)
- `/admin/shows` — Shows (calendar icon)
- `/admin/matches` — Matches (heart icon)

Include inline SVG icons like the existing sidebar does.

**Step 2: Create admin layout**

Create `src/app/(admin)/layout.tsx` — a server component that:

1. Calls `auth()` to get the session
2. Redirects to `/login` if no session
3. Redirects to `/dashboard` if `session.user.role !== "SUPER_ADMIN"`
4. Renders `<AdminSidebar />` + `<Header />` + `{children}` using the same structure as the dashboard layout (sidebar offset, header, main content area)

Import `Header` from `@/components/layout/header`. Pass `userEmail` and `profileName="Admin"`.

**Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add src/app/(admin)/layout.tsx src/components/layout/admin-sidebar.tsx
git commit -m "feat: add admin layout and sidebar"
```

---

### Task 5: Create admin overview page

**Files:**

- Create: `src/app/(admin)/admin/page.tsx`

**Step 1: Create the overview page**

Create `src/app/(admin)/admin/page.tsx` — a server component that queries aggregate counts:

- Total artists (`db.artistProfile.count()`)
- Total venues (`db.venueProfile.count()`)
- Total shows (`db.show.count()`) + open shows (`db.show.count({ where: { status: "OPEN" } })`)
- Total matches (`db.match.count()`) + mutual matches (`db.match.count({ where: { status: "MUTUAL" } })`)
- Total conversations (`db.conversation.count()`)
- Total messages (`db.message.count()`)

Display these in a grid of `<Card>` components (from shadcn) — 2-3 columns on desktop, 1 on mobile. Each card shows the label and count. Use `text-2xl font-bold` for counts, `text-sm text-muted-foreground` for labels.

**Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/app/(admin)/admin/page.tsx
git commit -m "feat: add admin overview page with stats"
```

---

### Task 6: Create admin server actions

**Files:**

- Create: `src/actions/admin.ts`

**Step 1: Create admin actions file**

Create `src/actions/admin.ts` with `"use server"` directive. Add a shared helper:

```typescript
async function requireSuperAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized");
  }
  return session;
}
```

Implement three actions following the existing action patterns (return `{ success, error? }`):

1. `deleteUser(userId: string)` — calls `requireSuperAdmin()`, then `db.user.delete({ where: { id: userId } })`. Prisma cascades handle related data. Calls `revalidatePath("/admin/artists")` and `revalidatePath("/admin/venues")`.

2. `cancelShow(showId: string)` — calls `requireSuperAdmin()`, then `db.show.update({ where: { id: showId }, data: { status: "CANCELLED" } })`. Calls `revalidatePath("/admin/shows")`.

3. `resetMatch(matchId: string)` — calls `requireSuperAdmin()`, then `db.match.update({ where: { id: matchId }, data: { status: "SUGGESTED" } })`. If the match has a conversation, delete it. Calls `revalidatePath("/admin/matches")`.

**Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/actions/admin.ts
git commit -m "feat: add admin server actions (delete user, cancel show, reset match)"
```

---

### Task 7: Create admin artists page

**Files:**

- Create: `src/app/(admin)/admin/artists/page.tsx`

**Step 1: Create the artists page**

Server component that queries all artist profiles with their user and genres:

```typescript
const artists = await db.artistProfile.findMany({
  include: { user: { select: { id: true, email: true } }, genres: true },
  orderBy: { createdAt: "desc" },
});
```

Render a `<Table>` (shadcn) with columns: Name, Email, Location, Type, Members, Draw, Genres, Actions. The Actions column has a delete button (client component) that calls `deleteUser` with a confirmation dialog.

Extract the delete button into a small client component `src/components/admin/delete-button.tsx` that:

- Takes `userId`, `label` (for confirmation text), and `action` (the server action) as props
- Shows a confirmation dialog (`<Dialog>` from shadcn) before executing
- Uses `useTransition` for pending state

**Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/app/(admin)/admin/artists/page.tsx src/components/admin/delete-button.tsx
git commit -m "feat: add admin artists page with delete action"
```

---

### Task 8: Create admin venues page

**Files:**

- Create: `src/app/(admin)/admin/venues/page.tsx`

**Step 1: Create the venues page**

Server component that queries all venue profiles:

```typescript
const venues = await db.venueProfile.findMany({
  include: {
    user: { select: { id: true, email: true } },
    genres: true,
    _count: { select: { shows: true } },
  },
  orderBy: { createdAt: "desc" },
});
```

Render a `<Table>` with columns: Name, Email, City, Capacity, Age Restriction, PA/Backline, Shows, Genres, Actions. Reuse the `<DeleteButton>` component from Task 7.

**Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/app/(admin)/admin/venues/page.tsx
git commit -m "feat: add admin venues page with delete action"
```

---

### Task 9: Create admin shows page

**Files:**

- Create: `src/app/(admin)/admin/shows/page.tsx`
- Create: `src/components/admin/cancel-show-button.tsx`

**Step 1: Create the cancel show button**

Client component similar to delete-button but calls `cancelShow`. Only shown when show status is `OPEN`. Shows confirmation dialog.

**Step 2: Create the shows page**

Server component that queries all shows:

```typescript
const shows = await db.show.findMany({
  include: {
    venue: { select: { name: true } },
    genres: true,
    _count: { select: { matches: true } },
  },
  orderBy: { date: "desc" },
});
```

Render a `<Table>` with columns: Title, Venue, Date, Status (with `<Badge>`), Slots (filled/total), Matches, Genres, Actions. Use a `<Badge>` with variant based on status (OPEN=default, FULL=secondary, CANCELLED=destructive).

**Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add src/app/(admin)/admin/shows/page.tsx src/components/admin/cancel-show-button.tsx
git commit -m "feat: add admin shows page with cancel action"
```

---

### Task 10: Create admin matches page

**Files:**

- Create: `src/app/(admin)/admin/matches/page.tsx`
- Create: `src/components/admin/reset-match-button.tsx`

**Step 1: Create the reset match button**

Client component that calls `resetMatch`. Only shown when match status is not `SUGGESTED`. Shows confirmation dialog.

**Step 2: Create the matches page**

Server component that queries all matches:

```typescript
const matches = await db.match.findMany({
  include: {
    artist: { select: { name: true } },
    show: { select: { title: true, venue: { select: { name: true } } } },
  },
  orderBy: { score: "desc" },
});
```

Render a `<Table>` with columns: Artist, Show, Venue, Score, Status (with `<Badge>`), Actions. Badge variants: SUGGESTED=secondary, LIKED_BY_ARTIST=default, LIKED_BY_VENUE=default, MUTUAL=success (use green custom class), PASSED=destructive.

**Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add src/app/(admin)/admin/matches/page.tsx src/components/admin/reset-match-button.tsx
git commit -m "feat: add admin matches page with reset action"
```

---

### Task 11: Seed admin user

**Files:**

- Modify: `prisma/seed.ts`

**Step 1: Add admin user to seed**

At the end of the `main()` function in `prisma/seed.ts`, after seeding venues, add:

```typescript
// 4. Seed super admin
const adminEmail = "admin@backline.com";
const existingAdmin = await prisma.user.findUnique({
  where: { email: adminEmail },
});
if (!existingAdmin) {
  await prisma.user.create({
    data: {
      email: adminEmail,
      passwordHash,
      role: "SUPER_ADMIN",
    },
  });
  console.log("Seeded super admin (admin@backline.com)");
} else {
  console.log("  Skipping admin (already exists)");
}
```

**Step 2: Run seed**

Run: `npx prisma db seed`
Expected: Outputs "Seeded super admin (admin@backline.com)".

**Step 3: Verify build + tests**

Run: `npm run build && npm run test`
Expected: Build succeeds, all 45 tests pass.

**Step 4: Commit**

```bash
git add prisma/seed.ts
git commit -m "feat: seed super admin user"
```

---

### Task 12: Final verification

**Step 1: Run full test suite**

Run: `npm run test`
Expected: All 45 tests pass.

**Step 2: Run build**

Run: `npm run build`
Expected: Clean build, no errors.

**Step 3: Run lint**

Run: `npm run lint`
Expected: No new errors (only pre-existing warnings).

**Step 4: Manual smoke test**

1. Start dev server: `npm run dev`
2. Log in as `admin@backline.com` / `password123`
3. Should redirect to `/admin` with overview stats
4. Click through Artists, Venues, Shows, Matches pages
5. Verify tables render with seed data
6. Test a delete/cancel/reset action
