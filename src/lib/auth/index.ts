import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
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
      try {
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
      } catch (error: unknown) {
        // If adapter already created this account, ignore the duplicate
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          // Already linked — proceed
        } else {
          throw error;
        }
      }

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
          where: { id: token.id as string },
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
