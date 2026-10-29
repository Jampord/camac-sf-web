import { Suspense } from "react";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/dal";
import { db } from "@/lib/db";
import { createEvent } from "../actions";
import { EventForm } from "../event-form";

export const metadata: Metadata = { title: "New event" };

export default function NewEventPage() {
  return (
    <>
      <h1 className="text-3xl font-bold">New event</h1>
      <p className="text-muted">New events are saved as drafts. Publish when it&apos;s ready to share.</p>
      <Suspense fallback={<p>Loading…</p>}>
        <NewEvent />
      </Suspense>
    </>
  );
}

async function NewEvent() {
  const [, ministries] = await Promise.all([
    requireAdmin(),
    db.ministry.findMany({ orderBy: { name: "asc" } }),
  ]);
  return <EventForm action={createEvent} ministries={ministries} submitLabel="Save draft" />;
}
