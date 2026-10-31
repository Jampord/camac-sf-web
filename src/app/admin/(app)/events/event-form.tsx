"use client";

import { useActionState, useRef, useState } from "react";
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import type { EventField, EventFormState, EventFormValues } from "@/lib/events/input";
import { POSTER_ACCEPT, POSTER_MAX_BYTES } from "@/lib/poster-limits";
import { useHydrated } from "@/lib/use-hydrated";
import { getPosterUploadSignature } from "./actions";

type Props = {
  action: (state: EventFormState, formData: FormData) => Promise<EventFormState>;
  ministries: { id: string; name: string }[];
  defaults?: EventFormValues;
  submitLabel: string;
};

export function EventForm({ action, ministries, defaults = {}, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const hydrated = useHydrated();
  // After a failed submit, show what the admin typed; otherwise the saved values.
  const value = (field: EventField) => state.values?.[field] ?? defaults[field] ?? "";
  const error = (field: EventField) => state.errors?.[field];
  // aria-invalid styles the control red; FieldError shows the message under it.
  const invalid = (field: EventField) => (error(field) ? true : undefined);

  return (
    // Remount with the returned values after each failed submit, so every control
    // (including the Base UI checkbox) shows exactly what was sent.
    <form key={JSON.stringify(state.values ?? {})} action={formAction} noValidate>
      <FieldGroup>
        <Field data-invalid={invalid("title")}>
          <FieldLabel htmlFor="title">Title</FieldLabel>
          <Input
            id="title"
            name="title"
            maxLength={120}
            defaultValue={value("title")}
            aria-invalid={invalid("title")}
          />
          <FieldError>{error("title")}</FieldError>
        </Field>

        <WhenFields
          initial={{
            allDay: value("allDay") === "on",
            startsAt: value("startsAt"),
            endsAt: value("endsAt"),
          }}
          errors={{ startsAt: error("startsAt"), endsAt: error("endsAt") }}
        />

        <RepeatFields
          initial={{ recurrence: value("recurrence") || "NONE", until: value("recurrenceUntil") }}
          errors={{ recurrence: error("recurrence"), until: error("recurrenceUntil") }}
        />

        <Field data-invalid={invalid("venue")}>
          <FieldLabel htmlFor="venue">Venue</FieldLabel>
          <Input
            id="venue"
            name="venue"
            maxLength={200}
            placeholder="Church, a member's home, outreach site, resort"
            defaultValue={value("venue")}
            aria-invalid={invalid("venue")}
          />
          <FieldError>{error("venue")}</FieldError>
        </Field>

        <Field orientation="horizontal">
          <Checkbox
            id="atChurchVenue"
            name="atChurchVenue"
            defaultChecked={value("atChurchVenue") === "on"}
          />
          {/* Base UI names its checkbox via aria-labelledby="<id>-label", so the label needs that id. */}
          <FieldLabel htmlFor="atChurchVenue" id="atChurchVenue-label" className="font-normal">
            At the church venue
          </FieldLabel>
        </Field>

        <Field data-invalid={invalid("venueAddress")}>
          <FieldLabel htmlFor="venueAddress">Address (optional)</FieldLabel>
          <Input
            id="venueAddress"
            name="venueAddress"
            maxLength={300}
            placeholder="Street, barangay, town"
            defaultValue={value("venueAddress")}
            aria-invalid={invalid("venueAddress")}
            aria-describedby="venueAddress-help"
          />
          <FieldDescription id="venueAddress-help">
            Shown with a Google Maps link. Leave it blank for events at the church: the church
            address is used.
          </FieldDescription>
          <FieldError>{error("venueAddress")}</FieldError>
        </Field>

        <Field data-invalid={invalid("ministryId")}>
          <FieldLabel htmlFor="ministryId">Ministry</FieldLabel>
          <NativeSelect
            id="ministryId"
            name="ministryId"
            defaultValue={value("ministryId")}
            aria-invalid={invalid("ministryId")}
            className="w-full"
          >
            <NativeSelectOption value="">Church-wide</NativeSelectOption>
            {ministries.map((ministry) => (
              <NativeSelectOption key={ministry.id} value={ministry.id}>
                {ministry.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <FieldError>{error("ministryId")}</FieldError>
        </Field>

        <Field data-invalid={invalid("description")}>
          <FieldLabel htmlFor="description">Description</FieldLabel>
          <Textarea
            id="description"
            name="description"
            rows={5}
            maxLength={5000}
            defaultValue={value("description")}
            aria-invalid={invalid("description")}
          />
          <FieldDescription>Optional. Write it the way you&apos;d post it.</FieldDescription>
          <FieldError>{error("description")}</FieldError>
        </Field>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field data-invalid={invalid("contactPerson")}>
            <FieldLabel htmlFor="contactPerson">Contact person</FieldLabel>
            <Input
              id="contactPerson"
              name="contactPerson"
              maxLength={120}
              placeholder="Optional"
              defaultValue={value("contactPerson")}
              aria-invalid={invalid("contactPerson")}
            />
            <FieldError>{error("contactPerson")}</FieldError>
          </Field>
          <Field data-invalid={invalid("attire")}>
            <FieldLabel htmlFor="attire">Attire</FieldLabel>
            <Input
              id="attire"
              name="attire"
              maxLength={120}
              placeholder="Optional, e.g. Filipiniana"
              defaultValue={value("attire")}
              aria-invalid={invalid("attire")}
            />
            <FieldError>{error("attire")}</FieldError>
          </Field>
        </div>

        <PosterField initial={value("posterUrl")} error={error("posterUrl")} />

        <div className="flex flex-wrap items-center gap-4">
          <Button type="submit" size="lg" disabled={pending || !hydrated}>
            {pending && <Spinner />}
            {pending ? "Saving…" : submitLabel}
          </Button>
          {state.errors && (
            <p role="status" className="text-sm text-destructive">
              Fix the highlighted fields, then save again.
            </p>
          )}
          {state.saved && !pending && (
            <p role="status" className="text-sm text-muted-foreground">
              Changes saved.
            </p>
          )}
        </div>
      </FieldGroup>
    </form>
  );
}

/**
 * Start and end, as date-and-time pickers or, for all-day events, date-only pickers.
 * Switching keeps the dates already chosen, and remembers the times in case it's switched back.
 */
function WhenFields({
  initial,
  errors,
}: {
  initial: { allDay: boolean; startsAt: string; endsAt: string };
  errors: { startsAt?: string; endsAt?: string };
}) {
  const [allDay, setAllDay] = useState(initial.allDay);
  const [startsAt, setStartsAt] = useState(initial.startsAt);
  const [endsAt, setEndsAt] = useState(initial.endsAt);
  const times = useRef({ start: "09:00", end: "12:00" });

  function switchAllDay(next: boolean) {
    if (next) {
      // Remember the times, keep the dates.
      if (startsAt.length > 10) times.current.start = startsAt.slice(11, 16);
      if (endsAt.length > 10) times.current.end = endsAt.slice(11, 16);
      setStartsAt(startsAt.slice(0, 10));
      setEndsAt(endsAt.slice(0, 10));
    } else {
      setStartsAt(startsAt && `${startsAt.slice(0, 10)}T${times.current.start}`);
      setEndsAt(endsAt && `${endsAt.slice(0, 10)}T${times.current.end}`);
    }
    setAllDay(next);
  }

  const type = allDay ? "date" : "datetime-local";

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <Field orientation="horizontal" className="sm:col-span-2">
        <Checkbox
          id="allDay"
          name="allDay"
          checked={allDay}
          onCheckedChange={(checked) => switchAllDay(checked === true)}
        />
        {/* Base UI names its checkbox via aria-labelledby="<id>-label", so the label needs that id. */}
        <FieldLabel htmlFor="allDay" id="allDay-label" className="font-normal">
          All day
        </FieldLabel>
      </Field>
      <Field data-invalid={errors.startsAt ? true : undefined}>
        <FieldLabel htmlFor="startsAt">{allDay ? "Start date" : "Starts"}</FieldLabel>
        <Input
          id="startsAt"
          name="startsAt"
          type={type}
          value={startsAt}
          onChange={(e) => setStartsAt(e.target.value)}
          aria-invalid={errors.startsAt ? true : undefined}
        />
        <FieldError>{errors.startsAt}</FieldError>
      </Field>
      <Field data-invalid={errors.endsAt ? true : undefined}>
        <FieldLabel htmlFor="endsAt">{allDay ? "End date" : "Ends"}</FieldLabel>
        <Input
          id="endsAt"
          name="endsAt"
          type={type}
          value={endsAt}
          onChange={(e) => setEndsAt(e.target.value)}
          aria-invalid={errors.endsAt ? true : undefined}
        />
        <FieldError>{errors.endsAt}</FieldError>
      </Field>
      <FieldDescription className="sm:col-span-2">
        {allDay
          ? "For a one-day event, pick the same date twice. Longer events show on each day of the calendar."
          : "Times are Philippine time."}
      </FieldDescription>
    </div>
  );
}

/** Weekly or not at all (brief §6.1). "Repeat until" only shows for weekly events. */
function RepeatFields({
  initial,
  errors,
}: {
  initial: { recurrence: string; until: string };
  errors: { recurrence?: string; until?: string };
}) {
  const [recurrence, setRecurrence] = useState(initial.recurrence);
  const weekly = recurrence === "WEEKLY";

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <Field data-invalid={errors.recurrence ? true : undefined}>
        <FieldLabel htmlFor="recurrence">Repeats</FieldLabel>
        <NativeSelect
          id="recurrence"
          name="recurrence"
          value={recurrence}
          onChange={(e) => setRecurrence(e.target.value)}
          aria-invalid={errors.recurrence ? true : undefined}
          className="w-full"
        >
          <NativeSelectOption value="NONE">Doesn&apos;t repeat</NativeSelectOption>
          <NativeSelectOption value="WEEKLY">Every week</NativeSelectOption>
        </NativeSelect>
        <FieldError>{errors.recurrence}</FieldError>
      </Field>
      {weekly && (
        <Field data-invalid={errors.until ? true : undefined}>
          <FieldLabel htmlFor="recurrenceUntil">Repeat until</FieldLabel>
          <Input
            id="recurrenceUntil"
            name="recurrenceUntil"
            type="date"
            defaultValue={initial.until}
            aria-invalid={errors.until ? true : undefined}
          />
          <FieldDescription>Optional. Leave empty to keep repeating.</FieldDescription>
          <FieldError>{errors.until}</FieldError>
        </Field>
      )}
      {weekly && (
        <FieldDescription className="sm:col-span-2">
          Same day and time every week. To skip a single week, save first, then use Upcoming dates
          on this page.
        </FieldDescription>
      )}
    </div>
  );
}

/**
 * Optional poster (brief §5): uploads straight from the browser to Cloudinary with a signature
 * from our server, then keeps only the image address in a hidden field for the form to save.
 */
function PosterField({ initial, error }: { initial: string; error?: string }) {
  const [url, setUrl] = useState(initial);
  const [status, setStatus] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    if (!POSTER_ACCEPT.split(",").includes(file.type)) {
      setStatus("Choose a JPG, PNG or WebP image.");
      return;
    }
    if (file.size > POSTER_MAX_BYTES) {
      setStatus("That image is larger than 5 MB. Export a smaller one from Canva.");
      return;
    }
    setUploading(true);
    setStatus("Uploading…");
    try {
      const sig = await getPosterUploadSignature();
      const body = new FormData();
      body.set("file", file);
      body.set("api_key", sig.apiKey);
      body.set("timestamp", String(sig.timestamp));
      body.set("folder", sig.folder);
      body.set("allowed_formats", sig.allowedFormats);
      body.set("signature", sig.signature);
      const response = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, {
        method: "POST",
        body,
      });
      if (!response.ok) throw new Error(`Upload failed (${response.status})`);
      const { secure_url } = (await response.json()) as { secure_url: string };
      setUrl(secure_url);
      setStatus("Uploaded. Save to keep it.");
    } catch {
      setStatus("The upload didn't work. Check your connection and try again.");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor="poster">Poster</FieldLabel>
      <input type="hidden" name="posterUrl" value={url} />
      {url && (
        // eslint-disable-next-line @next/next/no-img-element -- Cloudinary resizes it; next/image would resize twice
        <img
          src={url.replace("/image/upload/", "/image/upload/f_auto,q_auto,w_480/")}
          alt="Poster preview"
          className="max-h-80 w-fit rounded-lg border object-contain"
        />
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={uploading}
          onClick={() => fileInput.current?.click()}
        >
          {url ? "Change poster" : "Choose poster"}
        </Button>
        {url && (
          <Button
            type="button"
            variant="ghost"
            disabled={uploading}
            onClick={() => {
              setUrl("");
              setStatus("Poster removed. Save to keep the change.");
            }}
          >
            Remove poster
          </Button>
        )}
      </div>
      <input
        ref={fileInput}
        id="poster"
        type="file"
        accept={POSTER_ACCEPT}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
        }}
      />
      <FieldDescription>Optional. JPG, PNG or WebP, up to 5 MB, e.g. the Canva poster.</FieldDescription>
      {status && <p role="status" className="text-sm">{status}</p>}
      <FieldError>{error}</FieldError>
    </Field>
  );
}
