import { test, expect } from "@playwright/test";
import { signUp, login, uniqueEmail } from "./helpers";

test.describe("Authentication", () => {
  test("can sign up as an artist", async ({ page }) => {
    const email = uniqueEmail("artist");
    await signUp(page, email, "testpass123", "artist");

    // The auth action redirects to /onboarding after successful signup
    await expect(page).toHaveURL(/onboarding/);
  });

  test("can sign up as a venue", async ({ page }) => {
    const email = uniqueEmail("venue");
    await signUp(page, email, "testpass123", "venue");

    await expect(page).toHaveURL(/onboarding/);
  });

  test("cannot sign up with existing email", async ({ page }) => {
    const email = uniqueEmail("dup");

    // First signup should succeed
    await signUp(page, email, "testpass123", "artist");
    await expect(page).toHaveURL(/onboarding/);

    // Try to sign up again with the same email
    await signUp(page, email, "testpass123", "artist");

    // The server action returns "Email already in use"
    await expect(page.getByText(/already in use/i)).toBeVisible();
  });

  test("can log in with existing account", async ({ page }) => {
    const email = uniqueEmail("login");

    // Create account first
    await signUp(page, email, "testpass123", "artist");
    await expect(page).toHaveURL(/onboarding/);

    // Navigate to login page (effectively logging out by starting a new session)
    await page.goto("/login");
    await login(page, email, "testpass123");

    // Should redirect to /dashboard (or /onboarding if profile not yet created)
    await expect(page).toHaveURL(/dashboard|onboarding/);
  });

  test("shows error for invalid login", async ({ page }) => {
    await login(page, "nonexistent@test.com", "wrongpassword");

    // The LoginForm displays "Invalid email or password"
    await expect(page.getByText(/invalid email or password/i)).toBeVisible();
  });

  test("signup page has link to login", async ({ page }) => {
    await page.goto("/signup");

    const signInLink = page.getByRole("link", { name: /sign in/i });
    await expect(signInLink).toBeVisible();
    await signInLink.click();

    await expect(page).toHaveURL(/login/);
  });

  test("login page has link to signup", async ({ page }) => {
    await page.goto("/login");

    const signUpLink = page.getByRole("link", { name: /sign up/i });
    await expect(signUpLink).toBeVisible();
    await signUpLink.click();

    await expect(page).toHaveURL(/signup/);
  });

  test("signup requires role selection", async ({ page }) => {
    await page.goto("/signup");

    // Fill email and password but do NOT select a role
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Password").fill("testpass123");

    // The submit button should be disabled when no role is selected
    const submitButton = page.getByRole("button", { name: /sign up/i });
    await expect(submitButton).toBeDisabled();
  });
});
