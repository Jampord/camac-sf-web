# CAMAC - San Fernando Events App — Project Brief

## 1. Overview

A solo, portfolio-grade full-stack web app for **CAMAC - San Fernando** (~50+ weekly attendees, mixed ages). It gives the church one place for **events and announcements**, designed to be shared into the channels members already use — the church **Facebook page** and **Messenger group chat**.

- **Builder:** solo, ~5–10 hrs/week
- **Timeline:** no fixed deadline. §8 is a build order, not a schedule.
- **Primary goal:** a real app with real users that doubles as a strong portfolio piece

## 2. Problem & what stakeholder interviews found

**Today:** a dedicated volunteer posts announcements to the Facebook page and Messenger GC, with posters made in Canva. Major events are announced ~2 months ahead, others ~1 month ahead. The CMT decides venue use.

**What the interviews showed:**

- No remembered missed/late announcements, no repeated questions in the GC, no venue double-bookings. Announcements mostly work today.
- The announcements volunteer **would use** a single shareable link with a rich preview.
- The clearest pain in the church overall is the treasurer's **counting and totaling of the collection** (Phase 2).

**Why events is still the MVP (decided):** it is low-risk, needs no trust with financial data, has a committed first user (the announcements volunteer), and builds trust with leadership before Phase 2 tithes. Its value is **one always-current, shareable calendar** for events announced 1–2 months ahead, not fixing a broken process.

