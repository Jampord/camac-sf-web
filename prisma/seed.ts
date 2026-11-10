// Seeds ministries, the first people manager and the regular weekly services.
// The email comes from an env var so no real address lives in this public repo (brief §9).
//
//   SEED_OWNER_EMAIL="you@example.com"   -> the first admin who can manage people
//
// Everyone else is added on /admin/people, which is the source of truth for accounts. So the
// seed only touches accounts while nobody can manage people (a fresh database); after that it
// leaves them alone, and re-running it is safe.
import "dotenv/config";
import { createPrismaClient } from "../src/lib/prisma";
import { parseEmailList } from "../src/lib/emails";
import { manilaInputToUtc, utcToManilaInput } from "../src/lib/time";

const MINISTRIES = ["Youth", "Women", "Men", "Music", "Sunday School", "Church Ministry Team (CMT)"];

const prisma = createPrismaClient();

async function main() {
  for (const name of MINISTRIES) {
    await prisma.ministry.upsert({ where: { name }, update: {}, create: { name } });
  }
  console.log(`Ministries: ${MINISTRIES.length}`);

  await seedFirstPeopleManager();
  await seedRegularServices();
}

async function seedFirstPeopleManager() {
  if (process.env.SEED_ADMIN_EMAILS || process.env.SEED_PRAYER_EMAILS) {
    console.warn("SEED_ADMIN_EMAILS and SEED_PRAYER_EMAILS are no longer read: use /admin/people.");
  }

  if (await prisma.user.findFirst({ where: { canManagePeople: true } })) {
    console.log("People: managed on /admin/people, so accounts were left alone.");
    return;
  }

  const emails = parseEmailList(process.env.SEED_OWNER_EMAIL);
  if (emails.length !== 1) {
    console.warn("Nobody can manage people yet. Set SEED_OWNER_EMAIL to one email and re-run.");
    return;
  }

  // Prayer access isn't part of this: whoever maintains the site doesn't read prayer requests
  // (brief §4). An existing account keeps the prayer access it has.
  const [email] = emails;
  await prisma.user.upsert({
    where: { email },
    update: { role: "ADMIN", canManagePeople: true },
    create: { email, role: "ADMIN", canManagePeople: true },
  });
  console.log("People: added the first people manager from SEED_OWNER_EMAIL.");
}

// The church's regular weekly services (brief §6.1). Created once, published, at the church,
// Church-wide. Existing ones are left alone so admin edits (skipped weeks, new times) survive
// re-seeding. Bible study is added once its day, time and venue are confirmed (brief §12).
const REGULAR_SERVICES = [
  { slug: "sunday-service", title: "Sunday Service", weekday: 0, start: "09:00", end: "12:00" },
  { slug: "prayer-meeting", title: "Prayer Meeting", weekday: 3, start: "18:30", end: "20:00" },
];

async function seedRegularServices() {
  // The creator is only a record (never shown), so the services don't wait for an admin.
  const creator = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  let created = 0;
  for (const service of REGULAR_SERVICES) {
    if (await prisma.event.findUnique({ where: { slug: service.slug } })) continue;

    const date = nextManilaWeekday(service.weekday);
    await prisma.event.create({
      data: {
        slug: service.slug,
        title: service.title,
        startsAt: manilaInputToUtc(`${date}T${service.start}`),
        endsAt: manilaInputToUtc(`${date}T${service.end}`),
        recurrence: "WEEKLY",
        venue: "Church",
        atChurchVenue: true,
        publishedAt: new Date(),
        createdById: creator?.id ?? null,
      },
    });
    created++;
  }
  console.log(`Regular services: ${REGULAR_SERVICES.length} (${created} new)`);
}

/** Today's Manila date if it's that weekday, else the next one, as "YYYY-MM-DD". */
function nextManilaWeekday(weekday: number): string {
  const today = utcToManilaInput(new Date()).slice(0, 10);
  const date = new Date(`${today}T00:00:00Z`); // read as a plain calendar date
  date.setUTCDate(date.getUTCDate() + ((weekday - date.getUTCDay() + 7) % 7));
  return date.toISOString().slice(0, 10);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
