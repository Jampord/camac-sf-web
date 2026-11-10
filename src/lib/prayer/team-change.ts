// The email the prayer team gets when someone joins it (brief §4): a safeguard, so nobody gains
// access to prayer requests without the team knowing. It names who joined and who added them,
// and never includes a request.

export const TEAM_CHANGE_SUBJECT = "Someone joined the prayer team";

export function teamChangeText(newcomer: string, addedBy: string, inboxUrl: string): string {
  return [
    `${newcomer} was added to the prayer team by ${addedBy}, so they can now read prayer requests.`,
    "If you didn't expect this, please tell the pastor.",
    `The prayer inbox:\n${inboxUrl}`,
  ].join("\n\n");
}
