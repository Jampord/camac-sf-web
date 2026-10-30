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

// Drafts, deleted events and wrong links show the not-found page and are kept out of search
// results and link previews. The status code is 404 once cached; the very first visit to a URL
// streams with 200 plus noindex (Next's documented "soft 404" with Partial Prefetching), so the
// test checks what visitors and crawlers get rather than the status.
for (const slug of ["no-such-event-2099-01", "__placeholder__"]) {
  test(`/events/${slug} shows the not-found page and isn't indexed`, async ({ page }) => {
    const response = await page.goto(`/events/${slug}`);
    expect([200, 404]).toContain(response?.status());
    await expect(page.getByRole("heading", { name: "This page isn't available" })).toBeVisible();
    await expect(page.getByRole("link", { name: "See upcoming events" })).toBeVisible();
    await expect(page.locator('meta[name="robots"][content*="noindex"]')).toHaveCount(1);
  });
}

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
