import "server-only";
import * as Sentry from "@sentry/nextjs";
import nodemailer from "nodemailer";
import { db } from "@/lib/db";
import { NOTIFICATION_SUBJECT, notificationText } from "./notification";

// Tells the prayer team a request came in (brief §6.7). See ./notification for what it says.

/** Never throws: a request that was saved must not look failed because an email didn't send. */
export async function notifyPrayerTeam(inboxUrl: string): Promise<void> {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_APP_PASSWORD;
  if (!user || !pass) {
    console.warn("Prayer notification skipped: SMTP_USER / SMTP_APP_PASSWORD not set.");
    return;
  }

  try {
    const team = await db.user.findMany({ where: { canViewPrayer: true }, select: { email: true } });
    if (team.length === 0) return;

    await nodemailer.createTransport({ service: "gmail", auth: { user, pass } }).sendMail({
      from: `CAMAC San Fernando <${user}>`,
      to: user,
      bcc: team.map((member) => member.email), // the team needn't see each other's addresses
      subject: NOTIFICATION_SUBJECT,
      text: notificationText(inboxUrl),
    });
  } catch (error) {
    // Only the error's name: its message could include addresses.
    const name = error instanceof Error ? error.name : "unknown";
    console.error("Prayer notification failed:", name);
    // Caught here, so Next.js won't report it. Flushed because the server may stop after this.
    Sentry.captureMessage(`Prayer notification failed: ${name}`, "error");
    await Sentry.flush(2000);
  }
}
