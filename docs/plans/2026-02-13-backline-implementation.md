# Backline Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an MVP matchmaking platform where artists/bands and venues/show organizers create profiles, get matched per-show, and message each other upon mutual interest.

**Architecture:** Next.js 14+ App Router monolith with PostgreSQL via Prisma. Auth.js for authentication. Pusher for real-time messaging. Server actions for all mutations. Zod for shared validation.

**Tech Stack:** Next.js, TypeScript, Prisma, PostgreSQL, Auth.js v5, Pusher, Tailwind CSS, shadcn/ui, Vitest, Playwright

**Reference:** See `docs/plans/2026-02-13-backline-design.md` for full design context.

---

## Task 1: Project Scaffolding

**Files:**

- Create: `package.json` (via create-next-app)
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `.env.example`
- Create: `src/app/layout.tsx` (generated, will modify)
- Create: `src/app/page.tsx` (generated, will modify)

**Step 1: Scaffold Next.js project**

Run from `backline/` directory:

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

Select defaults when prompted. This will generate the project in the current directory.

**Step 2: Install core dependencies**

```bash
npm install prisma @prisma/client next-auth@beta @auth/prisma-adapter zod pusher pusher-js uploadthing @uploadthing/react
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom @playwright/test
```

**Step 3: Initialize shadcn/ui**

```bash
npx shadcn@latest init
```

Select: New York style, Zinc base color, CSS variables = yes.

Add initial components:

```bash
npx shadcn@latest add button input label card form select badge textarea dialog tabs separator avatar
```

**Step 4: Configure Vitest**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

Create `src/test/setup.ts`:

```typescript
import "@testing-library/jest-dom/vitest";
```

**Step 5: Configure Playwright**

Create `playwright.config.ts`:

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: "http://localhost:3000",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
```

**Step 6: Create .env.example**

```
DATABASE_URL="postgresql://user:password@localhost:5432/backline"
NEXTAUTH_SECRET="generate-a-secret-here"
NEXTAUTH_URL="http://localhost:3000"
PUSHER_APP_ID=""
PUSHER_KEY=""
PUSHER_SECRET=""
PUSHER_CLUSTER=""
NEXT_PUBLIC_PUSHER_KEY=""
NEXT_PUBLIC_PUSHER_CLUSTER=""
UPLOADTHING_SECRET=""
UPLOADTHING_APP_ID=""
```

**Step 7: Add scripts to package.json**

Add to `"scripts"`:

```json
"test": "vitest run",
"test:watch": "vitest",
"test:e2e": "playwright test"
```

**Step 8: Verify setup**

Run: `npm run dev`
Expected: App loads at http://localhost:3000

Run: `npm test`
Expected: No tests found (passes with 0 tests)

**Step 9: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js project with tooling

Adds Next.js 14+, Tailwind, shadcn/ui, Prisma, Auth.js,
Vitest, Playwright, and core dependencies."
```

---

## Task 2: Database Schema

**Files:**

- Create: `prisma/schema.prisma`
- Create: `src/lib/db/index.ts`

**Step 1: Initialize Prisma**

```bash
npx prisma init
```

**Step 2: Write the schema**

Replace `prisma/schema.prisma` with:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  ARTIST
  VENUE
}

enum ShowStatus {
  OPEN
  FULL
  CANCELLED
}

enum MatchStatus {
  SUGGESTED
  LIKED_BY_ARTIST
  LIKED_BY_VENUE
  MUTUAL
  PASSED
}

enum AgeRestriction {
  ALL_AGES
  EIGHTEEN_PLUS
  TWENTY_ONE_PLUS
}

enum ArtistType {
  SOLO
  DUO
  FULL_BAND
}

enum AvailabilityPreference {
  WEEKENDS
  WEEKNIGHTS
  ANY_NIGHT
  SPECIFIC_DATES
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String
  role          Role
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  artistProfile ArtistProfile?
  venueProfile  VenueProfile?
  messages      Message[]
  accounts      Account[]
  sessions      Session[]
}

// Auth.js required models
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model Genre {
  id   String @id @default(cuid())
  name String @unique
  slug String @unique

  artistProfiles ArtistProfile[]
  venueProfiles  VenueProfile[]
  shows          Show[]
}

model ArtistProfile {
  id                     String                 @id @default(cuid())
  userId                 String                 @unique
  name                   String
  bio                    String?
  profileImage           String?
  bannerImage            String?
  location               String
  artistType             ArtistType
  memberCount            Int                    @default(1)
  spotifyUrl             String?
  bandcampUrl            String?
  instagramUrl           String?
  websiteUrl             String?
  sampleUrls             String[]               @default([])
  availabilityPreference AvailabilityPreference @default(ANY_NIGHT)
  typicalSetLength       Int?                   // minutes
  drawEstimate           Int?                   // people
  createdAt              DateTime               @default(now())
  updatedAt              DateTime               @updatedAt

  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  genres  Genre[]
  matches Match[]
}

model VenueProfile {
  id             String         @id @default(cuid())
  userId         String         @unique
  name           String
  bio            String?
  profileImage   String?
  bannerImage    String?
  address        String
  city           String
  capacity       Int
  hasPa          Boolean        @default(false)
  hasBackline    Boolean        @default(false)
  stageSize      String?
  ageRestriction AgeRestriction @default(ALL_AGES)
  websiteUrl     String?
  instagramUrl   String?
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  user   User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  genres Genre[]
  shows  Show[]
}

model Show {
  id               String     @id @default(cuid())
  venueId          String
  date             DateTime
  title            String?
  note             String?
  slotsTotal       Int        @default(3)
  slotsFilled      Int        @default(0)
  status           ShowStatus @default(OPEN)
  compensationType String?    // "door_split", "guarantee", "tip_jar", etc.
  compensationNote String?    // freeform details
  createdAt        DateTime   @default(now())
  updatedAt        DateTime   @updatedAt

  venue   VenueProfile @relation(fields: [venueId], references: [id], onDelete: Cascade)
  genres  Genre[]
  matches Match[]
}

model Match {
  id        String      @id @default(cuid())
  artistId  String
  showId    String
  score     Float
  status    MatchStatus @default(SUGGESTED)
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt

  artist       ArtistProfile @relation(fields: [artistId], references: [id], onDelete: Cascade)
  show         Show          @relation(fields: [showId], references: [id], onDelete: Cascade)
  conversation Conversation?

  @@unique([artistId, showId])
}

