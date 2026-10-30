import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { db } from "@/lib/db";
import { PRIVACY_CONTACT_KEY } from "@/lib/events/public";
import { setPrivacyContact } from "./settings-actions";

// The church contact named on /privacy (brief §6.7). Kept in the database, not the code, because
// the repo is public. Callers must have checked requireAdmin() already.

export async function PrivacyContact() {
  const setting = await db.setting.findUnique({ where: { key: PRIVACY_CONTACT_KEY } });

  return (
    <section aria-labelledby="privacy-contact" className="flex flex-col gap-3 rounded-lg border p-4">
      <h2 id="privacy-contact" className="text-lg font-bold">
        Privacy contact
      </h2>
      <p className="-mt-2 text-sm text-muted-foreground">
        {setting
          ? "Named on the privacy page, for people asking about their prayer requests."
          : "Not set yet. The privacy page tells people to ask a church leader until you add a name."}
      </p>
      <form action={setPrivacyContact} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex flex-1 flex-col gap-1 text-sm font-medium">
          Name and how to reach them
          <Input
            name="contact"
            maxLength={300}
            defaultValue={setting?.value ?? ""}
            placeholder="e.g. the church secretary, through the church Facebook page"
          />
        </label>
        <SubmitButton variant="outline">Save contact</SubmitButton>
      </form>
    </section>
  );
}
