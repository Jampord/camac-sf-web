import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { db } from "@/lib/db";
import { CHURCH_ADDRESS_KEY } from "@/lib/events/address";
import { setChurchAddress } from "./settings-actions";

// The church address for events "At the church venue". Kept in the database, not the code,
// because the repo is public. Callers must have checked requireAdmin() already.

export async function ChurchAddress() {
  const setting = await db.setting.findUnique({ where: { key: CHURCH_ADDRESS_KEY } });

  return (
    <section aria-labelledby="church-address" className="flex flex-col gap-3 rounded-lg border p-4">
      <h2 id="church-address" className="text-lg font-bold">
        Church address
      </h2>
      <p className="-mt-2 text-sm text-muted-foreground">
        {setting
          ? "Shown with a Google Maps link on events at the church."
          : "Not set yet. Add it so events at the church show where to go, with a Google Maps link."}
      </p>
      <form action={setChurchAddress} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex flex-1 flex-col gap-1 text-sm font-medium">
          Street address
          <Input
            name="address"
            maxLength={300}
            defaultValue={setting?.value ?? ""}
            placeholder="Street, barangay, City of San Fernando, La Union"
          />
        </label>
        <SubmitButton variant="outline">Save address</SubmitButton>
      </form>
    </section>
  );
}