model Conversation {
  id        String   @id @default(cuid())
  matchId   String   @unique
  createdAt DateTime @default(now())

  match    Match     @relation(fields: [matchId], references: [id], onDelete: Cascade)
  messages Message[]
}

model Message {
  id             String   @id @default(cuid())
  conversationId String
  senderId       String
  body           String
  read           Boolean  @default(false)
  createdAt      DateTime @default(now())

  conversation Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  sender       User         @relation(fields: [senderId], references: [id], onDelete: Cascade)
}
```

**Step 3: Create Prisma client singleton**

Create `src/lib/db/index.ts`:

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
```

**Step 4: Set up local database and run migration**

Ensure a local PostgreSQL instance is running, then set `DATABASE_URL` in `.env`.

```bash
npx prisma migrate dev --name init
```

Expected: Migration created and applied, Prisma Client generated.

**Step 5: Verify with Prisma Studio**

```bash
npx prisma studio
```

Expected: Opens browser showing all tables (empty).

**Step 6: Commit**

```bash
git add prisma/ src/lib/db/index.ts
git commit -m "feat: add Prisma schema with all core models

User, ArtistProfile, VenueProfile, Show, Match,
Conversation, Message, and Genre models with enums."
```

---

## Task 3: Auth Setup

**Files:**

- Create: `src/lib/auth/index.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`
- Create: `src/lib/auth/credentials.ts`
- Create: `src/types/auth.ts`

**Step 1: Write the auth type extensions**

Create `src/types/auth.ts`:

```typescript
import { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      role: Role;
    };
  }

  interface User {
    role: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
  }
}
```

**Step 2: Write the auth config**

Create `src/lib/auth/index.ts`:

```typescript
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user) return null;

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash,
        );

        if (!passwordMatch) return null;

        return { id: user.id, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
  },
});
```

Install bcryptjs:

```bash
npm install bcryptjs
npm install -D @types/bcryptjs
```

**Step 3: Create the route handler**

Create `src/app/api/auth/[...nextauth]/route.ts`:

```typescript
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
```

**Step 4: Commit**

```bash
git add src/lib/auth/ src/app/api/auth/ src/types/auth.ts
git commit -m "feat: configure Auth.js with credentials provider

JWT strategy, role in session, bcrypt password hashing."
```

---

## Task 4: Zod Schemas & Shared Types

**Files:**

- Create: `src/lib/validations/auth.ts`
- Create: `src/lib/validations/artist.ts`
- Create: `src/lib/validations/venue.ts`
- Create: `src/lib/validations/show.ts`
- Create: `src/lib/validations/message.ts`
- Test: `src/lib/validations/__tests__/auth.test.ts`
- Test: `src/lib/validations/__tests__/artist.test.ts`

**Step 1: Write failing tests for auth schemas**

Create `src/lib/validations/__tests__/auth.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { signUpSchema, loginSchema } from "../auth";

describe("signUpSchema", () => {
  it("accepts valid signup data", () => {
    const result = signUpSchema.safeParse({
      email: "band@example.com",
      password: "securepass123",
      role: "ARTIST",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = signUpSchema.safeParse({
      email: "not-an-email",
      password: "securepass123",
      role: "ARTIST",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short password", () => {
    const result = signUpSchema.safeParse({
      email: "band@example.com",
      password: "short",
      role: "ARTIST",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid role", () => {
    const result = signUpSchema.safeParse({
      email: "band@example.com",
      password: "securepass123",
      role: "ADMIN",
    });
    expect(result.success).toBe(false);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/validations/__tests__/auth.test.ts`
Expected: FAIL — module not found

**Step 3: Implement auth schemas**

Create `src/lib/validations/auth.ts`:

```typescript
import { z } from "zod";

export const signUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["ARTIST", "VENUE"]),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/validations/__tests__/auth.test.ts`
Expected: PASS

**Step 5: Write artist validation tests**

Create `src/lib/validations/__tests__/artist.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { artistProfileSchema } from "../artist";

describe("artistProfileSchema", () => {
  it("accepts valid artist profile", () => {
    const result = artistProfileSchema.safeParse({
      name: "The Rattlesnakes",
      location: "Columbus, OH",
      artistType: "FULL_BAND",
      memberCount: 4,
      genreIds: ["1", "2"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects more than 5 genres", () => {
    const result = artistProfileSchema.safeParse({
      name: "The Rattlesnakes",
      location: "Columbus, OH",
      artistType: "FULL_BAND",
      memberCount: 4,
      genreIds: ["1", "2", "3", "4", "5", "6"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty name", () => {
    const result = artistProfileSchema.safeParse({
      name: "",
      location: "Columbus, OH",
      artistType: "SOLO",
      memberCount: 1,
      genreIds: ["1"],
    });
    expect(result.success).toBe(false);
  });
});
```

**Step 6: Run test to verify it fails**

Run: `npx vitest run src/lib/validations/__tests__/artist.test.ts`
Expected: FAIL

**Step 7: Implement all validation schemas**

Create `src/lib/validations/artist.ts`:

```typescript
import { z } from "zod";

export const artistProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  bio: z.string().max(1000).optional(),
  location: z.string().min(1, "Location is required"),
  artistType: z.enum(["SOLO", "DUO", "FULL_BAND"]),
  memberCount: z.number().int().min(1).max(50),
  genreIds: z
    .array(z.string())
    .min(1, "Select at least 1 genre")
    .max(5, "Maximum 5 genres allowed"),
  spotifyUrl: z.string().url().optional().or(z.literal("")),
  bandcampUrl: z.string().url().optional().or(z.literal("")),
  instagramUrl: z.string().url().optional().or(z.literal("")),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  sampleUrls: z.array(z.string().url()).max(5).optional(),
  availabilityPreference: z
    .enum(["WEEKENDS", "WEEKNIGHTS", "ANY_NIGHT", "SPECIFIC_DATES"])
    .default("ANY_NIGHT"),
  typicalSetLength: z.number().int().min(5).max(240).optional(),
  drawEstimate: z.number().int().min(0).max(100000).optional(),
});

export type ArtistProfileInput = z.infer<typeof artistProfileSchema>;
```

Create `src/lib/validations/venue.ts`:

