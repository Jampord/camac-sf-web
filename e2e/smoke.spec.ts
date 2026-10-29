import { expect, test } from "@playwright/test";

// Grows into the main public flow (agenda -> event page -> add to calendar) in build step 2+.
test("home page loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Upcoming events" })).toBeVisible();
});

test("admin area redirects signed-out visitors to sign-in", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/sign-in/);
  await expect(page.getByRole("button", { name: "Sign in with Google" })).toBeVisible();
});
