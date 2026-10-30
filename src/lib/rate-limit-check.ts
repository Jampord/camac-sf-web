import "server-only";
import { db } from "@/lib/db";
import { hashIp } from "./rate-limit";

const HOUR_MS = 60 * 60 * 1000;

/**
 * Records this attempt and says whether it's over the limit. Blocked attempts aren't recorded,
 * so someone who waits gets back in as the older ones age out. Two requests at the same moment
 * could both slip through; for a loose limit like this, that's fine.
 */
export async function isRateLimited(ip: string, route: string, limitPerHour: number) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");

  const ipHash = hashIp(ip, secret);
  const recent = await db.rateLimitHit.count({
    where: { ipHash, route, createdAt: { gte: new Date(Date.now() - HOUR_MS) } },
  });
  if (recent >= limitPerHour) return true;

  await db.rateLimitHit.create({ data: { ipHash, route } });
  return false;
}