```typescript
import { z } from "zod";

export const venueProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  bio: z.string().max(1000).optional(),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  capacity: z.number().int().min(1, "Capacity must be at least 1"),
  genreIds: z.array(z.string()).min(1, "Select at least 1 genre"),
  hasPa: z.boolean().default(false),
  hasBackline: z.boolean().default(false),
  stageSize: z.string().optional(),
  ageRestriction: z
    .enum(["ALL_AGES", "EIGHTEEN_PLUS", "TWENTY_ONE_PLUS"])
    .default("ALL_AGES"),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  instagramUrl: z.string().url().optional().or(z.literal("")),
});

export type VenueProfileInput = z.infer<typeof venueProfileSchema>;
```

Create `src/lib/validations/show.ts`:

```typescript
import { z } from "zod";

export const showSchema = z.object({
  date: z.coerce
    .date()
    .refine((d) => d > new Date(), "Date must be in the future"),
  title: z.string().max(100).optional(),
  note: z.string().max(500).optional(),
  slotsTotal: z.number().int().min(1).max(20).default(3),
  genreIds: z.array(z.string()).min(1, "Select at least 1 genre for this show"),
  compensationType: z.string().optional(),
  compensationNote: z.string().max(500).optional(),
});

export type ShowInput = z.infer<typeof showSchema>;
```

Create `src/lib/validations/message.ts`:

```typescript
import { z } from "zod";

export const messageSchema = z.object({
  conversationId: z.string().min(1),
  body: z.string().min(1, "Message cannot be empty").max(5000),
});

export type MessageInput = z.infer<typeof messageSchema>;
```

**Step 8: Run all validation tests**

Run: `npx vitest run src/lib/validations/`
Expected: All PASS

**Step 9: Commit**

```bash
git add src/lib/validations/ src/test/
git commit -m "feat: add Zod validation schemas with tests

Auth, artist profile, venue profile, show, and message
schemas with shared types. Genre cap at 5 per artist."
```

---

## Task 5: Auth UI (Signup + Login)

**Files:**

- Create: `src/actions/auth.ts`
- Create: `src/app/(auth)/signup/page.tsx`
- Create: `src/app/(auth)/login/page.tsx`
- Create: `src/app/(auth)/layout.tsx`
- Create: `src/components/auth/signup-form.tsx`
- Create: `src/components/auth/login-form.tsx`

**Step 1: Write the signup server action**

Create `src/actions/auth.ts`:

```typescript
"use server";

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { signUpSchema, type SignUpInput } from "@/lib/validations/auth";
import { signIn } from "@/lib/auth";

export async function signUp(input: SignUpInput) {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }

  const existing = await db.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (existing) {
    return { success: false, error: { email: ["Email already in use"] } };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  await db.user.create({
    data: {
      email: parsed.data.email,
      passwordHash,
      role: parsed.data.role as "ARTIST" | "VENUE",
    },
  });

  await signIn("credentials", {
    email: parsed.data.email,
    password: parsed.data.password,
    redirectTo: "/onboarding",
  });

  return { success: true };
}
```

**Step 2: Build the signup form component**

Create `src/components/auth/signup-form.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { signUp } from "@/actions/auth";

export function SignUpForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<"ARTIST" | "VENUE" | null>(null);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    if (!role) {
      setError("Please select a role");
      return;
    }
    setLoading(true);
    setError(null);

    const result = await signUp({
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      role,
    });

    if (!result.success) {
      setError(
        typeof result.error === "string"
          ? result.error
          : Object.values(result.error).flat().join(", "),
      );
      setLoading(false);
    }
    // On success, signIn redirects to /onboarding
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Join Backline</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={role === "ARTIST" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setRole("ARTIST")}
            >
              I&apos;m an Artist
            </Button>
            <Button
              type="button"
              variant={role === "VENUE" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setRole("VENUE")}
            >
              I&apos;m a Venue
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading || !role}>
            {loading ? "Creating account..." : "Sign Up"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

**Step 3: Build the login form component**

Create `src/components/auth/login-form.tsx`:

```tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      window.location.href = "/dashboard";
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Log in to Backline</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Logging in..." : "Log In"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

**Step 4: Create the auth pages**

Create `src/app/(auth)/layout.tsx`:

```tsx
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      {children}
    </div>
  );
}
```

Create `src/app/(auth)/signup/page.tsx`:

```tsx
import { SignUpForm } from "@/components/auth/signup-form";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <div className="space-y-4">
      <SignUpForm />
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
```

Create `src/app/(auth)/login/page.tsx`:

```tsx
import { LoginForm } from "@/components/auth/login-form";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="space-y-4">
      <LoginForm />
      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
```

**Step 5: Verify pages render**

Run: `npm run dev`
Navigate to `http://localhost:3000/signup` and `http://localhost:3000/login`.
Expected: Both forms render correctly.

**Step 6: Commit**

```bash
git add src/actions/auth.ts src/app/\(auth\)/ src/components/auth/
git commit -m "feat: add signup and login pages with auth actions

Email/password signup with role selection, login form,
server action with validation and bcrypt hashing."
```

---

## Task 6: Onboarding Flow (Profile Creation)

**Files:**

- Create: `src/app/(auth)/onboarding/page.tsx`
- Create: `src/components/onboarding/artist-onboarding.tsx`
- Create: `src/components/onboarding/venue-onboarding.tsx`
- Create: `src/actions/artist.ts`
- Create: `src/actions/venue.ts`

**Step 1: Write server action for creating artist profile**

Create `src/actions/artist.ts`:

```typescript
"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  artistProfileSchema,
  type ArtistProfileInput,
} from "@/lib/validations/artist";
import { redirect } from "next/navigation";

export async function createArtistProfile(input: ArtistProfileInput) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Not authenticated" };

  const parsed = artistProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }

  const { genreIds, ...data } = parsed.data;

  await db.artistProfile.create({
    data: {
      ...data,
      userId: session.user.id,
      genres: { connect: genreIds.map((id) => ({ id })) },
    },
  });

  redirect("/dashboard");
}
```

**Step 2: Write server action for creating venue profile**

Create `src/actions/venue.ts`:

```typescript
"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  venueProfileSchema,
  type VenueProfileInput,
} from "@/lib/validations/venue";
import { redirect } from "next/navigation";

export async function createVenueProfile(input: VenueProfileInput) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Not authenticated" };

  const parsed = venueProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }

  const { genreIds, ...data } = parsed.data;

  await db.venueProfile.create({
    data: {
      ...data,
      userId: session.user.id,
      genres: { connect: genreIds.map((id) => ({ id })) },
    },
  });

  redirect("/dashboard");
}
```

