// Seeds ministries, the admin allowlist and the regular weekly services.
// Admin emails come from env vars so no real addresses live in this public repo (brief §9).
//
//   SEED_ADMIN_EMAILS="a@example.com,b@example.com"   -> admins
//   SEED_PRAYER_EMAILS="b@example.com"                -> admins who can view prayer requests
//
// Re-running is safe: everything is upserted. canViewPrayer is set from SEED_PRAYER_EMAILS on
// every run, so removing an email there revokes prayer access.
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

  const prayerEmails = new Set(parseEmailList(process.env.SEED_PRAYER_EMAILS));
  const adminEmails = new Set([...parseEmailList(process.env.SEED_ADMIN_EMAILS), ...prayerEmails]);

  if (adminEmails.size === 0) {
    console.warn("No SEED_ADMIN_EMAILS set: nobody will be able to sign in.");
  }

  for (const email of adminEmails) {
    const canViewPrayer = prayerEmails.has(email);
    await prisma.user.upsert({
      where: { email },
      update: { canViewPrayer },
      create: { email, canViewPrayer },
    });
  }
  console.log(`Admins: ${adminEmails.size} (prayer team: ${prayerEmails.size})`);

  await seedRegularServices();
}

// The church's regular weekly services (brief §6.1). Created once, published, at the church,
// Church-wide. Existing ones are left alone so admin edits (skipped weeks, new times) survive
// re-seeding. Bible study is added once its day, time and venue are confirmed (brief §12).
const REGULAR_SERVICES = [
  { slug: "sunday-service", title: "Sunday Service", weekday: 0, start: "09:00", end: "12:00" },
  { slug: "prayer-meeting", title: "Prayer Meeting", weekday: 3, start: "18:30", end: "20:00" },
];

async function seedRegularServices() {
  const creator = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!creator) {
    console.warn("No admin yet, so the regular services weren't added. Set SEED_ADMIN_EMAILS.");
    return;
  }

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
        createdById: creator.id,
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
