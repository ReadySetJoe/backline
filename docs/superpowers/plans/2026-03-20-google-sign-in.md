# Google Sign-In Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Google OAuth sign-in alongside email/password auth, with automatic account linking and onboarding for new Google users.

**Architecture:** Add the NextAuth Google provider with custom account linking in the `signIn` callback. Make `passwordHash` and `role` optional on the User model. New Google users (no role) are redirected to a role-selection step in onboarding before profile creation.

**Tech Stack:** NextAuth v5 (beta), Prisma, Next.js 16 App Router, shadcn/ui

**Spec:** `docs/superpowers/specs/2026-03-20-google-sign-in-design.md`

---

### Task 1: Schema Migration — Make `passwordHash` and `role` Optional

**Files:**

- Modify: `prisma/schema.prisma:56-69` (User model)

- [ ] **Step 1: Update the User model**

In `prisma/schema.prisma`, change `passwordHash` and `role` to optional:

```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String?
  role         Role?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  artistProfile ArtistProfile?
  venueProfile  VenueProfile?
  messages      Message[]
  accounts      Account[]
  sessions      Session[]
}
```

- [ ] **Step 2: Generate the migration**

Run: `npx prisma migrate dev --name make-passwordhash-role-optional`
Expected: Migration created successfully, Prisma client regenerated.

- [ ] **Step 3: Verify the migration**

Run: `npx prisma migrate status`
Expected: All migrations applied, no pending migrations.

- [ ] **Step 4: Commit**

```bash
git add prisma/
git commit -m "feat: make passwordHash and role optional for Google OAuth support"
```

---

### Task 2: Update Types — Allow Null Role

**Files:**

- Modify: `src/types/auth.ts`

- [ ] **Step 1: Update auth type declarations**

Replace the contents of `src/types/auth.ts` with:

```typescript
import { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      role: Role | null;
    };
  }

  interface User {
    role: Role | null;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: Role | null;
  }
}
```

- [ ] **Step 2: Verify build compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: Type errors related to `role` usage in other files (these will be fixed in subsequent tasks). No errors in `auth.ts` itself.

- [ ] **Step 3: Commit**

```bash
git add src/types/auth.ts
git commit -m "feat: update auth types to allow null role for Google users"
```

---

### Task 3: Auth Configuration — Add Google Provider + Account Linking

**Files:**

- Modify: `src/lib/auth/index.ts`

- [ ] **Step 1: Add Google provider and update auth config**

Replace the contents of `src/lib/auth/index.ts` with:

```typescript
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import type { NextAuthConfig } from "next-auth";

const config = {
  adapter: PrismaAdapter(db) as NextAuthConfig["adapter"],
  session: { strategy: "jwt" as const },
  pages: {
    signIn: "/login",
  },
  providers: [
    Google,
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

        // Google-only users don't have a password
        if (!user.passwordHash) return null;

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
    async signIn({ user, account }) {
      if (account?.provider !== "google") return true;

      const email = user.email;
      if (!email) return false;

      // The PrismaAdapter creates user + account for new OAuth users
      // BEFORE this callback fires. So by now, the user always exists.
      // We only need to handle the case where an EXISTING email/password
      // user signs in with Google for the first time (no Google Account yet).
      const existingUser = await db.user.findUnique({
        where: { email },
        include: { accounts: true },
      });

      if (!existingUser) {
        // Adapter already created them — allow sign-in
        return true;
      }

      // Check if Google account is already linked (includes adapter-created ones)
      const hasGoogleAccount = existingUser.accounts.some(
        (a) => a.provider === "google",
      );

      if (hasGoogleAccount) {
        // Point NextAuth user to existing user so JWT gets the right id
        user.id = existingUser.id;
        user.role = existingUser.role;
        return true;
      }

      // Link Google account to existing email/password user
      await db.account.create({
        data: {
          userId: existingUser.id,
          type: account.type,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          access_token: account.access_token,
          refresh_token: account.refresh_token,
          expires_at: account.expires_at,
          token_type: account.token_type,
          scope: account.scope,
          id_token: account.id_token,
          session_state: account.session_state as string | null,
        },
      });

      // Point NextAuth user to existing user so JWT gets the right id
      user.id = existingUser.id;
      user.role = existingUser.role;

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role ?? null;
      }

      // Re-fetch role from DB when null (Google user completing onboarding)
      if (token.role === null) {
        const dbUser = await db.user.findUnique({
          where: { id: token.id },
          select: { role: true },
        });
        if (dbUser?.role) {
          token.role = dbUser.role;
        }
      }

      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as import("@prisma/client").Role | null;
      return session;
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(config);
```

- [ ] **Step 2: Verify the file compiles**

Run: `npx tsc --noEmit 2>&1 | grep "src/lib/auth"`
Expected: No errors in `src/lib/auth/index.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/auth/index.ts
git commit -m "feat: add Google OAuth provider with account linking"
```

---

### Task 4: Dashboard Layout — Add Role-Null Guard

**Files:**

- Modify: `src/app/(dashboard)/layout.tsx:12-43`

- [ ] **Step 1: Add the role-null redirect**

