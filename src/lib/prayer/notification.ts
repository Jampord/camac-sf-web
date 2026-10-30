// What the prayer team's email says (brief §6.7): ONLY "New prayer request" and a link, never the
// request, a name or a contact. Email passes through other companies' servers and sits in inboxes;
// the request itself stays behind the team's sign-in.

export const NOTIFICATION_SUBJECT = "New prayer request";

export function notificationText(inboxUrl: string): string {
  return `A new prayer request came in. Sign in to read it:\n${inboxUrl}`;
}