**Step 3: Build artist onboarding multi-step form**

Create `src/components/onboarding/artist-onboarding.tsx` — a multi-step form with steps:

1. Name, artist type, member count
2. Genre selection (checkboxes, max 5)
3. Location, draw estimate, set length, availability
4. Links (Spotify, Bandcamp, Instagram, website)

Use `useState` to track the current step. Each step validates its own fields before advancing. On final step, call `createArtistProfile` server action.

Genres should be fetched from the database and passed as props. Use shadcn `Button`, `Input`, `Label`, `Select`, `Badge` components.

**Step 4: Build venue onboarding multi-step form**

Create `src/components/onboarding/venue-onboarding.tsx` — multi-step form:

1. Name, address, city
2. Capacity, stage specs (PA, backline, stage size), age restriction
3. Genre selection (checkboxes)
4. Links

Same pattern as artist onboarding.

**Step 5: Create onboarding page that routes by role**

Create `src/app/(auth)/onboarding/page.tsx`:

```tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ArtistOnboarding } from "@/components/onboarding/artist-onboarding";
import { VenueOnboarding } from "@/components/onboarding/venue-onboarding";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // If already onboarded, go to dashboard
  const hasProfile =
    session.user.role === "ARTIST"
      ? await db.artistProfile.findUnique({
          where: { userId: session.user.id },
        })
      : await db.venueProfile.findUnique({
          where: { userId: session.user.id },
        });

  if (hasProfile) redirect("/dashboard");

  const genres = await db.genre.findMany({ orderBy: { name: "asc" } });

  return session.user.role === "ARTIST" ? (
    <ArtistOnboarding genres={genres} />
  ) : (
    <VenueOnboarding genres={genres} />
  );
}
```

**Step 6: Seed genres**

Create `prisma/seed.ts`:

```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const genres = [
  "Rock",
  "Punk",
  "Hardcore",
  "Metal",
  "Indie Rock",
  "Indie Pop",
  "Emo",
  "Post-Punk",
  "Shoegaze",
  "Noise",
  "Garage Rock",
  "Psychedelic",
  "Folk",
  "Country",
  "Americana",
  "Bluegrass",
  "Singer-Songwriter",
  "Jazz",
  "Blues",
  "Soul",
  "R&B",
  "Funk",
  "Hip Hop",
  "Rap",
  "Electronic",
  "DJ",
  "Ambient",
  "Experimental",
  "Pop",
  "Pop Punk",
  "Ska",
  "Reggae",
  "Latin",
  "World",
];

async function main() {
  for (const name of genres) {
    await prisma.genre.upsert({
      where: { slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-") },
      update: {},
      create: {
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      },
    });
  }
  console.log(`Seeded ${genres.length} genres`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
```

Add to `package.json`:

```json
"prisma": {
  "seed": "npx tsx prisma/seed.ts"
}
```

Run: `npm install -D tsx && npx prisma db seed`
Expected: "Seeded 34 genres"

**Step 7: Verify onboarding works end-to-end**

Run: `npm run dev`

1. Sign up as artist → lands on onboarding
2. Complete all steps → redirects to /dashboard (404 is fine for now)

**Step 8: Commit**

```bash
git add src/actions/ src/components/onboarding/ src/app/\(auth\)/onboarding/ prisma/seed.ts package.json
git commit -m "feat: add onboarding flow for artists and venues

Multi-step guided forms, genre selection (max 5 for artists),
server actions with validation. Seed 34 music genres."
```

---

## Task 7: Dashboard Layout & Profile Management

**Files:**

- Create: `src/app/(dashboard)/layout.tsx`
- Create: `src/app/(dashboard)/dashboard/page.tsx`
- Create: `src/app/(dashboard)/profile/page.tsx`
- Create: `src/components/layout/sidebar.tsx`
- Create: `src/components/layout/header.tsx`
- Create: `src/components/profile/artist-profile-form.tsx`
- Create: `src/components/profile/venue-profile-form.tsx`
- Create: `src/actions/profile.ts`

**Step 1: Build the dashboard layout**

Create `src/app/(dashboard)/layout.tsx` with:

- A sidebar navigation: Dashboard, Matches, Messages, Shows (venue only), Profile
- A header with user info and logout button
- Responsive — sidebar collapses on mobile

Use `auth()` to get session and redirect to `/login` if not authenticated.
Check for profile existence and redirect to `/onboarding` if not onboarded.

**Step 2: Create the dashboard page (placeholder)**

Create `src/app/(dashboard)/dashboard/page.tsx`:

```tsx
import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div>
      <h1 className="text-2xl font-bold">Welcome to Backline</h1>
      <p className="text-muted-foreground">
        {session?.user.role === "ARTIST"
          ? "Find shows looking for your sound."
          : "Find the right artists for your shows."}
      </p>
    </div>
  );
}
```

**Step 3: Create profile edit page**

Create `src/app/(dashboard)/profile/page.tsx` that:

- Loads current profile from DB
- Renders artist or venue edit form (reuse onboarding form components with pre-filled data)
- Server action `updateArtistProfile` / `updateVenueProfile` in `src/actions/profile.ts`

**Step 4: Verify navigation works**

Run: `npm run dev`

1. Log in → dashboard loads
2. Navigate to profile → edit form pre-filled
3. Edit and save → changes persist

**Step 5: Commit**

```bash
git add src/app/\(dashboard\)/ src/components/layout/ src/components/profile/ src/actions/profile.ts
git commit -m "feat: add dashboard layout, navigation, and profile editing

Sidebar nav, responsive layout, profile edit forms for
both artists and venues with server actions."
```

---

## Task 8: Show Management (Venue Side)

**Files:**

- Create: `src/app/(dashboard)/shows/page.tsx`
- Create: `src/app/(dashboard)/shows/new/page.tsx`
- Create: `src/app/(dashboard)/shows/[id]/page.tsx`
- Create: `src/components/shows/show-form.tsx`
- Create: `src/components/shows/show-card.tsx`
- Create: `src/actions/show.ts`
- Test: `src/actions/__tests__/show.test.ts`

**Step 1: Write the show server actions**

Create `src/actions/show.ts`:

