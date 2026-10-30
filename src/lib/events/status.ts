// An event's lifecycle (brief §6.1): draft -> published -> (cancelled).
// Any of them can be soft-deleted, which hides it everywhere but "Recently deleted".

export type EventStatus = "draft" | "published" | "cancelled" | "deleted";

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
