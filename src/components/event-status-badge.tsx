import { Badge } from "@/components/ui/badge";
import type { EventStatus } from "@/lib/events/status";

const LABELS: Record<EventStatus, string> = {
  draft: "Draft",
  published: "Published",
  cancelled: "Cancelled",
  deleted: "Deleted",
};

// Drafts are quiet (outline) because most events start as one; published uses the maroon tint;
// cancelled uses the error red so it can't be mistaken for a live event.
export function EventStatusBadge({ status }: { status: EventStatus }) {
  if (status === "published") {
    return <Badge className="bg-accent text-accent-foreground">{LABELS.published}</Badge>;
  }
  const variant = status === "draft" ? "outline" : status === "cancelled" ? "destructive" : "secondary";
  return <Badge variant={variant}>{LABELS[status]}</Badge>;
}
