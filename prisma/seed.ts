// Seeds ministries and the admin allowlist.
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

  // TODO (build step 2): seed recurring Sunday service, prayer meeting and Bible study
  // once their day/time/venue are confirmed (brief §12).
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
