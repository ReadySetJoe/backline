"use server";

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { signUpSchema, type SignUpInput } from "@/lib/validations/auth";
import { signIn } from "@/lib/auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";

export async function signUp(input: SignUpInput) {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.flatten().fieldErrors,
    };
  }

  const existing = await db.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (existing) {
    return {
      success: false as const,
      error: { email: ["Email already in use"] },
    };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  await db.user.create({
    data: {
      email: parsed.data.email,
      passwordHash,
      role: parsed.data.role as "ARTIST" | "VENUE",
    },
  });

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/onboarding",
    });
  } catch (error) {
    // In Auth.js v5, signIn on the server throws a NEXT_REDIRECT error
    // when redirecting. We need to re-throw it so Next.js handles the redirect.
    if (isRedirectError(error)) {
      throw error;
    }
    return {
      success: false as const,
      error: { email: ["Failed to sign in after registration"] },
    };
  }

  return { success: true as const };
}
