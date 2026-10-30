import { expect, test } from "@playwright/test";

// Grows into the main public flow (agenda -> event page -> add to calendar) in build step 2+.
test("home page loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Upcoming events" })).toBeVisible();
});

// Works with or without events in the database (CI starts empty, dev has data).
test("ministry chips filter the agenda through the URL", async ({ page }) => {
  await page.goto("/");
  const filter = page.getByRole("navigation", { name: "Filter by ministry" });
  await expect(filter.getByRole("link", { name: "All events" })).toHaveAttribute(
    "aria-current",
    "true",
  );

  await filter.getByRole("link", { name: "Youth", exact: true }).click();
  await expect(page).toHaveURL(/\/\?ministry=youth$/);
  await expect(filter.getByRole("link", { name: "Youth", exact: true })).toHaveAttribute(
    "aria-current",
    "true",
  );
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

  // The redirect must happen before any admin HTML is sent, or the admin nav flashes
  // on screen first (src/proxy.ts).
  test(`${path} sends signed-out visitors no admin HTML`, async ({ request }) => {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status()).toBe(307);
    expect(response.headers().location).toMatch(/\/admin\/sign-in$/);
  });
}

test("the sign-in page itself is not redirected", async ({ request }) => {
  const response = await request.get("/admin/sign-in", { maxRedirects: 0 });
  expect(response.status()).toBe(200);
});