```typescript
"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { showSchema, type ShowInput } from "@/lib/validations/show";
import { revalidatePath } from "next/cache";

export async function createShow(input: ShowInput) {
  const session = await auth();
  if (!session?.user || session.user.role !== "VENUE") {
    return { success: false, error: "Not authorized" };
  }

  const parsed = showSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }

  const venueProfile = await db.venueProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!venueProfile) {
    return { success: false, error: "Venue profile not found" };
  }

  const { genreIds, ...data } = parsed.data;

  const show = await db.show.create({
    data: {
      ...data,
      venueId: venueProfile.id,
      genres: { connect: genreIds.map((id) => ({ id })) },
    },
  });

  revalidatePath("/shows");
  return { success: true, data: show };
}

export async function updateShowStatus(
  showId: string,
  status: "OPEN" | "FULL" | "CANCELLED",
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "VENUE") {
    return { success: false, error: "Not authorized" };
  }

  const show = await db.show.findUnique({
    where: { id: showId },
    include: { venue: true },
  });

  if (!show || show.venue.userId !== session.user.id) {
    return { success: false, error: "Not authorized" };
  }

  await db.show.update({
    where: { id: showId },
    data: { status },
  });

  revalidatePath("/shows");
  return { success: true };
}
```

**Step 2: Build the show creation form**

Create `src/components/shows/show-form.tsx`:

- Date picker, title (optional), genre tag selection, slots count, compensation type + note
- Validates with `showSchema` on submit
- Calls `createShow` server action

**Step 3: Build the shows list page**

Create `src/app/(dashboard)/shows/page.tsx`:

- Fetch all shows for current venue, ordered by date
- Display as cards with date, title, genre tags, slots remaining, status
- "Create a Show" button links to `/shows/new`
- Each card links to `/shows/[id]` for details

**Step 4: Build show detail page**

Create `src/app/(dashboard)/shows/[id]/page.tsx`:

- Show full details
- Status management (mark as full, cancel)
- Later: will show matched artists here

**Step 5: Verify show CRUD**

Run: `npm run dev`

1. Log in as venue → navigate to Shows
2. Create a show → appears in list
3. View show detail → status controls work

**Step 6: Commit**

```bash
git add src/app/\(dashboard\)/shows/ src/components/shows/ src/actions/show.ts
git commit -m "feat: add show creation and management for venues

Create shows with date, genres, slots, compensation.
List view, detail view, status management (open/full/cancelled)."
```

---

## Task 9: Matching Algorithm (Core)

**Files:**

- Create: `src/lib/matching/score.ts`
- Create: `src/lib/matching/compute.ts`
- Test: `src/lib/matching/__tests__/score.test.ts`
- Test: `src/lib/matching/__tests__/compute.test.ts`

This is the most important task — TDD thoroughly.

**Step 1: Write failing tests for individual scoring functions**

Create `src/lib/matching/__tests__/score.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import {
  genreScore,
  locationScore,
  capacityDrawScore,
  availabilityScore,
  compensationScore,
  totalScore,
} from "../score";

describe("genreScore", () => {
  it("returns 1.0 for identical genre sets", () => {
    expect(genreScore(["punk", "rock"], ["punk", "rock"])).toBe(1.0);
  });

  it("returns 0.0 for no overlap", () => {
    expect(genreScore(["punk", "rock"], ["jazz", "blues"])).toBe(0.0);
  });

  it("returns 0.5 for 50% Jaccard overlap", () => {
    // intersection = 1 (punk), union = 3 (punk, rock, hardcore) → 1/3 ≈ 0.333
    expect(genreScore(["punk", "rock"], ["punk", "hardcore"])).toBeCloseTo(
      0.333,
      2,
    );
  });

  it("returns 0.0 for empty sets", () => {
    expect(genreScore([], [])).toBe(0.0);
  });
});

describe("capacityDrawScore", () => {
  it("returns 1.0 when draw is 75% of capacity (sweet spot)", () => {
    expect(capacityDrawScore(75, 100)).toBe(1.0);
  });

  it("returns high score when draw is 60-90% of capacity", () => {
    const score = capacityDrawScore(80, 100);
    expect(score).toBeGreaterThan(0.8);
  });

  it("returns low score when draw is way under capacity", () => {
    const score = capacityDrawScore(10, 500);
    expect(score).toBeLessThan(0.3);
  });

  it("returns lower score when draw exceeds capacity", () => {
    const score = capacityDrawScore(200, 100);
    expect(score).toBeLessThan(0.5);
  });

  it("returns 0 if draw or capacity is missing", () => {
    expect(capacityDrawScore(null, 100)).toBe(0);
    expect(capacityDrawScore(50, null)).toBe(0);
  });
});

describe("totalScore", () => {
  it("computes weighted total out of 100", () => {
    const score = totalScore({
      genre: 1.0,
      location: 1.0,
      capacityDraw: 1.0,
      availability: 1.0,
      compensation: 1.0,
    });
    expect(score).toBe(100);
  });

  it("computes partial score correctly", () => {
    const score = totalScore({
      genre: 1.0, // 30
      location: 0.0, // 0
      capacityDraw: 0.5, // 10
      availability: 1.0, // 15
      compensation: 0.0, // 0
    });
    expect(score).toBe(55);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/matching/__tests__/score.test.ts`
Expected: FAIL — module not found

**Step 3: Implement scoring functions**

Create `src/lib/matching/score.ts`:

