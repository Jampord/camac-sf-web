import { expect, test } from "@playwright/test";

// Grows into the main public flow (agenda -> event page -> add to calendar) in build step 2+.
test("home page loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Upcoming events" })).toBeVisible();
});

// Every admin page must send signed-out visitors to sign-in, including the edit page for an
// id that doesn't exist (access is checked before the database is).
for (const path of [
  "/admin",
  "/admin/events/new",
  "/admin/events/deleted",
  "/admin/events/some-id",
]) {
  test(`${path} redirects signed-out visitors to sign-in`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveURL(/\/admin\/sign-in/);
    await expect(page.getByRole("button", { name: "Sign in with Google" })).toBeVisible();
  });
}
