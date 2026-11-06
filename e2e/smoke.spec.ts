import { expect, test } from "@playwright/test";

test("the landing page leads to the full agenda", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Coming up" })).toBeVisible();
  await page.getByRole("link", { name: "See all events" }).click();
  await expect(page).toHaveURL(/\/events$/);
  await expect(page.getByRole("heading", { name: "Upcoming events", level: 1 })).toBeVisible();
});

// A tab bar on phones, header links on wider screens: only one is visible at a time, so this
// works at either size.
test("the main navigation reaches every public section", async ({ page }) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Main" });
  await nav.getByRole("link", { name: "Events" }).click();
  await expect(page).toHaveURL(/\/events$/);
  await expect(nav.getByRole("link", { name: "Events" })).toHaveAttribute("aria-current", "page");
  await nav.getByRole("link", { name: "Prayer" }).click();
  await expect(page).toHaveURL(/\/prayer$/);
  await nav.getByRole("link", { name: "Home" }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("past events are one tap from the agenda", async ({ page }) => {
  await page.goto("/events");
  await page.getByRole("link", { name: "Past events" }).click();
  await expect(page).toHaveURL(/\/past$/);
  await expect(page.getByRole("heading", { name: "Past events", level: 1 })).toBeVisible();
  await page.getByRole("link", { name: "Upcoming events" }).click();
  await expect(page).toHaveURL(/\/events$/);
});

// Works with or without events in the database (CI starts empty, dev has data).
test("the ministry dropdown filters the agenda through the URL", async ({ page }) => {
  await page.goto("/events");
  const filter = page.getByLabel("Ministry");
  await expect(filter).toHaveValue("");

  await filter.selectOption({ label: "Youth" });
  await expect(page).toHaveURL(/\/events\?ministry=youth$/);
  await expect(filter).toHaveValue("youth");

  // A shared filtered link opens with that ministry already chosen.
  await page.goto("/events?ministry=youth");
  await expect(page.getByLabel("Ministry")).toHaveValue("youth");
});

// Doesn't submit: CI has no prayer data to clean up, and the form must never need a sign-in.
test("the prayer form is one tap from home, with its privacy notice", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Prayer" }).click();
  await expect(page).toHaveURL(/\/prayer$/);
  await expect(page.getByLabel("Your prayer request")).toBeVisible();
  await expect(
    page.getByRole("checkbox", { name: "It's OK to share this with the congregation" }),
  ).not.toBeChecked();
  await page.getByRole("link", { name: "How we handle your request" }).click();
  await expect(page).toHaveURL(/\/privacy$/);
  await expect(page.getByRole("heading", { name: "Privacy", level: 1 })).toBeVisible();
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
  "/admin/prayer",
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
