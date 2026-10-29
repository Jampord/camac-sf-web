// Admin-facing lifecycle of an event (brief §6.1):
//   draft -> published -> (cancelled)      and any of them -> deleted (soft, restorable 30 days)

export type EventStatus = "draft" | "published" | "cancelled" | "deleted";

export const PURGE_AFTER_DAYS = 30;

type Lifecycle = {
  publishedAt: Date | null;
  cancelledAt: Date | null;
  deletedAt: Date | null;
};

export function eventStatus(event: Lifecycle): EventStatus {
  if (event.deletedAt) return "deleted";
  if (!event.publishedAt) return "draft";
  if (event.cancelledAt) return "cancelled";
  return "published";
}

/** When the purge cron will permanently remove a soft-deleted event. */
export function purgeDate(deletedAt: Date): Date {
  return new Date(deletedAt.getTime() + PURGE_AFTER_DAYS * 24 * 60 * 60 * 1000);
}
