# CAMAC - San Fernando Events

One always-current, shareable calendar of events and announcements for **CAMAC - San Fernando**,
built to be shared into the channels members already use (the church Facebook page and Messenger
group chat). Every event link unfurls into a rich preview card.

> Status: **MVP built and live**: https://camac-sf-web.vercel.app. Next is the pre-launch user
> test (build step 6), which starts the 4-week success-metric window. See the
> [project brief](docs/PROJECT_BRIEF.md) for the full scope, decisions and roadmap.

## What it does

**For members (no login)**

- **Agenda:** this week first, then the coming months grouped by month, with a ministry filter
  (events with no ministry show as Church-wide). Weekly services appear once with their pattern.
- **Event pages:** poster, venue with a Google Maps link, contact person, attire, and clear
  "Cancelled" and "This event has ended" notices. Past events are one tap away.
- **Share card:** a generated 1200×630 preview image for Messenger and Facebook. Its URL is
  versioned, so edits produce a new image.
- **Copy announcement** in the announcements volunteer's own post format, plus a **Share** button
  that opens the phone's share sheet.
- **Add to calendar:** Google Calendar link and `.ics` download. Weekly events add the whole series,
  minus skipped dates.
- **QR codes:** a print-ready half-A4 page and a PNG for slides, per event and for the prayer form.
- **Prayer requests:** a public form (anonymous allowed) with a privacy notice and `/privacy` page,
  protected by a honeypot and a loose per-IP rate limit.

**For admins (Google sign-in, allowlist only)**

- Create events as drafts, then publish, edit, cancel (with a note), delete and restore within 30
  days. Weekly recurrence with skip dates, all-day and multi-day events, Cloudinary poster upload.
- Open, copy and share counts per event, and the success-metric panel. No cookies or personal data
  are recorded; bots and signed-in admins aren't counted.
- **Prayer team only:** an inbox with a New → Prayed → Answered workflow. The team gets an email
  saying only "New prayer request" and a link, never the request itself.
- **Serving schedule:** enter who serves in each role for upcoming services.

**In the background:** a daily cron archives prayer requests after 60 days, deletes them after a
year (unless kept as a testimony), purges events deleted over 30 days ago and clears rate-limit
records.

## Stack

- **Next.js 16** (App Router, Cache Components, Partial Prefetching) + TypeScript + Tailwind CSS 4
  + shadcn/ui
- **Postgres on Neon** via **Prisma 7** (`pg` driver adapter: host-agnostic)
- **Auth.js v5**: Google sign-in for admins, allowlisted by the `User` table
- **Cloudinary** for posters (signed, admin-only uploads), **Nodemailer** over Gmail SMTP for
  prayer notifications, **qrcode** for QR codes, **Sentry** for server-side error tracking
- **Vitest** for logic, **Playwright** for end-to-end tests
- **GitHub Actions** CI; deployed on **Vercel Hobby** with **Vercel Cron**

## Getting started

Requires Node 22+.

```bash
npm install          # also generates the Prisma client
cp .env.example .env # then fill in the values
npm run db:migrate   # create tables in your database
npm run db:seed      # ministries, admin allowlist and weekly services from SEED_* env vars
npm run dev          # http://localhost:3000
```

Only the database and auth values in `.env` are required. Cloudinary, SMTP, `CRON_SECRET` and
Sentry are optional locally: left blank, that one feature is turned off (`.env.example` says what
each one does).

To sign in at `/admin`, your Google account's email must be in `SEED_ADMIN_EMAILS` (then re-run
`npm run db:seed`). Admins and prayer-team access are managed **only** through the seed script /
database; there is deliberately no UI for it.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build / server |
| `npm run typecheck` | Generate route types + `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` / `npm run test:watch` | Vitest unit tests, once / in watch mode |
| `npm run test:e2e` | Playwright tests (run `npx playwright install chromium` once) |
| `npm run db:migrate` | Create/apply a migration in development |
| `npm run db:deploy` | Apply migrations in production |
| `npm run db:seed` | Seed ministries, admins and weekly services |
| `npm run db:studio` | Browse the database |

## Project layout

```
prisma/schema.prisma      data model (brief §7)
prisma/seed.ts            ministries, admin allowlist and weekly services
src/auth.ts               Auth.js config (Google, allowlist check)
src/app/                  public routes: agenda, events/[slug] (+ share card, .ics, QR), past,
                          prayer, privacy
src/app/admin/(app)/      admin pages: events, prayer inbox, serving schedule
src/app/api/              Auth.js, the daily cron, and the open/copy/share counter
src/components/           shared UI (shadcn primitives in ui/)
src/lib/dal.ts            requireAdmin() / requirePrayerTeam(): server-side access checks
src/lib/db.ts             Prisma client (server-only)
src/lib/events/           recurrence, agenda, announcement text, calendar, metric, share card
src/lib/prayer/           prayer form input, status workflow, notifications
src/lib/schedule/         serving schedule roles and dates
src/lib/time.ts           UTC <-> Asia/Manila helpers
src/lib/slug.ts           event slug generation (set once, never changed)
e2e/                      Playwright tests
```

## Conventions

- **Time:** store UTC, display in `Asia/Manila`; admin inputs are Manila time.
- **Public queries** always exclude drafts (`publishedAt IS NULL`) and soft-deleted rows (`deletedAt IS NOT NULL`).
- **Slugs** are generated once at creation and never changed, so shared links keep working.
- **No real admin emails or private church details in the repo.** They live in env vars.
- **Privacy:** the developer has database access but commits to not reading prayer requests.

## Build order

- [x] **1** Setup, Neon + Prisma, seed, Google sign-in with allowlist, admin event CRUD, CI, first deploy
- [x] **2** Public agenda + event pages, weekly recurrence, multi-day, ministry filter, posters
- [x] **3** Share cards, Copy announcement / Share, open counter, metric panel
- [x] **4** Add to calendar (`.ics` + Google)
- [x] **5** Printable QR pages + PNG
- [ ] **6** Pre-launch user test → start the 4-week measurement window
- [x] **7** Prayer requests + retention/purge crons

Also live: venue addresses with Maps links, server-side error tracking, and the admin side of the
serving schedule (the members' view comes after the user test).

## Success metric

Over 4 weeks: **at least 8 events shared, averaging 15+ opens each.** Results will be posted here.

## Something looks wrong?

Admins: message the builder with a screenshot and the link you were on.
