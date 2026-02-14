import { test, expect } from "@playwright/test";
import { signUp, uniqueEmail } from "./helpers";

test.describe("Onboarding", () => {
  test("artist can complete onboarding", async ({ page }) => {
    const email = uniqueEmail("onboard-artist");
    await signUp(page, email, "testpass123", "artist");
    await expect(page).toHaveURL(/onboarding/);

    // Step 1: Basics — fill name, select artist type, set member count
    await page.getByLabel(/artist \/ band name/i).fill("The Test Band");

    // Open the "Artist Type" select and choose "Full Band"
    await page.getByLabel(/artist type/i).click();
    await page.getByRole("option", { name: /full band/i }).click();

    await page.getByLabel(/member count/i).clear();
    await page.getByLabel(/member count/i).fill("4");

    await page.getByRole("button", { name: /next/i }).click();

    // Step 2: Genres — select at least one genre
    // Genre buttons are rendered from the database; click the first available one
    const genreButtons = page.locator(
      "button.rounded-md.border.text-sm.font-medium"
    );
    await genreButtons.first().click();

    await page.getByRole("button", { name: /next/i }).click();

    // Step 3: Details — fill location (required)
    await page.getByLabel(/location/i).fill("Columbus, OH");

    await page.getByRole("button", { name: /next/i }).click();

    // Step 4: Links — all optional, click Complete Profile
    await page.getByRole("button", { name: /complete profile/i }).click();

    // Should redirect to dashboard after successful profile creation
    await expect(page).toHaveURL(/dashboard/);
  });

  test("artist must fill required fields to proceed", async ({ page }) => {
    const email = uniqueEmail("onboard-required");
    await signUp(page, email, "testpass123", "artist");
    await expect(page).toHaveURL(/onboarding/);

    // Step 1: Next button should be disabled without required fields
    const nextButton = page.getByRole("button", { name: /next/i });
    await expect(nextButton).toBeDisabled();

    // Fill name only — still need artist type
    await page.getByLabel(/artist \/ band name/i).fill("Incomplete Band");
    await expect(nextButton).toBeDisabled();

    // Select artist type — now should be enabled
    await page.getByLabel(/artist type/i).click();
    await page.getByRole("option", { name: /solo/i }).click();

    await expect(nextButton).toBeEnabled();
  });

  test("artist must select at least one genre", async ({ page }) => {
    const email = uniqueEmail("onboard-genre");
    await signUp(page, email, "testpass123", "artist");
    await expect(page).toHaveURL(/onboarding/);

    // Complete Step 1
    await page.getByLabel(/artist \/ band name/i).fill("Genre Test Band");
    await page.getByLabel(/artist type/i).click();
    await page.getByRole("option", { name: /duo/i }).click();
    await page.getByRole("button", { name: /next/i }).click();

    // Step 2: Next button should be disabled with no genres selected
    const nextButton = page.getByRole("button", { name: /next/i });
    await expect(nextButton).toBeDisabled();

    // Select a genre
    const genreButtons = page.locator(
      "button.rounded-md.border.text-sm.font-medium"
    );
    await genreButtons.first().click();

    await expect(nextButton).toBeEnabled();
  });

  test("artist can navigate back between steps", async ({ page }) => {
    const email = uniqueEmail("onboard-back");
    await signUp(page, email, "testpass123", "artist");
    await expect(page).toHaveURL(/onboarding/);

    // Step 1: Back button should be disabled on first step
    const backButton = page.getByRole("button", { name: /back/i });
    await expect(backButton).toBeDisabled();

    // Complete Step 1 and go to Step 2
    await page.getByLabel(/artist \/ band name/i).fill("Back Nav Band");
    await page.getByLabel(/artist type/i).click();
    await page.getByRole("option", { name: /solo/i }).click();
    await page.getByRole("button", { name: /next/i }).click();

    // Now on Step 2, Back should be enabled
    await expect(backButton).toBeEnabled();

    // Go back to Step 1 and verify name is preserved
    await backButton.click();
    await expect(page.getByLabel(/artist \/ band name/i)).toHaveValue(
      "Back Nav Band"
    );
  });

  test("venue can complete onboarding", async ({ page }) => {
    const email = uniqueEmail("onboard-venue");
    await signUp(page, email, "testpass123", "venue");
    await expect(page).toHaveURL(/onboarding/);

    // Step 1: Basics — fill venue name, address, city
    await page.getByLabel(/venue name/i).fill("The Test Venue");
    await page.getByLabel(/address/i).fill("123 Main St");
    await page.getByLabel(/city/i).fill("Columbus");

    await page.getByRole("button", { name: /next/i }).click();

    // Step 2: Venue Details — fill capacity (required)
    await page.getByLabel(/capacity/i).fill("200");

    // Optionally check PA and Backline checkboxes
    await page.getByLabel(/has pa system/i).check();
    await page.getByLabel(/has backline gear/i).check();

    await page.getByRole("button", { name: /next/i }).click();

    // Step 3: Genres — select at least one genre
    const genreButtons = page.locator(
      "button.rounded-md.border.text-sm.font-medium"
    );
    await genreButtons.first().click();

    await page.getByRole("button", { name: /next/i }).click();

    // Step 4: Links — all optional, click Complete Profile
    await page.getByRole("button", { name: /complete profile/i }).click();

    // Should redirect to dashboard after successful profile creation
    await expect(page).toHaveURL(/dashboard/);
  });

  test("onboarding redirects unauthenticated users to login", async ({
    page,
  }) => {
    // Visiting /onboarding without being logged in should redirect to /login
    await page.goto("/onboarding");
    await expect(page).toHaveURL(/login/);
  });
});