In `src/app/(dashboard)/layout.tsx`, add a role-null check after the auth check and before the SUPER_ADMIN check. The section from line 12 to line 43 should become:

```typescript
const session = await auth();

if (!session?.user) {
  redirect("/login");
}

// Google users who haven't completed onboarding have no role
if (!session.user.role) {
  redirect("/onboarding");
}

if (session.user.role === "SUPER_ADMIN") {
  redirect("/admin");
}

// Check for profile existence — redirect to onboarding if not set up
let profileName: string | null = null;

if (session.user.role === "ARTIST") {
  const profile = await db.artistProfile.findUnique({
    where: { userId: session.user.id },
    select: { name: true },
  });
  if (!profile) {
    redirect("/onboarding");
  }
  profileName = profile.name;
} else if (session.user.role === "VENUE") {
  const profile = await db.venueProfile.findUnique({
    where: { userId: session.user.id },
    select: { name: true },
  });
  if (!profile) {
    redirect("/onboarding");
  }
  profileName = profile.name;
}
```

- [ ] **Step 2: Fix the Sidebar type issue**

The `<Sidebar>` component receives `role={session.user.role}`. The Sidebar's `SidebarProps` requires `role: Role` (non-nullable), but `session.user.role` is now `Role | null`. Since the null case redirects above, use a non-null assertion:

```tsx
<Sidebar role={session.user.role!} />
```

- [ ] **Step 3: Verify build compiles**

Run: `npx tsc --noEmit 2>&1 | grep "layout.tsx"`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/(dashboard)/layout.tsx
git commit -m "feat: redirect users with no role to onboarding in dashboard layout"
```

---

### Task 5: Server Action — Add `setRole` for Google Users

**Files:**

- Modify: `src/actions/auth.ts`

- [ ] **Step 1: Add the `setRole` server action**

Add `auth` to the existing import from `@/lib/auth` at the top of the file:

```typescript
import { signIn, auth } from "@/lib/auth";
```

Then add the following to the end of `src/actions/auth.ts`:

```typescript
export async function setRole(role: "ARTIST" | "VENUE") {
  const session = await auth();

  if (!session?.user) {
    return { success: false as const, error: "Not authenticated" };
  }

  if (session.user.role) {
    return { success: false as const, error: "Role already set" };
  }

  if (role !== "ARTIST" && role !== "VENUE") {
    return { success: false as const, error: "Invalid role" };
  }

  await db.user.update({
    where: { id: session.user.id },
    data: { role },
  });

  revalidatePath("/onboarding");

  return { success: true as const };
}
```

Also add `revalidatePath` to the imports at the top if not already present:

```typescript
import { revalidatePath } from "next/cache";
```

- [ ] **Step 2: Verify the file compiles**

Run: `npx tsc --noEmit 2>&1 | grep "actions/auth"`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/actions/auth.ts
git commit -m "feat: add setRole server action for Google user onboarding"
```

---

### Task 6: Onboarding Page — Add Role Selection for Google Users

**Files:**

- Modify: `src/app/(auth)/onboarding/page.tsx`
- Create: `src/components/onboarding/role-selection.tsx`

- [ ] **Step 1: Create the RoleSelection component**

Create `src/components/onboarding/role-selection.tsx`:

```tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { setRole } from "@/actions/auth";

export function RoleSelection() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSelect(role: "ARTIST" | "VENUE") {
    setError(null);
    startTransition(async () => {
      const result = await setRole(role);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            Welcome! What describes you best?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-24 text-lg"
              onClick={() => handleSelect("ARTIST")}
              disabled={isPending}
            >
              I&apos;m an Artist
            </Button>
            <Button
              variant="outline"
              className="h-24 text-lg"
              onClick={() => handleSelect("VENUE")}
              disabled={isPending}
            >
              I&apos;m a Venue
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Update the onboarding page to handle null role**

Replace the contents of `src/app/(auth)/onboarding/page.tsx` with:

```tsx
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { ArtistOnboarding } from "@/components/onboarding/artist-onboarding";
import { VenueOnboarding } from "@/components/onboarding/venue-onboarding";
import { RoleSelection } from "@/components/onboarding/role-selection";

export default async function OnboardingPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Google users who haven't selected a role yet
  if (!session.user.role) {
    return <RoleSelection />;
  }

  // Check if user already has a profile
  if (session.user.role === "ARTIST") {
    const existing = await db.artistProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (existing) redirect("/dashboard");
  } else if (session.user.role === "VENUE") {
    const existing = await db.venueProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (existing) redirect("/dashboard");
  }

  const genres = await db.genre.findMany({
    orderBy: { name: "asc" },
  });

  if (session.user.role === "ARTIST") {
    return <ArtistOnboarding genres={genres} />;
  }

  return <VenueOnboarding genres={genres} />;
}
```

- [ ] **Step 3: Verify build compiles**

Run: `npx tsc --noEmit 2>&1 | grep -E "onboarding|role-selection"`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/onboarding/role-selection.tsx src/app/(auth)/onboarding/page.tsx
git commit -m "feat: add role selection step for Google users in onboarding"
```

---

### Task 7: Shared GoogleIcon Component

**Files:**