```typescript
const WEIGHTS = {
  genre: 0.3,
  location: 0.25,
  capacityDraw: 0.2,
  availability: 0.15,
  compensation: 0.1,
} as const;

/**
 * Jaccard similarity between two genre slug arrays.
 * Returns 0.0 - 1.0
 */
export function genreScore(
  artistGenres: string[],
  showGenres: string[],
): number {
  if (artistGenres.length === 0 || showGenres.length === 0) return 0;

  const setA = new Set(artistGenres);
  const setB = new Set(showGenres);
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);

  return intersection.size / union.size;
}

/**
 * Location proximity score.
 * MVP: same city = 1.0, different = 0.0
 * Future: use actual distance calculation.
 */
export function locationScore(artistCity: string, venueCity: string): number {
  return artistCity.toLowerCase().trim() === venueCity.toLowerCase().trim()
    ? 1.0
    : 0.0;
}

/**
 * How well the artist's draw fits the venue's capacity.
 * Sweet spot: 60-90% of capacity → 1.0
 * Falls off outside that range.
 */
export function capacityDrawScore(
  draw: number | null | undefined,
  capacity: number | null | undefined,
): number {
  if (!draw || !capacity) return 0;

  const ratio = draw / capacity;
  const ideal = 0.75;
  const distance = Math.abs(ratio - ideal);

  if (ratio >= 0.6 && ratio <= 0.9) return 1.0;
  if (ratio > 1.0) return Math.max(0, 1.0 - (ratio - 1.0) * 2);

  return Math.max(0, 1.0 - distance * 2);
}

/**
 * Availability match.
 * Returns 1.0 if artist is available for the show's day of week, 0.0 otherwise.
 */
export function availabilityScore(preference: string, showDate: Date): number {
  if (preference === "ANY_NIGHT") return 1.0;

  const day = showDate.getDay(); // 0=Sun, 6=Sat
  const isWeekend = day === 0 || day === 5 || day === 6;

  if (preference === "WEEKENDS") return isWeekend ? 1.0 : 0.0;
  if (preference === "WEEKNIGHTS") return isWeekend ? 0.0 : 1.0;

  // SPECIFIC_DATES — can't evaluate without more data, return neutral
  return 0.5;
}

/**
 * Compensation compatibility.
 * MVP: simple string match. Returns 1.0 for match, 0.5 for unset, 0.0 for mismatch.
 * Future: more nuanced matching.
 */
export function compensationScore(
  showCompensationType: string | null,
  _artistPreference?: string | null,
): number {
  // MVP: artist doesn't have a comp preference field yet, return neutral
  if (!showCompensationType) return 0.5;
  return 0.5;
}

/**
 * Compute total weighted score out of 100.
 */
export function totalScore(scores: {
  genre: number;
  location: number;
  capacityDraw: number;
  availability: number;
  compensation: number;
}): number {
  return Math.round(
    (scores.genre * WEIGHTS.genre +
      scores.location * WEIGHTS.location +
      scores.capacityDraw * WEIGHTS.capacityDraw +
      scores.availability * WEIGHTS.availability +
      scores.compensation * WEIGHTS.compensation) *
      100,
  );
}
```

**Step 4: Run scoring tests**

Run: `npx vitest run src/lib/matching/__tests__/score.test.ts`
Expected: All PASS

**Step 5: Write failing tests for the compute function**

Create `src/lib/matching/__tests__/compute.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { computeMatchScore } from "../compute";

describe("computeMatchScore", () => {
  it("computes a high score for a great match", () => {
    const score = computeMatchScore(
      {
        genres: ["punk", "hardcore"],
        location: "Columbus, OH",
        drawEstimate: 60,
        availabilityPreference: "ANY_NIGHT",
      },
      {
        genres: ["punk", "hardcore"],
        venueCity: "Columbus, OH",
        venueCapacity: 80,
        showDate: new Date("2026-03-14"), // Saturday
        compensationType: "door_split",
      },
    );
    expect(score).toBeGreaterThan(80);
  });

  it("computes a low score for a poor match", () => {
    const score = computeMatchScore(
      {
        genres: ["jazz", "blues"],
        location: "New York, NY",
        drawEstimate: 500,
        availabilityPreference: "WEEKENDS",
      },
      {
        genres: ["punk", "hardcore"],
        venueCity: "Columbus, OH",
        venueCapacity: 50,
        showDate: new Date("2026-03-11"), // Wednesday
        compensationType: "guarantee",
      },
    );
    expect(score).toBeLessThan(20);
  });
});
```

**Step 6: Run test to verify it fails**

Run: `npx vitest run src/lib/matching/__tests__/compute.test.ts`
Expected: FAIL

**Step 7: Implement compute function**

Create `src/lib/matching/compute.ts`:

```typescript
import {
  genreScore,
  locationScore,
  capacityDrawScore,
  availabilityScore,
  compensationScore,
  totalScore,
} from "./score";

interface ArtistMatchData {
  genres: string[];
  location: string;
  drawEstimate: number | null;
  availabilityPreference: string;
}

interface ShowMatchData {
  genres: string[];
  venueCity: string;
  venueCapacity: number;
  showDate: Date;
  compensationType: string | null;
}

export function computeMatchScore(
  artist: ArtistMatchData,
  show: ShowMatchData,
): number {
  return totalScore({
    genre: genreScore(artist.genres, show.genres),
    location: locationScore(artist.location, show.venueCity),
    capacityDraw: capacityDrawScore(artist.drawEstimate, show.venueCapacity),
    availability: availabilityScore(
      artist.availabilityPreference,
      show.showDate,
    ),
    compensation: compensationScore(show.compensationType),
  });
}
```

**Step 8: Run all matching tests**

Run: `npx vitest run src/lib/matching/`
Expected: All PASS

**Step 9: Commit**

```bash
git add src/lib/matching/
git commit -m "feat: implement matching algorithm with TDD

Weighted scoring: genre (Jaccard), location, capacity/draw,
availability, compensation. Thoroughly tested."
```

---

## Task 10: Match Generation Job

**Files:**

- Create: `src/lib/matching/generate.ts`
- Create: `src/app/api/matching/run/route.ts`

**Step 1: Write the match generation function**

Create `src/lib/matching/generate.ts`:

```typescript
import { db } from "@/lib/db";
import { computeMatchScore } from "./compute";

/**
 * Generate matches for a specific show.
 * Computes scores for all artists and upserts Match records.
 */
export async function generateMatchesForShow(showId: string) {
  const show = await db.show.findUnique({
    where: { id: showId },
    include: {
      venue: true,
      genres: true,
    },
  });

  if (!show || show.status !== "OPEN") return;

  const artists = await db.artistProfile.findMany({
    include: { genres: true },
  });

  const showGenreSlugs = show.genres.map((g) => g.slug);

  for (const artist of artists) {
    const score = computeMatchScore(
      {
        genres: artist.genres.map((g) => g.slug),
        location: artist.location,
        drawEstimate: artist.drawEstimate,
        availabilityPreference: artist.availabilityPreference,
      },
      {
        genres: showGenreSlugs,
        venueCity: show.venue.city,
        venueCapacity: show.venue.capacity,
        showDate: show.date,
        compensationType: show.compensationType,
      },
    );

    // Only create matches above a minimum threshold
    if (score >= 10) {
      await db.match.upsert({
        where: {
          artistId_showId: { artistId: artist.id, showId: show.id },
        },
        create: {
          artistId: artist.id,
          showId: show.id,
          score,
        },
        update: {
          score,
          // Don't reset status if already interacted with
        },
      });
    }
  }
}

/**
 * Generate matches for all open shows.
 * Called by cron job or manually.
 */
export async function generateAllMatches() {
  const openShows = await db.show.findMany({
    where: { status: "OPEN" },
    select: { id: true },
  });

  for (const show of openShows) {
    await generateMatchesForShow(show.id);
  }

  return { processed: openShows.length };
}
```