**How the volunteer will post (don't change what works):**

- **Facebook page:** keep the poster **photo post**, with the event link in the caption. (A photo post doesn't render a link preview; the caption link is what matters here.)
- **Messenger GC:** paste the **copied announcement**, which includes the link and shows the rich preview. The share card matters most here.

## 3. Success metric (MVP)

Measured over **4 weeks**, starting on a date an admin sets once admins begin using the app (after the pre-launch user test, §8 step 6):

> **At least 8 events shared, averaging 15+ opens each.**

- **Counts toward the 8:** one-off, published events with ≥1 open in the window. **Recurring series are excluded.**
- **Opens:** see §6.4 for what counts.
- **Admin home metric panel:** window start date, events shared in the window, average opens, copies and shares. Doubles as a README screenshot.

## 4. Users & access

| User                                                                                  | Logs in?                                  | Can do                                                                                                             |
| ------------------------------------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Member / visitor                                                                      | **No**                                    | View public calendar & event pages, share/copy announcements, add events to their calendar, submit prayer requests |
| Admin (2–4 people — at least the announcements volunteer, plus e.g. pastor/secretary) | **Yes** — Google sign-in, email allowlist | Create/edit/publish/cancel/delete events, see open counts                                                          |
| Admin with `canViewPrayer` (prayer team)                                              | **Yes**                                   | All admin actions + read/manage prayer requests                                                                    |

- Single role (`admin`) in the MVP. Ministry-head accounts are Phase 2.
- Only emails already in the `User` table can sign in (the table _is_ the allowlist).
- **Admins and `canViewPrayer` are set by seed script / DB only — no UI** for managing them. Prayer access is granted by the developer at the pastor's request, so no admin can grant it to themselves.
- **Disclosure to leadership:** the developer has database access; commit to not reading prayer data.

## 5. Tech stack

- **Framework:** Next.js (App Router) + TypeScript
- **Database:** Postgres on **Neon** (free tier)
- **ORM:** **Prisma**
- **Auth:** Auth.js (NextAuth) — Google provider, allowlist check in `signIn` callback
- **Hosting:** Vercel **Hobby** (free), `*.vercel.app` domain first; church domain later. **Keep the code host-agnostic** — avoid Vercel-only APIs where reasonable, so moving hosts stays cheap (see §5.1).
- **Image storage:** **Cloudinary** (free tier) for posters — host-independent, resizes/crops by URL for thumbnails and share cards. Uploads capped at **~5 MB, JPG/PNG/WebP**, admin-only signed uploads.
- **Scheduled jobs:** Vercel Cron (prayer request retention, soft-delete purge, rate-limit cleanup)
- **Share images:** Next.js `ImageResponse` / `opengraph-image` routes
- **QR codes:** a QR library (e.g. `qrcode`) rendered server-side
- **Email (prayer notifications):** **Gmail SMTP with an app password from a dedicated Gmail account** (not a personal inbox). ⏰ **When the church gets a domain, switch to a proper transactional email provider with a verified domain.**
- **Error tracking:** a free error-tracking tier on server routes (share card, view beacon, prayer form).
- **UI language:** English. Announcement content is written by admins in whatever language they use (often Taglish).
- **Time zone:** store UTC, display in `Asia/Manila`. Admin date/time inputs are interpreted as Manila time.
- **Accounts:** Vercel, Neon, Google OAuth client, Cloudinary and Gmail are under the builder's personal accounts.

### 5.1 Hosting terms (checked Oct 2026)

- Vercel Hobby is limited to **non-commercial personal use**. The MVP (volunteer-built, no money involved) fits.
- Vercel's current fair-use page lists **asking for donations as commercial use** (an earlier version said the opposite). The Phase 2 **giving QR** would fall under this.
- **Before building any giving feature:** email Vercel support for a written answer. If they don't clearly approve, **drop the giving QR**, or move hosting first.
- Vercel may remove Hobby deployments without notice — another reason to stay host-agnostic.

## 6. MVP features

### 6.1 Events

- Fields: title, description, start/end date-time, **all-day flag**, **venue (free text — church, homes, outreach locations, resorts)**, ministry tag, optional poster image, optional **contact person**, optional **attire** (e.g. for Culmination Sunday).
- **Drafts:** events are unpublished until an admin publishes (`publishedAt`). Unpublished events don't appear publicly; their link returns 404.
- **All-day & multi-day:** multi-day events (e.g. a Fri–Sun retreat) appear on every day they span, labeled "Day 1 of 3"; share card and announcement show a date range ("Nov 14–16").
- **"At the church venue"** checkbox, shown as a badge on the calendar. **No overlap warning** (no clashes have happened; the CMT decides venue use).
- **Ministry:** optional. **No ministry = "Church-wide"**, labeled as such and shown under every ministry filter.
- **Recurrence:** none or **weekly** (with optional end date). No custom rules.
  - **Skip dates:** admins can cancel single occurrences (e.g. prayer meeting during Holy Week). Special services are created as separate one-off events. No per-occurrence overrides.
  - Seed recurring events: **Sunday service, prayer meeting, Bible study**.
- **Ministries (seed data):** Youth, Women, Men, Music, Sunday School, Church Ministry Team (CMT).
- **Cancel ≠ delete.**
  - **Cancel** (`cancelledAt`): the page stays live with a clear **"Cancelled"** banner and an optional note (e.g. "Moved to Nov 22"). For events that were already shared.
  - **Delete = soft delete**, for mistakes and duplicates. Restorable for 30 days, then purged by cron.
- **Slugs:** generated **once at creation** as title + month/year (`youth-camp-2027-04`), numeric suffix on collision, **never changed on edit** so shared links don't break.

### 6.2 Public calendar & event pages

- No login. Mobile-first, readable for older members (large text, high contrast, simple navigation).
- **Agenda list** (no month grid in the MVP), large dates, one event per row, in three parts:
  - **This week** (next 7 days): everything, weekly services as one compact line each. What's on right now is a filled maroon row ("Happening now, until 12:00 PM"); anything starting within 3 hours says so ("Starts in 2 hours").
  - **Every week:** each weekly service once with its pattern, plus skipped weeks **at least 3 months ahead** ("Not on Sun, Nov 22").
  - **By month:** special (one-off) events only, so they aren't buried under weekly services.
- **Ministry filter:** one dropdown (the phone's own picker), not chips: chips filled the first screen. Church-wide events show under every filter.
- **Loading:** pages stream behind calendar-shaped placeholders; a tapped row or link shows a spinner if its page is slow; busy buttons show a spinner.
- Shows **from today forward**; a **"Past events"** list is one tap away (future home of the Phase 3 Facebook photos link).
- Event page: details, poster (if any), contact person, attire, Share / Copy announcement, add-to-calendar, link to the printable QR page.
- **After an event ends:** the page stays, with a **"This event has ended"** banner and no add-to-calendar button.
- **Recurring series:** page shows the pattern ("Every Sunday · 9:00 AM") and the next occurrence below it.

### 6.3 Share cards _(the "new skill" piece)_

- Every event URL renders a **rich link preview** (Open Graph image) when pasted into Messenger or Facebook.
- **Always a generated 1200×630 card** (Canva posters are usually portrait and would be cropped):
  - With poster → poster on one side, title/date/time/venue on the other.
  - Without poster → **CAMAC - San Fernando branded card** (church logo + brand colors from the volunteer's Canva) with title/date/time/venue.
  - Recurring series → shows the pattern ("Every Sunday · 9:00 AM · Church"), never a specific next date (previews are cached).
  - Cancelled events → card shows "Cancelled".
- **Stale previews:** the image URL is versioned by `updatedAt` (`?v=…`) so edits produce a new image. The admin edit page has a "Refresh preview" note linking to Facebook's Sharing Debugger for links already posted.
- **"Copy announcement"** button: ready-to-paste text built from **the volunteer's current post format** (decided from her recent posts: plain prose, no emoji; the poster normally carries venue and details, so the copied text adds them as plain labeled lines for Messenger, where there is no poster):

  ```
  Join us for {title} on {Sunday, August 30, 2026} at {9:00 AM}.

  Venue: {venue}
  Attire: {attire}            (only if set)
  Contact: {contactPerson}    (only if set)

  {description}

  Details and add to calendar: {link}
  ```

  - All-day → no time ("on Sunday, August 30, 2026."). Weekly → the pattern ("every Wednesday at 6:30 PM."), never a specific date.
  - The weekday is included even though her posts omit it (helps older members).
  - Field labels in English; her Taglish description passes through unchanged.
- **"Share"** button: opens the phone's system share sheet (Web Share API) where supported; "Copy announcement" is always shown alongside it.

### 6.4 Open counter

- **Opens** are logged by a small **client-side beacon** after the page loads (crawlers don't run JS). Known bot user-agents (e.g. Facebook/Messenger crawlers) are ignored as a backstop. **Signed-in admins are not counted.** No deduping.
- **Copy** and **Share** clicks are logged as separate stat types.
- **No cookies, no personal data.**
- Admins see per-event counts (e.g. "Opened 34 times · Copied 6 · Shared 4") plus the metric panel (§3).

### 6.5 Add to calendar

- "Add to Google Calendar" link + downloadable `.ics` file per event.
- **Recurring events add the whole series** from the next date (not past weeks) in both the `.ics` and the Google link. Skip dates are excluded in the `.ics` (`EXDATE`); Google's add-event link only documents `RRULE`, so its series includes skipped weeks (the event page still lists them as "Not on …").
- Hidden once the event has ended or is cancelled. The `.ics` UID is the slug, so re-adding updates the event instead of duplicating it.

### 6.6 QR codes

- **Print-ready page** per event and for the prayer request form: title, date, large QR, short URL underneath, sized for **half an A4** (bulletins, church door).
- Plus a **plain PNG download** for projector slides.

### 6.7 Prayer requests

- **Public form, no login.** Fields: request (required), name (optional — anonymous allowed), contact for follow-up (optional, "if you'd like someone to reach out"), "OK to share with the congregation" checkbox (**default off**; stored for a future public wall, not used in MVP).
- **Privacy notice** (Data Privacy Act, RA 10173 — standard practice, not legal advice): a two-line notice above Submit (who sees it, auto-deleted after a year, how to ask for removal) plus a short **/privacy** page naming a church contact.
- **Spam protection:** hidden honeypot field + a **loose per-IP rate limit (~10 submissions/hour)** — several people may submit from the same church Wi-Fi. Stores a salted hash of the IP, deleted within 24h. Blocked users see a kind message ("Please try again in a few minutes"). **No CAPTCHA.**
- **Notifications:** each new request emails the `canViewPrayer` admins with **only "New prayer request" and a link** — never the request text, name or contact.
- **Visibility:** only admins with `canViewPrayer`.
- **Status:** `NEW → PRAYED → ANSWERED`, updated by the prayer team.
- **Retention (daily cron):** auto-archive after **60 days**; auto-delete after **1 year** unless marked `keepAsTestimony`.

## 7. Data model sketch

```prisma
enum Role        { ADMIN }
enum Recurrence  { NONE WEEKLY }
enum StatType    { VIEW COPY SHARE }
enum PrayerStatus{ NEW PRAYED ANSWERED }

model User {
  id            String   @id @default(cuid())
  email         String   @unique   // allowlist; set by seed script only
  name          String?
  role          Role     @default(ADMIN)
  canViewPrayer Boolean  @default(false)   // seed/DB only, no UI
  createdAt     DateTime @default(now())
  events        Event[]
}

model Ministry {
  id     String  @id @default(cuid())
  name   String  @unique   // Youth, Women, Men, Music, Sunday School, CMT
  events Event[]
}

model Event {
  id              String     @id @default(cuid())
  slug            String     @unique              // set once at creation, never changed
  title           String
  description     String?
  startsAt        DateTime
  endsAt          DateTime
  allDay          Boolean    @default(false)
  venue           String                          // free text: church, home, outreach, resort
  atChurchVenue   Boolean    @default(false)
  contactPerson   String?
  attire          String?
  posterUrl       String?                         // Cloudinary
  recurrence      Recurrence @default(NONE)
  recurrenceUntil DateTime?
  skipDates       DateTime[]                      // cancelled weekly occurrences
  ministryId      String?                         // null = Church-wide
  ministry        Ministry?  @relation(fields: [ministryId], references: [id])
  createdById     String
  createdBy       User       @relation(fields: [createdById], references: [id])
  stats           EventStat[]
  publishedAt     DateTime?                       // null = draft
  cancelledAt     DateTime?                       // page stays, "Cancelled" banner
  cancelNote      String?                         // e.g. "Moved to Nov 22"
  deletedAt       DateTime?                       // soft delete; purge after 30 days
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt           // also versions the share image URL
  // Phase 3: photosUrl String?  (link to the Facebook album)
}

model EventStat {
  id        String   @id @default(cuid())
  eventId   String
  event     Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  type      StatType
  createdAt DateTime @default(now())
  @@index([eventId, type, createdAt])
}

model PrayerRequest {
  id              String       @id @default(cuid())
  body            String
  name            String?
  contact         String?
  shareConsent    Boolean      @default(false)
  status          PrayerStatus @default(NEW)
  keepAsTestimony Boolean      @default(false)
  archivedAt      DateTime?
  createdAt       DateTime     @default(now())
}

model RateLimitHit {
  id        String   @id @default(cuid())
  ipHash    String
  route     String
  createdAt DateTime @default(now())
  @@index([ipHash, route, createdAt])
}

model Setting {
  key   String @id     // e.g. "metricWindowStart"
  value String
}
```

**Implementation notes**

- Weekly events are stored as one row; occurrences are expanded at query time for the requested date range, minus `skipDates`. Share links point to the series.
- All public queries filter out `deletedAt IS NOT NULL` and `publishedAt IS NULL`. Cancelled events stay visible with a banner. Admins get a "Recently deleted" view with restore.

## 8. Build order

No deadline — work top to bottom. If time gets tight, the metric-critical items in step 3 come first.

| Step  | Deliverable                                                                                                                                                                                                                                                                                     |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1** | Project setup, Neon + Prisma, seed ministries & admins (emails from env vars), Auth.js Google sign-in with allowlist, admin event create/edit/publish/cancel/soft-delete, CI, first deploy to Vercel                                                                                            |
| **2** | Public agenda list & event pages (mobile-first, 3+ months ahead, past events list, ended/cancelled banners), weekly recurrence + skip dates + seeded recurring events, all-day/multi-day, ministry filter with Church-wide, Cloudinary poster upload, contact person & attire                   |
| **3** | **Metric-critical:** share cards (generated 1200×630, versioned URL), Copy announcement + Share button, open counter (beacon, bot/admin exclusion), admin metric panel                                                                                                                          |
| **4** | Add to calendar (`.ics` + Google, series-aware)                                                                                                                                                                                                                                                 |
| **5** | Printable QR pages + PNG download                                                                                                                                                                                                                                                               |
| **6** | **Pre-launch user test:** the announcements volunteer and two older members try it on their own phones — find next Sunday's event, open an event from a pasted link, add it to their calendar. Fix what trips them up. **Then admins start using it and the 4-week measurement window begins.** |
| **7** | Prayer requests: form + privacy notice + /privacy page, honeypot + rate limit, prayer-team inbox, status workflow, email notifications, retention cron; soft-delete purge cron                                                                                                                  |

## 9. Engineering & portfolio

- **Public repo.** No real admin emails or private church details in code — seed values come from env vars.
- **Tests:** Vitest on the tricky logic (recurrence expansion + skip dates, Manila time handling, announcement text, slug generation, metric calculation); one Playwright smoke test of the main public flow.
- **CI:** GitHub Actions on push (typecheck, lint, tests).
- **Monitoring:** free error tracking on server routes, plus a short "What to do if something looks wrong" note for admins (message the builder).
- **README:** screenshots (share card in Messenger, agenda list, metric panel) and the actual success-metric results.

## 10. Roadmap

### Phase 2 — Admin tools

**Tithes & offerings** — what the treasurer/secretary told us:

- Recorded today in a **logbook + Excel**; the Excel file is stored in a **Messenger chat** (a risk in itself).
- Records are kept **per service as totals / envelope numbers**. **Per-person giving is strictly confidential.**
- Giving is a **mix** of cash, GCash/Maya and bank transfer.
- Reports: **monthly summary to the board (CMT)**; **yearly report to the denomination**. Pastors and the board see the records.
- Mistakes are fixed **manually**. ~3 years of records exist.
- **Biggest pain: counting and totaling the collection.**
- Willing to do a **parallel run** alongside the logbook, with **data backups**.

Candidate scope (to decide with the treasurer before Phase 2 starts):

- Per-service count sheet: cash by bill/coin denomination + GCash/Maya/bank entries
- Totals by category (tithes, offerings, special giving)
- Envelope numbers stored **without names**
- Monthly CMT summary and yearly denomination report
- Excel export + automatic backups; correction history instead of overwriting

> ⚠️ Check hosting terms (§5.1) before starting Phase 2.

**Ministry-head accounts:** ministry heads post events for their own ministry **directly, no review**, and can delete them (soft delete, so mistakes are recoverable).

**Also:** "This week at church" digest page + share card. **Giving QR (display only) — only if Vercel support confirms in writing that it's allowed on Hobby (§5.1); otherwise dropped or deferred until hosting moves.**

### Phase 3 — Content & serving

- **Sermon archive** — sermons are already recorded and posted on **YouTube**. A volunteer admin pastes the YouTube link and enters **title, speaker, Bible passage, series name**; the page embeds the video. (Automatic playlist import is a possible later upgrade.)
- **Past events photos** — no separate gallery. A dedicated member already posts photos to the Facebook page, so past events get a **"Photos" link to the Facebook album** (`photosUrl` field), shown in the Past events list.
- **Serving roster** — roles: Music, ushers, Sunday School teachers/assistants, prayer meeting in-charge, Sunday service schedule, post-service cleanup, setup/restoration, dishwashers. Today: a list exists; swaps happen by reaching out to whoever is available; reminders go out at Sunday service and on Messenger; **last-minute swaps** are the main issue. Introduces a **names-only `Person`** table.

### Phase 4 — People

- **Birthday & anniversary greetings**
  - Source: a **notebook** of names and birthdays kept by the person who records attendance. **One-time import**, then occasional admin updates.
  - Birthdays: month & day; **birth year optional**.
  - Anniversaries: **two names + date**.
  - Output: a weekly **"Celebrants this week"** share card (today celebrants are announced on Sunday and posted on the page).
  - Members are aware birthdays are posted; anyone can ask to be left off.
- **Public prayer wall** (uses the `shareConsent` already collected), **push/SMS reminders**.

### Explicitly not planned (for now)

Facebook auto-posting via Graph API, RSVP, booking request/approval flow, venue overlap checks, a separate photo gallery, a month-grid calendar, per-occurrence overrides for recurring events, Tagalog UI, attendance tracking, member directory.

## 11. Leadership sign-off

- ✅ **Approved** by church leadership to build and run the app.
- ✅ **Admins:** 2–4 people; all have Google accounts → Google sign-in only, no magic-link fallback needed for now.
- ✅ **Prayer requests:** leadership is comfortable storing them; visible only to the church's **prayer team** (`canViewPrayer`).
- ✅ **Hosting:** free hosting OK. The church has **no domain** yet → launch on `*.vercel.app`.
- ☐ **Tell leadership** the developer has database access to prayer requests, and commits to not reading them (§4).

## 12. Before building

- [ ] Admin emails for the allowlist and the prayer-team members.
- [ ] CAMAC - San Fernando **logo file and brand colors** (from the volunteer's Canva).
- [x] **2–3 recent announcement posts** from the volunteer, to base the copy-announcement template on.
- [ ] Day, time and venue for **Sunday service, prayer meeting and Bible study** (seed data).
- [ ] A dedicated Gmail account + app password for notifications.
- [ ] Email Vercel support about the giving QR (needed before Phase 2, not before the MVP).
- [ ] Church contact name for the /privacy page.
