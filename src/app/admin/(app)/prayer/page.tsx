import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { InlinePending } from "@/components/link-pending";
import { Badge } from "@/components/ui/badge";
import { requirePrayerTeam } from "@/lib/dal";
import { db } from "@/lib/db";
import { STATUS_LABELS, sortForInbox, type PrayerStatus } from "@/lib/prayer/status";
import { formatManila } from "@/lib/time";
import { cn } from "@/lib/utils";
import { RequestActions } from "./request-actions";

export const metadata: Metadata = { title: "Prayer requests" };

// The prayer team's inbox (brief §6.7). Only admins with canViewPrayer get in; others are sent to
// the admin home. Prayer data is read fresh on every visit and is never put in a cache.

export default function PrayerInboxPage({ searchParams }: PageProps<"/admin/prayer">) {
  return (
    <>
      <h1 className="font-heading text-3xl font-bold tracking-tight">Prayer requests</h1>
      <Suspense fallback={<RequestsSkeleton />}>
        {searchParams.then(({ view }) => (
          <Inbox archived={view === "archived"} />
        ))}
      </Suspense>
    </>
  );
}

async function Inbox({ archived }: { archived: boolean }) {
  // Check access before touching the database.
  await requirePrayerTeam();
  const [requests, archivedCount, currentCount] = await Promise.all([
    db.prayerRequest.findMany({ where: { archivedAt: archived ? { not: null } : null } }),
    db.prayerRequest.count({ where: { archivedAt: { not: null } } }),
    db.prayerRequest.count({ where: { archivedAt: null } }),
  ]);

  return (
    <>
      <nav aria-label="Prayer request lists" className="flex gap-2">
        <Tab href="/admin/prayer" active={!archived} label={`Current (${currentCount})`} />
        <Tab href="/admin/prayer?view=archived" active={archived} label={`Archived (${archivedCount})`} />
      </nav>

      {requests.length > 0 ? (
        <ul className="flex flex-col gap-4">
          {sortForInbox(requests).map((request) => (
            <li key={request.id}>
              <RequestCard request={request} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-lg border border-dashed p-6 text-muted-foreground">
          {archived
            ? "Nothing archived. Requests move here after 60 days."
            : "No prayer requests right now. New ones appear here."}
        </p>
      )}

      <p className="text-sm text-muted-foreground">
        Requests are archived after 60 days and deleted after one year, unless kept as a testimony.
      </p>
    </>
  );
}

function Tab({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-11 items-center gap-2 rounded-lg border px-4 font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        active ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
      )}
    >
      {label}
      <InlinePending />
    </Link>
  );
}

function RequestCard({
  request,
}: {
  request: {
    id: string;
    body: string;
    name: string | null;
    contact: string | null;
    shareConsent: boolean;
    status: PrayerStatus;
    keepAsTestimony: boolean;
    createdAt: Date;
  };
}) {
  return (
    <article
      aria-label={`Prayer request from ${formatManila(request.createdAt, { month: "long", day: "numeric" })}`}
      className={cn(
        "flex flex-col gap-3 rounded-lg border p-4",
        // New requests stand out; the rest have already been prayed for.
        request.status === "NEW" && "border-primary",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant={request.status === "NEW" ? "default" : "secondary"}
          className={cn(request.status === "NEW" && "bg-primary text-primary-foreground")}
        >
          {STATUS_LABELS[request.status]}
        </Badge>
        {request.keepAsTestimony && (
          <Badge className="bg-accent text-accent-foreground">Kept as testimony</Badge>
        )}
        <time dateTime={request.createdAt.toISOString()} className="text-sm text-muted-foreground">
          {formatManila(request.createdAt, {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </time>
      </div>

      {/* People write in their own words (often Taglish); keep their line breaks. */}
      <p className="text-lg leading-relaxed break-words whitespace-pre-line">{request.body}</p>

      <dl className="flex flex-col gap-1">
        <Detail label="From" value={request.name ?? "Anonymous"} />
        {request.contact && <Detail label="Reach out to" value={request.contact} />}
        <Detail
          label="Sharing"
          value={request.shareConsent ? "OK to share with the congregation" : "Not to be shared"}
        />
      </dl>

      <RequestActions
        id={request.id}
        status={request.status}
        keepAsTestimony={request.keepAsTestimony}
      />
    </article>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap gap-x-2">
      <dt className="font-semibold text-muted-foreground">{label}:</dt>
      <dd className="min-w-0 break-words">{value}</dd>
    </div>
  );
}

function RequestsSkeleton() {
  return (
    <div role="status" aria-label="Loading prayer requests" className="flex flex-col gap-4 motion-safe:animate-pulse">
      {[0, 1].map((i) => (
        <div key={i} className="flex flex-col gap-3 rounded-lg border p-4">
          <div className="h-5 w-32 rounded-md bg-foreground/10" />
          <div className="h-5 w-full rounded-md bg-foreground/10" />
          <div className="h-5 w-3/4 rounded-md bg-foreground/10" />
          <div className="h-11 w-40 rounded-md bg-foreground/10" />
        </div>
      ))}
    </div>
  );
}
