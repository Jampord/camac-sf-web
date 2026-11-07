// The landing page's words and links, kept in one place so they're easy to change.
//
// Keep personal details out (this repo is public): a phone number or a leader's own contact
// belongs in an admin setting, like the church address. People reach the church on Messenger.

export const WELCOME =
  "We warmly invite you to join us for Sunday worship. Come as you are. Sunday School is available for children, and a heartfelt welcome awaits you, whether this is your first Sunday with us or your fiftieth.";

export const ABOUT = [
  "We're City of San Fernando Alliance Church, a family of believers in San Fernando and part of the Christian and Missionary Alliance. Every Sunday we gather to worship God, open the Bible together, and pray for one another.",
  "Whether you've followed Jesus for years or you're simply curious about him, there's a place for you here. Come as you are, sit with us, and let us get to know you.",
];

/** "Your first Sunday": what a visitor wants to know before walking in. */
export const FIRST_SUNDAY: { label: string; text: string }[] = [
  { label: "Kids", text: "Sunday School for children 10 and under, during the service" },
  {
    label: "Wear",
    text: "Whatever you're comfortable in. We just ask that you skip shorts and short skirts.",
  },
  {
    label: "Getting there",
    text: "Driving? Enter through the Kalayaan Village gate for parking. Commuting? Come in through Quebiawan.",
  },
];

/**
 * The church's Facebook page and its Messenger link (m.me/<page username>). Public, so they can
 * live here. Set to null, a button doesn't show. Use the page's own address, not a
 * facebook.com/share/… link: those carry tracking and can expire.
 */
export const FACEBOOK_URL: string | null = "https://www.facebook.com/CAMACSanFernando08";
export const MESSENGER_URL: string | null = "https://m.me/CAMACSanFernando08";