**Step 2: Create the API route for triggering matching**

Create `src/app/api/matching/run/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { generateAllMatches } from "@/lib/matching/generate";

// Can be called by a cron job (e.g., Vercel Cron)
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await generateAllMatches();
  return NextResponse.json(result);
}
```

Add `CRON_SECRET` to `.env.example`.

**Step 3: Trigger matching on show creation**

Update `src/actions/show.ts` — after creating a show, call `generateMatchesForShow(show.id)`.

**Step 4: Commit**

```bash
git add src/lib/matching/generate.ts src/app/api/matching/ src/actions/show.ts
git commit -m "feat: add match generation job

Generates scored matches for all open shows. Runs on show
creation and via API endpoint for cron. Min score threshold 10."
```

---

## Task 11: Match Discovery UI

**Files:**

- Create: `src/app/(dashboard)/matches/page.tsx`
- Create: `src/components/matches/match-card.tsx`
- Create: `src/components/matches/match-queue.tsx`
- Create: `src/components/matches/passed-tab.tsx`
- Create: `src/actions/match.ts`

**Step 1: Write match interaction server actions**

Create `src/actions/match.ts`:

```typescript
"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function likeMatch(matchId: string) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Not authenticated" };

  const match = await db.match.findUnique({
    where: { id: matchId },
    include: { show: { include: { venue: true } }, artist: true },
  });

  if (!match) return { success: false, error: "Match not found" };

  const isArtist = session.user.role === "ARTIST";
  const isVenue = session.user.role === "VENUE";

  // Verify the user owns this side of the match
  if (isArtist && match.artist.userId !== session.user.id) {
    return { success: false, error: "Not authorized" };
  }
  if (isVenue && match.show.venue.userId !== session.user.id) {
    return { success: false, error: "Not authorized" };
  }

  let newStatus = match.status;

  if (isArtist && match.status === "SUGGESTED") {
    newStatus = "LIKED_BY_ARTIST";
  } else if (isVenue && match.status === "SUGGESTED") {
    newStatus = "LIKED_BY_VENUE";
  } else if (isArtist && match.status === "LIKED_BY_VENUE") {
    newStatus = "MUTUAL";
  } else if (isVenue && match.status === "LIKED_BY_ARTIST") {
    newStatus = "MUTUAL";
  }

  await db.match.update({
    where: { id: matchId },
    data: { status: newStatus },
  });

  // If mutual, create conversation
  if (newStatus === "MUTUAL") {
    await db.conversation.create({
      data: { matchId: match.id },
    });
  }

  revalidatePath("/matches");
  return { success: true, data: { status: newStatus } };
}

export async function passMatch(matchId: string) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Not authenticated" };

  // Verify ownership (same as above)...

  await db.match.update({
    where: { id: matchId },
    data: { status: "PASSED" },
  });

  revalidatePath("/matches");
  return { success: true };
}

export async function reconsiderMatch(matchId: string) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Not authenticated" };

  await db.match.update({
    where: { id: matchId },
    data: { status: "SUGGESTED" },
  });

  revalidatePath("/matches");
  return { success: true };
}
```

**Step 2: Build match card component**

Create `src/components/matches/match-card.tsx`:

- For artists: shows venue name, show title, date, genre tags, match score, key venue stats
- For venues: shows artist name, genre tags, match score, draw estimate, sample links
- Like button, Pass button
- Tap card → expand to full profile view

**Step 3: Build match queue with tabs**

Create `src/components/matches/match-queue.tsx`:

- Two tabs: "Suggested" and "Passed"
- Suggested tab: active matches sorted by score descending
- Passed tab: dismissed matches with "Reconsider" button
- For venues: group by show (dropdown or tabs to switch between shows)

**Step 4: Build the matches page**

Create `src/app/(dashboard)/matches/page.tsx`:

```tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { MatchQueue } from "@/components/matches/match-queue";

export default async function MatchesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const isArtist = session.user.role === "ARTIST";

  let matches;
  if (isArtist) {
    const profile = await db.artistProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!profile) redirect("/onboarding");

    matches = await db.match.findMany({
      where: { artistId: profile.id },
      include: {
        show: { include: { venue: true, genres: true } },
        artist: { include: { genres: true } },
      },
      orderBy: { score: "desc" },
    });
  } else {
    const profile = await db.venueProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!profile) redirect("/onboarding");

    matches = await db.match.findMany({
      where: { show: { venueId: profile.id } },
      include: {
        show: { include: { venue: true, genres: true } },
        artist: { include: { genres: true } },
      },
      orderBy: { score: "desc" },
    });
  }

  return <MatchQueue matches={matches} role={session.user.role} />;
}
```

**Step 5: Verify match discovery works**

1. Seed some test data (artists + venues + shows)
2. Run matching
3. Log in as artist → see suggested shows
4. Log in as venue → see suggested artists per show
5. Like, pass, reconsider all work

**Step 6: Commit**

```bash
git add src/app/\(dashboard\)/matches/ src/components/matches/ src/actions/match.ts
git commit -m "feat: add match discovery UI with like/pass/reconsider

Two-tab queue (Suggested + Passed), match cards with scores,
like/pass actions, reversible dismissals, mutual match creates conversation."
```

---

## Task 12: Messaging

**Files:**

- Create: `src/app/(dashboard)/messages/page.tsx`
- Create: `src/app/(dashboard)/messages/[id]/page.tsx`
- Create: `src/components/messages/conversation-list.tsx`
- Create: `src/components/messages/chat.tsx`
- Create: `src/components/messages/message-input.tsx`
- Create: `src/actions/message.ts`
- Create: `src/lib/pusher/server.ts`
- Create: `src/lib/pusher/client.ts`

**Step 1: Set up Pusher client and server**

Create `src/lib/pusher/server.ts`:

```typescript
import Pusher from "pusher";

export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});
```

Create `src/lib/pusher/client.ts`:

```typescript
import PusherClient from "pusher-js";

export const pusherClient = new PusherClient(
  process.env.NEXT_PUBLIC_PUSHER_KEY!,
  { cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER! },
);
```