- Create: `src/components/auth/google-icon.tsx`

- [ ] **Step 1: Create the GoogleIcon component**

Create `src/components/auth/google-icon.tsx`:

```tsx
export function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="mr-2 h-5 w-5" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/auth/google-icon.tsx
git commit -m "feat: add shared GoogleIcon component"
```

---

### Task 8: UI — Google Sign-In Button on Login Page

**Files:**

- Modify: `src/components/auth/login-form.tsx`

- [ ] **Step 1: Add Google button and divider to login form**

Replace the contents of `src/components/auth/login-form.tsx` with:

```tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleIcon } from "@/components/auth/google-icon";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isGooglePending, setIsGooglePending] = useState(false);

  // Check for OAuth-only account error
  const urlError = searchParams.get("error");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
        return;
      }

      router.push("/dashboard");
    });
  }

  function handleGoogleSignIn() {
    setIsGooglePending(true);
    signIn("google", { redirectTo: "/dashboard" });
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Welcome back</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogleSignIn}
          disabled={isGooglePending}
        >
          <GoogleIcon />
          {isGooglePending ? "Redirecting..." : "Sign in with Google"}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">or</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {(error || urlError === "OAuthAccountOnly") && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {urlError === "OAuthAccountOnly"
                ? "This account uses Google Sign-In. Please sign in with Google."
                : error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Verify build compiles**

Run: `npx tsc --noEmit 2>&1 | grep "login-form"`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/auth/login-form.tsx
git commit -m "feat: add Google sign-in button to login page"
```

---

### Task 9: UI — Google Sign-In Button on Signup Page

**Files:**

- Modify: `src/components/auth/signup-form.tsx`

- [ ] **Step 1: Add Google button and divider to signup form**

Replace the contents of `src/components/auth/signup-form.tsx` with:

```tsx
"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { signUp } from "@/actions/auth";
import { GoogleIcon } from "@/components/auth/google-icon";

export function SignUpForm() {
  const [role, setRole] = useState<"ARTIST" | "VENUE" | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isPending, startTransition] = useTransition();
  const [isGooglePending, setIsGooglePending] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    if (!role) return;

    startTransition(async () => {
      const result = await signUp({ email, password, role });
      if (result && !result.success) {
        setErrors(result.error as Record<string, string[]>);
      }
    });
  }

  function handleGoogleSignIn() {
    setIsGooglePending(true);
    signIn("google", { redirectTo: "/dashboard" });
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl text-center">
          Create an account
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogleSignIn}
          disabled={isGooglePending}
        >
          <GoogleIcon />
          {isGooglePending ? "Redirecting..." : "Sign up with Google"}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">or</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>I am a...</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={role === "ARTIST" ? "default" : "outline"}
                className="w-full"
                onClick={() => setRole("ARTIST")}
              >
                I&apos;m an Artist
              </Button>
              <Button
                type="button"
                variant={role === "VENUE" ? "default" : "outline"}
                className="w-full"
                onClick={() => setRole("VENUE")}
              >
                I&apos;m a Venue
              </Button>
            </div>
            {errors.role && (
              <p className="text-sm text-destructive">{errors.role[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Min 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password[0]}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={!role || isPending}
          >
            {isPending ? "Creating account..." : "Sign Up"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Verify build compiles**

Run: `npx tsc --noEmit 2>&1 | grep "signup-form"`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/auth/signup-form.tsx
git commit -m "feat: add Google sign-in button to signup page"
```

---

### Task 10: Environment Variables

**Files:**

- Modify: `.env.example`
- Modify: `.env` (local only, not committed)

- [ ] **Step 1: Update `.env.example`**

Add the following to the end of `.env.example`:

```
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

- [ ] **Step 2: Verify `.env` is in `.gitignore`**

Run: `grep "^\.env$" .gitignore`
Expected: `.env` appears in `.gitignore`.

- [ ] **Step 3: Add Google credentials to local `.env`**

Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` values to `.env`. These come from the Google Cloud Console (see spec section 8 for setup instructions).

- [ ] **Step 4: Commit**

```bash
git add .env.example
git commit -m "feat: add Google OAuth env vars to .env.example"
```

---

### Task 11: Build Verification and Smoke Test

- [ ] **Step 1: Run full TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 2: Run existing tests**

Run: `npm run test`
Expected: All 45 tests pass (matching/validation tests are unaffected).

- [ ] **Step 3: Run lint**

Run: `npm run lint`
Expected: No errors.

- [ ] **Step 4: Run build**

Run: `npm run build`
Expected: Build succeeds. Note: may warn about missing `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` if not set in `.env`.

- [ ] **Step 5: Manual smoke test (requires Google OAuth credentials)**

1. Start dev server: `npm run dev`
2. Go to `/login` — verify Google button appears above email/password form with "or" divider
3. Go to `/signup` — verify Google button appears above the form
4. Click "Sign in with Google" — verify redirect to Google consent screen
5. Complete Google sign-in — verify redirect to onboarding (new user) or dashboard (existing user with role)
6. On onboarding, select a role — verify profile creation form appears
7. Try email/password login for a Google-only account — verify helpful error message
