import { Page } from "@playwright/test";

/**
 * Sign up a new user. Clicks the appropriate role button,
 * fills email/password, and submits the form.
 */
export async function signUp(
  page: Page,
  email: string,
  password: string,
  role: "artist" | "venue",
) {
  await page.goto("/signup");

  // The role buttons read "I'm an Artist" / "I'm a Venue"
  const roleLabel = role === "artist" ? /I'm an Artist/i : /I'm a Venue/i;
  await page.getByRole("button", { name: roleLabel }).click();

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /sign up/i }).click();
}

/**
 * Log in an existing user via the /login page.
 */
export async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
}

/**
 * Generate a unique email address to avoid collisions between test runs.
 */
export function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}@test.backline.app`;
}