**Step 2: Write the send message server action**

Create `src/actions/message.ts`:

```typescript
"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { messageSchema } from "@/lib/validations/message";
import { pusherServer } from "@/lib/pusher/server";

export async function sendMessage(input: {
  conversationId: string;
  body: string;
}) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Not authenticated" };

  const parsed = messageSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }

  // Verify user is participant in this conversation
  const conversation = await db.conversation.findUnique({
    where: { id: parsed.data.conversationId },
    include: {
      match: {
        include: {
          artist: true,
          show: { include: { venue: true } },
        },
      },
    },
  });

  if (!conversation) return { success: false, error: "Conversation not found" };

  const isParticipant =
    conversation.match.artist.userId === session.user.id ||
    conversation.match.show.venue.userId === session.user.id;

  if (!isParticipant) return { success: false, error: "Not authorized" };

  const message = await db.message.create({
    data: {
      conversationId: parsed.data.conversationId,
      senderId: session.user.id,
      body: parsed.data.body,
    },
    include: { sender: { select: { id: true, email: true } } },
  });

  // Broadcast via Pusher
  await pusherServer.trigger(
    `conversation-${parsed.data.conversationId}`,
    "new-message",
    message,
  );

  return { success: true, data: message };
}

export async function markMessagesRead(conversationId: string) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Not authenticated" };

  await db.message.updateMany({
    where: {
      conversationId,
      senderId: { not: session.user.id },
      read: false,
    },
    data: { read: true },
  });

  return { success: true };
}
```

**Step 3: Build conversation list**

Create `src/components/messages/conversation-list.tsx`:

- List all conversations the user is part of
- Show: other party's name, last message preview, unread count, match context (show name)
- Click → navigate to `/messages/[id]`

**Step 4: Build chat component**

Create `src/components/messages/chat.tsx`:

- Display messages in chronological order
- Real-time updates via Pusher subscription to `conversation-{id}` channel
- Auto-scroll to latest message
- Mark messages as read on view
- Show match context at top (artist ↔ show/venue info)

Create `src/components/messages/message-input.tsx`:

- Text input + send button
- Optimistic UI: show message immediately, reconcile on server response
- Disable while sending

**Step 5: Build message pages**

Create `src/app/(dashboard)/messages/page.tsx`:

- Fetch conversations for current user
- Render `ConversationList`

Create `src/app/(dashboard)/messages/[id]/page.tsx`:

- Fetch conversation + messages
- Render `Chat` component

**Step 6: Verify messaging works end-to-end**

1. Create a mutual match (like from both sides)
2. Log in as artist → Messages → see conversation
3. Send a message → appears immediately
4. Log in as venue in another browser → message visible in real-time
5. Reply → both sides see it

**Step 7: Commit**

```bash
git add src/app/\(dashboard\)/messages/ src/components/messages/ src/actions/message.ts src/lib/pusher/
git commit -m "feat: add real-time messaging for mutual matches

Pusher-based real-time chat, conversation list with unread
counts, optimistic UI, message read tracking."
```

---

## Task 13: Landing Page & Polish

**Files:**

- Modify: `src/app/page.tsx`
- Modify: `src/app/layout.tsx`
- Create: `src/components/landing/hero.tsx`

**Step 1: Build the landing page**

Update `src/app/page.tsx`:

- Hero section: "Find your next show" / tagline
- Two CTAs: "I'm an Artist" → /signup, "I'm a Venue" → /signup
- Brief feature highlights (matching, messaging, show management)
- Simple, clean, music-scene aesthetic

**Step 2: Update root layout**

Update `src/app/layout.tsx`:

- Set page title: "Backline — Connect Artists & Venues"
- Add meta description
- Set up font (Inter or similar)

**Step 3: Verify**

Run: `npm run dev`
Landing page looks good, all navigation flows work.

**Step 4: Commit**

```bash
git add src/app/page.tsx src/app/layout.tsx src/components/landing/
git commit -m "feat: add landing page

Hero section with CTAs, feature highlights, metadata."
```

---

## Task 14: E2E Tests (Critical Paths)

**Files:**

- Create: `e2e/auth.spec.ts`
- Create: `e2e/onboarding.spec.ts`
- Create: `e2e/matching.spec.ts`
- Create: `e2e/messaging.spec.ts`
- Create: `e2e/helpers.ts`

**Step 1: Write auth E2E tests**

Create `e2e/auth.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";

test("can sign up as artist and complete onboarding", async ({ page }) => {
  await page.goto("/signup");
  await page.getByRole("button", { name: /artist/i }).click();
  await page.getByLabel("Email").fill("testartist@example.com");
  await page.getByLabel("Password").fill("testpass123");
  await page.getByRole("button", { name: /sign up/i }).click();

  await expect(page).toHaveURL(/onboarding/);
});

test("can log in with existing account", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("testartist@example.com");
  await page.getByLabel("Password").fill("testpass123");
  await page.getByRole("button", { name: /log in/i }).click();

  await expect(page).toHaveURL(/dashboard|onboarding/);
});
```

**Step 2: Write matching E2E test**

Test the full flow: artist sees matches → likes → venue sees liked → likes back → conversation created.

**Step 3: Write messaging E2E test**

Test: open conversation → send message → message appears.

**Step 4: Run E2E tests**

```bash
npx playwright install
npm run test:e2e
```

Expected: All pass.

**Step 5: Commit**

```bash
git add e2e/
git commit -m "test: add E2E tests for auth, matching, and messaging

Playwright tests covering critical user paths."
```

---

## Summary

| Task | What it delivers                              |
| ---- | --------------------------------------------- |
| 1    | Project scaffolding, tooling, dependencies    |
| 2    | Complete database schema with all models      |
| 3    | Auth (signup, login, JWT sessions)            |
| 4    | Zod validation schemas (tested)               |
| 5    | Auth UI (signup + login pages)                |
| 6    | Onboarding (profile creation, genre seeding)  |
| 7    | Dashboard layout, navigation, profile editing |
| 8    | Show creation and management (venue side)     |
| 9    | Matching algorithm (thoroughly tested)        |
| 10   | Match generation job (per-show + cron)        |
| 11   | Match discovery UI (like/pass/reconsider)     |
| 12   | Real-time messaging (Pusher)                  |
| 13   | Landing page                                  |
| 14   | E2E tests                                     |
