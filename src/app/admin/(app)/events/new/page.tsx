import { Suspense } from "react";
import type { Metadata } from "next";
import { FormSkeleton } from "@/components/skeletons";
import { requireAdmin } from "@/lib/dal";
import { db } from "@/lib/db";
import { createEvent } from "../actions";
import { EventForm } from "../event-form";

export const metadata: Metadata = { title: "New event" };

export default function NewEventPage() {
  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-bold tracking-tight">New event</h1>
        <p className="text-muted-foreground">
          It&apos;s saved as a draft. Nobody sees it until you publish.
        </p>
      </div>
      <Suspense fallback={<FormSkeleton />}>
        <NewEvent />
      </Suspense>
    </>
  );
}

async function NewEvent() {
  // Check access before touching the database.
  await requireAdmin();
  const ministries = await db.ministry.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  return <EventForm action={createEvent} ministries={ministries} submitLabel="Save draft" />;
}
