// The prayer team's workflow (brief §6.7): NEW -> PRAYED -> ANSWERED, with a way back for a
// mistaken tap.

export type PrayerStatus = "NEW" | "PRAYED" | "ANSWERED";

export const STATUS_LABELS: Record<PrayerStatus, string> = {
  NEW: "New",
  PRAYED: "Prayed",
  ANSWERED: "Answered",
};

export function isPrayerStatus(value: unknown): value is PrayerStatus {
  return value === "NEW" || value === "PRAYED" || value === "ANSWERED";
}

export function statusMoves(status: PrayerStatus): { to: PrayerStatus; label: string }[] {
  if (status === "NEW") return [{ to: "PRAYED", label: "Mark as prayed" }];
  if (status === "PRAYED") {
    return [
      { to: "ANSWERED", label: "Mark as answered" },
      { to: "NEW", label: "Back to new" },
    ];
  }
  return [{ to: "PRAYED", label: "Back to prayed" }];
}

const ORDER: Record<PrayerStatus, number> = { NEW: 0, PRAYED: 1, ANSWERED: 2 };

/** What still needs prayer comes first; newest first within each status. */
export function sortForInbox<T extends { status: PrayerStatus; createdAt: Date }>(requests: T[]): T[] {
  return [...requests].sort(
    (a, b) => ORDER[a.status] - ORDER[b.status] || b.createdAt.getTime() - a.createdAt.getTime(),
  );
}
