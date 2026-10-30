// Where an event is, for people to find it: the venue's street address and a Maps link.
// The church's own address is a Setting that admins enter, not code: this repo is public.

/** Setting row holding the church's street address. */
export const CHURCH_ADDRESS_KEY = "churchAddress";

/** The event's own address if it has one; else the church's, for events at the church. */
export function eventAddress(
  event: { atChurchVenue: boolean; venueAddress: string | null | undefined },
  churchAddress: string | null,
): string | null {
  const own = event.venueAddress?.trim();
  if (own) return own;
  return event.atChurchVenue ? churchAddress?.trim() || null : null;
}

/** "Church, 12 Example St, …" for calendars and the announcement's Venue line. */
export function fullLocation(venue: string, address: string | null): string {
  if (!address) return venue;
  return address.toLowerCase().startsWith(venue.toLowerCase()) ? address : `${venue}, ${address}`;
}

/** Opens Google Maps (the app on phones) searching for the address. */
export function mapsUrl(address: string): string {
  return `https://www.google.com/maps/search/?${new URLSearchParams({ api: "1", query: address })}`;
}
