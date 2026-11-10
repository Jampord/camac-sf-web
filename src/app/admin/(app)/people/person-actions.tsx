"use client";

import { useId, useState, useTransition } from "react";
import { toast } from "sonner";
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ACCESS_INFO, type Access } from "@/lib/people/access";
import { NAME_MAX } from "@/lib/people/input";
import { AccessChoice } from "./access-choice";
import { removePerson, updatePerson, type ChangeResult } from "./actions";

export type PersonRow = {
  id: string;
  email: string;
  name: string | null;
  access: Access;
  canManagePeople: boolean;
};

/** Change and Remove for one person. The page shows them only where the rules allow. */
export function PersonActions({ person, viewerCanManagePeople }: { person: PersonRow; viewerCanManagePeople: boolean }) {
  return (
    <div className="flex shrink-0 gap-2">
      <ChangeButton person={person} viewerCanManagePeople={viewerCanManagePeople} />
      <RemoveButton person={person} />
    </div>
  );
}

const label = (person: PersonRow) => person.name ?? person.email;

function report(result: ChangeResult) {
  if (result.ok) toast.success(result.message);
  else if (result.error) toast.error(result.error);
}

function ChangeButton({ person, viewerCanManagePeople }: { person: PersonRow; viewerCanManagePeople: boolean }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [access, setAccess] = useState<Access>(person.access);
  const [errors, setErrors] = useState<Extract<ChangeResult, { ok: false }>["errors"]>();
  const nameId = useId();

  function onOpenChange(next: boolean) {
    // Start from what's saved each time the dialog opens.
    if (next) {
      setAccess(person.access);
      setErrors(undefined);
    }
    setOpen(next);
  }

  function save(formData: FormData) {
    startTransition(async () => {
      const result = await updatePerson(person.id, formData);
      if (!result.ok && result.errors) return setErrors(result.errors);
      setOpen(false);
      report(result);
    });
  }

  const changing = access !== person.access;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={<Button variant="outline" disabled={pending} aria-label={`Change ${label(person)}`} />}>
        {pending && <Spinner />}
        Change
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Change {label(person)}</DialogTitle>
          <DialogDescription>{person.email}. The email can&apos;t be changed: remove them and add the new one.</DialogDescription>
        </DialogHeader>
        <form action={save} noValidate className="flex flex-col gap-4">
          <FieldGroup>
            <Field data-invalid={errors?.name ? true : undefined}>
              <FieldLabel htmlFor={nameId}>Name (optional)</FieldLabel>
              <Input
                id={nameId}
                name="name"
                maxLength={NAME_MAX}
                autoComplete="off"
                defaultValue={person.name ?? ""}
                aria-invalid={errors?.name ? true : undefined}
                className="h-11 text-base md:text-base"
              />
              <FieldError>{errors?.name}</FieldError>
            </Field>
            {viewerCanManagePeople && (
              <AccessChoice
                access={access}
                onAccessChange={setAccess}
                defaultCanManagePeople={person.canManagePeople}
                error={errors?.access}
              />
            )}
          </FieldGroup>
          {/* The confirmation: who, and what they'll be able to do. */}
          {changing && (
            <p role="status" className="rounded-xl bg-muted p-3">
              <strong>{label(person)}</strong> will change from {ACCESS_INFO[person.access].label} to{" "}
              <strong>{ACCESS_INFO[access].label}</strong>.
            </p>
          )}
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit" disabled={pending}>
              {pending && <Spinner />}
              {changing ? `Make them ${ACCESS_INFO[access].label}` : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RemoveButton({ person }: { person: PersonRow }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function remove() {
    setOpen(false);
    startTransition(async () => report(await removePerson(person.id)));
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" disabled={pending} aria-label={`Remove ${label(person)}`} />}>
        {pending && <Spinner />}
        Remove
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Remove {label(person)}?</DialogTitle>
          <DialogDescription>
            {person.access === "member"
              ? "They won't be able to sign in to see the serving schedule."
              : `They'll lose ${ACCESS_INFO[person.access].label} access and won't be able to sign in. Events they created stay.`}{" "}
            You can add them again later.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Keep them</DialogClose>
          <Button variant="destructive" onClick={remove}>
            Remove
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
