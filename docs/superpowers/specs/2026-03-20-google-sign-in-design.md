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

Make `User.passwordHash` optional (`String?`). Google-only users won't have a password hash. Existing users are unaffected.

```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String?  // Was: String (required)
  role         Role?    // Was: Role (required) — null for new Google users pre-onboarding
  // ... rest unchanged
}
```

`role` also becomes optional (`Role?`) so new Google users can exist without a role until they complete onboarding.

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

Handle the case where `role` is `null` (new Google user pre-onboarding). Populate `token.role = null` so the session reflects it.

**Credentials `authorize`:**

Add a guard: if the looked-up user has no `passwordHash` (Google-only user), return `null` with an appropriate error. This prevents Google-only users from attempting email/password login.

### 3. New User Redirect (Onboarding)

In protected pages, after the existing `auth()` check:

```typescript
const session = await auth();
if (!session?.user) redirect("/login");
if (!session.user.role) redirect("/onboarding");
```

The onboarding page handles role selection and profile creation. For Google users, onboarding must:

1. Set the `role` on the existing User record (currently it expects the user was created with a role)
2. Proceed with profile creation as normal

Both email/password and Google users go through the same onboarding page.

### 4. UI Changes

**Both login and signup pages** get a Google sign-in button:

- Google-branded button (white background, Google "G" logo, "Sign in with Google" text)
- Placed above the existing form
- "or" divider separating Google button from the email/password form
- Button calls `signIn("google", { redirectTo: "/dashboard" })` from `next-auth/react`

On the signup page, the Google button is an alternative to the email/password + role selection form. Google users pick their role during onboarding instead.

### 5. Type Updates

**File:** `src/types/auth.ts`

`role` becomes `Role | null` on `Session.user`, `User`, and `JWT` interfaces to handle Google users pre-onboarding.

### 6. Environment Variables

New variables (NextAuth Google provider reads these automatically):

```
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

Update `.env.example` with placeholder entries.

### 7. Google Cloud Console Setup

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

| File                                  | Change                                                                           |
| ------------------------------------- | -------------------------------------------------------------------------------- |
| `prisma/schema.prisma`                | Make `passwordHash` and `role` optional                                          |
| `src/lib/auth/index.ts`               | Add Google provider, account linking in `signIn` callback, update `jwt` callback |
| `src/types/auth.ts`                   | `role` becomes `Role \| null`                                                    |
| `src/components/auth/login-form.tsx`  | Add Google sign-in button + divider                                              |
| `src/components/auth/signup-form.tsx` | Add Google sign-in button + divider                                              |
| `src/app/(dashboard)/*/page.tsx`      | Add role-check redirect to onboarding                                            |
| `src/app/(auth)/onboarding/*/`        | Handle setting role for Google users                                             |
| `.env.example`                        | Add Google OAuth placeholders                                                    |

## Testing

- **Manual:** Full Google OAuth flow (sign in, account linking, new user onboarding)
- **E2E:** Google button visibility on login/signup pages, new Google user redirect to onboarding (mock provider)
- **Unit tests:** No changes needed — matching/scoring logic unaffected

## Out of Scope

- Other OAuth providers (GitHub, Apple, etc.)
- Email verification for credentials users
- Password reset flow changes
