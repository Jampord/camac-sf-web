// The landing page's words and links, kept in one place so they're easy to change.
//
// PLACEHOLDER: the welcome and about text below are drafts. Replace them with the church's own
// words before this goes live. Keep personal details out (this repo is public): a phone number
// or a leader's own contact belongs in an admin setting, like the church address.

export const WELCOME =
  "Worship, preaching, and Sunday School for the kids. Everyone is welcome, first visit or fiftieth.";

export const ABOUT = [
  "We are a church family in San Fernando, part of the Christian and Missionary Alliance. We gather to worship, pray for one another, and serve our town together.",
  "Write two or three sentences here in the church's own words: how it started, what matters to you, who you hope to welcome.",
];

/** "Your first Sunday": what a visitor wants to know before walking in. */
export const FIRST_SUNDAY: { label: string; text: string }[] = [
  { label: "Kids", text: "Sunday School runs during the service" },
  { label: "Wear", text: "Whatever you're comfortable in" },
  { label: "Getting there", text: "A note about parking or the nearest landmark" },
];

/**
 * The church's Facebook page and its Messenger link (m.me/<page username>). Public, so they can
 * live here. Set to null, a button doesn't show. Use the page's own address, not a
 * facebook.com/share/… link: those carry tracking and can expire.
 */
export const FACEBOOK_URL: string | null = "https://www.facebook.com/CAMACSanFernando08";
export const MESSENGER_URL: string | null = "https://m.me/CAMACSanFernando08";
