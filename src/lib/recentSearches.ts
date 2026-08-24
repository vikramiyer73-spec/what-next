// Hardcoded stand-in until "recent searches" is backed by real data.
//
// To make this live: query PostHog for the last N distinct `show` property
// values on `submitted_show` events (PostHog's HogQL query API, called from a
// small server route so the API key stays server-side), cache the result for
// a minute or two, and swap `pickRotatingRecentSearches` for that fetch.
const RECENT_SEARCH_POOL = [
  "The Bear",
  "Severance",
  "Succession",
  "The Wire",
  "Fleabag",
  "Slow Horses",
  "Better Call Saul",
  "Reservation Dogs",
  "The Last of Us",
  "Beef",
  "Shrinking",
  "Hacks",
];

/** Rotates the starting point daily so the set isn't static forever. */
export function pickRotatingRecentSearches(count = 5): string[] {
  const dayIndex = Math.floor(Date.now() / 86_400_000);
  const start = dayIndex % RECENT_SEARCH_POOL.length;
  return Array.from(
    { length: count },
    (_, i) => RECENT_SEARCH_POOL[(start + i) % RECENT_SEARCH_POOL.length],
  );
}
