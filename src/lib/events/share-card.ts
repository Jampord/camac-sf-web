// Share card links (brief §6.3). The `v` is the event's updatedAt, so every edit gives the card a
// new URL and Facebook/Messenger fetch a fresh image instead of reusing their cached one.

export const SHARE_CARD_SIZE = { width: 1200, height: 630 };

export function shareCardVersion(updatedAt: Date): string {
  return String(updatedAt.getTime());
}

export function shareCardPath(slug: string, updatedAt: Date): string {
  return `/events/${slug}/card?v=${shareCardVersion(updatedAt)}`;
}
