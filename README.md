# CAMAC - San Fernando Events

One always-current, shareable calendar of events and announcements for **CAMAC - San Fernando**,
built to be shared into the channels members already use (the church Facebook page and Messenger
group chat). Every event link unfurls into a rich preview card.

> Status: **early setup** (build step 1 in progress). See the [project brief](docs/PROJECT_BRIEF.md)
> for the full scope, decisions and roadmap.

## Stack

- **Next.js 16** (App Router, Cache Components) + TypeScript + Tailwind CSS 4
- **Postgres on Neon** via **Prisma 7** (`pg` driver adapter: host-agnostic)
- **Auth.js v5**: Google sign-in for admins, allowlisted by the `User` table
- **Vitest** for logic, **Playwright** for a mobile smoke test
- **GitHub Actions** CI; deployed on **Vercel Hobby**

## Getting started

Requires Node 22+.

```bash
npm install          # also generates the Prisma client
cp .env.example .env # then fill in the values
npm run db:migrate   # create tables in your database
npm run db:seed      # ministries + admin allowlist from SEED_* env vars
npm run dev          # http://localhost:3000
```

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
| `npm test` | Vitest unit tests |
| `npm run test:e2e` | Playwright smoke test (run `npx playwright install chromium` once) |
| `npm run db:migrate` | Create/apply a migration in development |
| `npm run db:deploy` | Apply migrations in production |
| `npm run db:seed` | Seed ministries and admins |
| `npm run db:studio` | Browse the database |

## Project layout

```
prisma/schema.prisma      data model (brief §7)
prisma/seed.ts            ministries + admin allowlist from env vars
src/auth.ts               Auth.js config (Google, allowlist check)
src/lib/dal.ts            requireAdmin() / requirePrayerTeam(): server-side access checks
src/lib/db.ts             Prisma client (server-only)
src/lib/time.ts           UTC <-> Asia/Manila helpers
src/lib/slug.ts           event slug generation (set once, never changed)
src/app/                  routes
e2e/                      Playwright tests
```

## Conventions

- **Time:** store UTC, display in `Asia/Manila`; admin inputs are Manila time.
- **Public queries** always exclude drafts (`publishedAt IS NULL`) and soft-deleted rows (`deletedAt IS NOT NULL`).
- **Slugs** are generated once at creation and never changed, so shared links keep working.
- **No real admin emails or private church details in the repo.** They live in env vars.
- **Privacy:** the developer has database access but commits to not reading prayer requests.

## Build order

- [ ] **1** Setup, Neon + Prisma, seed, Google sign-in with allowlist, admin event CRUD, CI, first deploy
- [ ] **2** Public agenda + event pages, weekly recurrence, multi-day, ministry filter, posters
- [ ] **3** Share cards, Copy announcement / Share, open counter, metric panel
- [ ] **4** Add to calendar (`.ics` + Google)
- [ ] **5** Printable QR pages + PNG
- [ ] **6** Pre-launch user test → start the 4-week measurement window
- [ ] **7** Prayer requests + retention/purge crons

## Success metric

Over 4 weeks: **at least 8 events shared, averaging 15+ opens each.** Results will be posted here.

## Something looks wrong?

Admins: message the builder with a screenshot and the link you were on.
