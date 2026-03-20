# Google Sign-In Integration Design

## Overview

Add Google OAuth sign-in alongside the existing email/password authentication. Users can sign in with either method. When a Google sign-in matches an existing user's email, the accounts are linked automatically. New Google users are redirected to onboarding for role selection.

## Requirements

- Google sign-in button on both login and signup pages
- Account linking: Google sign-in with an existing email links to that user
- New Google users redirected to onboarding for role selection (Artist/Venue)
- Existing users, profiles, matches, and conversations are preserved on linking
- Google Cloud Console setup instructions included

## Approach

NextAuth Google Provider with custom account linking in the `signIn` callback. Chosen over manual OAuth (too much code) and `allowDangerousEmailAccountLinking` (less control).

## Design

### 1. Schema Changes

Make `User.passwordHash` optional (`String?`) and `User.role` optional (`Role?`). Google-only users won't have a password hash, and new Google users won't have a role until they complete onboarding. Existing users are unaffected.

```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String?  // Was: String (required)
  role         Role?    // Was: Role (required) — null for new Google users pre-onboarding
  // ... rest unchanged
}
```

Making both fields optional is sufficient for the Prisma adapter's `createUser` to succeed — it only sets `email`, `name`, and `image`. No custom adapter needed.

Migration: `npx prisma migrate dev --name make-passwordhash-role-optional`

### 2. Auth Configuration

**File:** `src/lib/auth/index.ts`

Add the `Google` provider from `next-auth/providers/google`:

```typescript
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google, // reads GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET from env
    Credentials({ ... }), // existing
  ],
  // ...
});
```

**`signIn` callback — account linking logic:**

When provider is `"google"`:

1. Look up user by email in the database
2. If user exists and already has a Google Account record: allow sign-in (return `true`)
3. If user exists but no Google Account record: create an Account record linking `provider: "google"` + `providerAccountId` to the existing user, then return `true`
4. If no user exists: let NextAuth/Prisma adapter create the new user (will have `role: null`, `passwordHash: null`)

This is safe because Google guarantees email verification — we are not linking to an unverified email.

**`jwt` callback:**

Handle the case where `role` is `null` (new Google user pre-onboarding). When `token.role` is `null`, re-fetch the user's role from the database on each request. This ensures onboarding role updates are reflected in the session without requiring a re-login. Once a role is set, stop re-fetching (role doesn't change after onboarding).

**`session` callback:**

Update the type cast from `token.role as Role` to `token.role as Role | null` so null roles propagate correctly to the session.

**Credentials `authorize`:**

Add a guard: if the looked-up user has no `passwordHash` (Google-only user), return `null`. The login form should detect this case and show a helpful message: "This account uses Google Sign-In. Please sign in with Google."

### 3. New User Redirect (Onboarding)

**Place the role-null guard in `src/app/(dashboard)/layout.tsx`** rather than in each individual page. This ensures all dashboard pages are protected consistently:

```typescript
const session = await auth();
if (!session?.user) redirect("/login");
if (!session.user.role) redirect("/onboarding");
```

This is checked once at the layout level, before any role-based branching in child pages.

### 4. Onboarding for Google Users

The current onboarding page branches on `session.user.role` to show either `ArtistOnboarding` or `VenueOnboarding`. Google users arrive with `role: null`, so onboarding needs a new **role selection step**:

1. When `session.user.role` is `null`, render a role picker (reuse the role selection UI from `signup-form.tsx`)
2. On selection, call a server action that sets the `role` on the User record in the database
3. The `jwt` callback's re-fetch logic (see section 2) picks up the new role on the next request
4. After role is set, redirect/refresh to show the appropriate profile onboarding form (`ArtistOnboarding` or `VenueOnboarding`)

Both email/password and Google users end up on the same profile creation forms — Google users just have one extra step at the beginning.

### 5. UI Changes

**Both login and signup pages** get a Google sign-in button:

- Google-branded button (white background, Google "G" logo, "Sign in with Google" text)
- Placed above the existing form
- "or" divider separating Google button from the email/password form
- Button calls `signIn("google", { redirectTo: "/dashboard" })` from `next-auth/react`

On the signup page, the Google button is an alternative to the email/password + role selection form. Google users pick their role during onboarding instead.

**Error UX for Google-only users:** When a Google-only user tries to log in with email/password, display a message: "This account uses Google Sign-In. Please sign in with Google." Handle via a custom error parameter on the login page (e.g., `?error=OAuthAccountOnly`).

### 6. Type Updates

**File:** `src/types/auth.ts`

`role` becomes `Role | null` on `Session.user`, `User`, and `JWT` interfaces to handle Google users pre-onboarding.

### 7. Environment Variables

New variables (NextAuth Google provider reads these automatically):

```
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

Update `.env.example` with placeholder entries. Verify `.env` is in `.gitignore` (it should already be).

### 8. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to APIs & Services > Credentials
4. Configure OAuth consent screen (External, add app name and email)
5. Create OAuth 2.0 Client ID (Web application type)
6. Add Authorized redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://your-domain.com/api/auth/callback/google`
7. Copy the Client ID and Client Secret into your `.env` file

## Files Changed

| File                                  | Change                                                                                      |
| ------------------------------------- | ------------------------------------------------------------------------------------------- |
| `prisma/schema.prisma`                | Make `passwordHash` and `role` optional                                                     |
| `src/lib/auth/index.ts`               | Add Google provider, account linking in `signIn` callback, update `jwt`/`session` callbacks |
| `src/types/auth.ts`                   | `role` becomes `Role \| null`                                                               |
| `src/components/auth/login-form.tsx`  | Add Google sign-in button + divider, handle `OAuthAccountOnly` error                        |
| `src/components/auth/signup-form.tsx` | Add Google sign-in button + divider                                                         |
| `src/app/(dashboard)/layout.tsx`      | Add role-null redirect to onboarding                                                        |
| `src/app/(auth)/onboarding/page.tsx`  | Add role selection step for Google users (role is null)                                     |
| `src/actions/auth.ts`                 | Add `setRole` server action for Google user onboarding                                      |
| `.env.example`                        | Add Google OAuth placeholders                                                               |

## Testing

- **Manual:** Full Google OAuth flow (sign in, account linking, new user onboarding)
- **E2E:** Google button visibility on login/signup pages, new Google user redirect to onboarding (mock provider)
- **Unit tests:** No changes needed — matching/scoring logic unaffected

## Edge Cases

- **Google-only user tries email/password login:** Show helpful error message directing them to Google sign-in
- **User with email/password links Google, then tries both methods:** Both work — credentials check `passwordHash`, Google check uses Account record
- **Google user with no role accesses any dashboard page:** Layout-level guard redirects to onboarding before any role branching occurs
- **JWT refresh after onboarding:** `jwt` callback re-fetches role from DB when `token.role` is null, so no re-login required

## Out of Scope

- Other OAuth providers (GitHub, Apple, etc.)
- Email verification for credentials users
- Password reset flow changes
