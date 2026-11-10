import "server-only";
import * as Sentry from "@sentry/nextjs";
import nodemailer from "nodemailer";
import { db } from "@/lib/db";
import { NOTIFICATION_SUBJECT, notificationText } from "./notification";
import { TEAM_CHANGE_SUBJECT, teamChangeText } from "./team-change";

// Emails to the prayer team: a request came in (brief §6.7, see ./notification), or someone joined
// the team (brief §4, see ./team-change). Neither ever contains a request.

/** Never throws: a request that was saved must not look failed because an email didn't send. */
export function notifyPrayerTeam(inboxUrl: string): Promise<void> {
  return emailPrayerTeam("Prayer notification", NOTIFICATION_SUBJECT, notificationText(inboxUrl));
}

/** Never throws: the access change is saved either way. The newcomer gets it too. */
export function notifyPrayerTeamChange(newcomer: string, addedBy: string, inboxUrl: string): Promise<void> {
  return emailPrayerTeam("Prayer team change email", TEAM_CHANGE_SUBJECT, teamChangeText(newcomer, addedBy, inboxUrl));
}

async function emailPrayerTeam(what: string, subject: string, text: string): Promise<void> {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_APP_PASSWORD;
  if (!user || !pass) {
    console.warn(`${what} skipped: SMTP_USER / SMTP_APP_PASSWORD not set.`);
    return;
  }

  try {
    const team = await db.user.findMany({
      where: { role: "ADMIN", canViewPrayer: true },
      select: { email: true },
    });
    if (team.length === 0) return;

    await nodemailer.createTransport({ service: "gmail", auth: { user, pass } }).sendMail({
      from: `CAMAC San Fernando <${user}>`,
      to: user,
      bcc: team.map((member) => member.email), // the team needn't see each other's addresses
      subject,
      text,
    });
  } catch (error) {
    // Only the error's name: its message could include addresses.
    const name = error instanceof Error ? error.name : "unknown";
    console.error(`${what} failed:`, name);
    // Caught here, so Next.js won't report it. Flushed because the server may stop after this.
    Sentry.captureMessage(`${what} failed: ${name}`, "error");
    await Sentry.flush(2000);
  }
}
