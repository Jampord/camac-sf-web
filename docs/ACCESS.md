# Managing who can sign in

How to add, change and remove people, locally and in production. The `User` table is the
allowlist (brief §4): only emails in it can sign in, and their access decides what they see. It's
managed on the **People** page (`/admin/people`). The seed only creates the first people manager
on a fresh database. All emails below are placeholders. Never commit real ones; they live only in
`.env` and the database.

## Access levels

| Access | `role` | `canViewPrayer` | Can do |
|---|---|---|---|
| Member | `MEMBER` | `false` | See the serving schedule (`/schedule`), copy a week for Messenger |
| Admin | `ADMIN` | `false` | Everything in `/admin` except prayer requests, plus add/remove members |
| Admin + prayer team | `ADMIN` | `true` | Everything, including the prayer inbox |

**Can manage people** (`canManagePeople`) is a separate permission on admins, kept apart from
prayer access: whoever maintains the site can manage people without reading prayer requests.

| What | Who can do it |
|---|---|
| Add, rename or remove a member | Any admin |
| Add, change or remove an admin or prayer-team admin, or give "Can manage people" | People managers |
| Change or remove yourself | Nobody: ask another people manager |

The last people manager can't be demoted or removed. When someone joins the prayer team, the
whole team (the newcomer too) gets an email naming who joined and who added them.

## Environments

| | Local | Production |
|---|---|---|
| Database | Neon `dev` branch (your `.env`) | Neon `main` branch |
| Site | http://localhost:3000 | https://camac-sf-web.vercel.app |
| People page | http://localhost:3000/admin/people | https://camac-sf-web.vercel.app/admin/people |
| First people manager | `npm run db:seed` with `.env` | `npm run db:seed` with production URLs set in the terminal (below) |

Pushing or deploying never changes who can sign in. The People page and the seed write straight to
the database, and a change applies on the person's next page load. Sessions aren't ended: someone
removed mid-way through a page is sent away on their next tap or save.

## The first people manager (once per database)

`npm run db:seed` reads one variable:

```
SEED_OWNER_EMAIL="you@gmail.com"
```

- If **nobody** in the database can manage people, it makes that email an admin who can (adding
  the account if needed). It doesn't give prayer access; an existing account keeps what it has.
- If someone already can, it leaves every account alone and says so.
- Re-running is always safe: ministries and the weekly services are left as they are (`0 new`).
- `SEED_ADMIN_EMAILS` and `SEED_PRAYER_EMAILS` are no longer read. The seed warns if they're set.

### Locally

1. Put `SEED_OWNER_EMAIL` in `.env`.
2. Run `npm run db:seed`.
3. Sign in at http://localhost:3000/admin/sign-in. The local Google OAuth client only accepts
   port 3000.

### In production

After the `manage_people` migration is deployed (Vercel applies migrations on build), run the
seed once. Don't edit `.env`: set the production values in a PowerShell window just for this run.
Variables already set in the shell win over `.env` (dotenv doesn't override them), and they
disappear when the window closes:

```powershell
$env:DATABASE_URL = "<production pooled URL from Vercel or Neon>"
$env:DIRECT_URL = "<production direct URL>"
$env:SEED_OWNER_EMAIL = "you@gmail.com"
npm run db:seed
```

Then close that window. Check the output:

```
People: added the first people manager from SEED_OWNER_EMAIL.
Regular services: 2 (0 new)
```

If it says `2 new`, it ran against an empty database, not production. Check the URLs.

## Add, change or remove someone

1. Sign in and open **People** in the admin menu.
2. **Add:** their Google email, optionally a name, and (people managers) what they can do.
3. **Change:** the person's **Change** button edits their name and access. The dialog says what
   will change before you save. The email can't be edited: remove them and add the new address.
4. **Remove:** they can no longer sign in. Events an admin created stay, with no creator recorded.

Members sign in on the same sign-in page and land on `/schedule`. If Google blocks someone before
they reach the site, the production OAuth app is still in "Testing" (Google Cloud console → OAuth
consent screen): publish it to "In production".

Before adding real members in production:

- Leadership and the people being added have been told, and `/privacy` covers them (brief §6.8).
- The production OAuth app is "In production".

## If nobody can manage people any more

The page prevents it, but it can happen outside the page (for example, someone edits the database
by hand). Run the seed again with `SEED_OWNER_EMAIL`, as above: with no people manager left, it
makes that email one again.

If the only manager's Google account is lost, a manager still exists, so the seed leaves it alone.
Give the permission to another account in the Neon console → the branch → SQL Editor (emails are
stored lowercase), then remove the lost account on the People page:

```sql
UPDATE "User" SET role = 'ADMIN', "canManagePeople" = true WHERE email = 'you@gmail.com';
```

## Check who has access

The People page lists everyone. Or, in the Neon SQL Editor on the branch you care about:

```sql
SELECT email, name, role, "canViewPrayer", "canManagePeople", "createdAt"
FROM "User"
ORDER BY role, "createdAt";
```
