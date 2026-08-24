const PROVIDER_COLORS: Record<string, string> = {
  netflix: "#E50914",
  hulu: "#1CE783",
  "disney plus": "#113CCF",
  "disney+": "#113CCF",
  max: "#9B51E0",
  "hbo max": "#9B51E0",
  "amazon prime video": "#00A8E1",
  "amazon video": "#00A8E1",
  "apple tv plus": "#A3AAAE",
  "apple tv+": "#A3AAAE",
  "apple tv": "#A3AAAE",
  "peacock premium": "#000000",
  "peacock premium plus": "#000000",
  peacock: "#000000",
  "paramount plus": "#0064FF",
  "paramount+": "#0064FF",
  starz: "#000000",
  showtime: "#B10000",
  "amc+": "#31C6B3",
  crunchyroll: "#F47521",
};

const DEFAULT_PROVIDER_COLOR = "#9CA3AF";

/** Light neutral used in place of a brand color that's too dark to read against the page. */
export const LIGHT_FALLBACK_COLOR = "#B8B2D6";

export function colorForProvider(name: string): string {
  return PROVIDER_COLORS[name.toLowerCase()] ?? DEFAULT_PROVIDER_COLOR;
}

function relativeLuminance(hex: string): number {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

/** True when a brand color is too dark to read as a border/fill against the dark page. */
export function isTooDarkForPage(hex: string): boolean {
  return relativeLuminance(hex) < 0.35;
}

/** The color a pill should actually use — the brand color, or a light fallback when it's too dark. */
export function pillColorForProvider(name: string): string {
  const brand = colorForProvider(name);
  return isTooDarkForPage(brand) ? LIGHT_FALLBACK_COLOR : brand;
}

// TMDB lists tier and reseller-channel variants of the same underlying
// service as separate provider entries — ad-supported tiers ("Netflix" vs
// "Netflix Standard with Ads") and different resale channels for the same
// add-on subscription ("AMC+ Amazon Channel" vs "AMC Plus Apple TV channel",
// both just "you need AMC+"). Nobody thinks of those as separate options for
// where to watch something, so strip that noise before matching a brand.
// Scoped to entries that already share the same access type (flatrate/rent/
// buy) at the call site, so this never merges a genuinely different offer
// like "Apple TV Store" (a purchase) with "Apple TV+" (a subscription).
const RESELLER_SUFFIX_PATTERN =
  /\s+(amazon channel|apple tv channel|roku premium channel|google play channel|premium channel|channel)\s*$/i;
const TIER_SUFFIX_PATTERN =
  /\s+(standard with ads|with ads|premium plus|premium|essential|basic)\s*$/i;

function stripKnownSuffixes(name: string): string {
  let cleaned = name.trim();
  let prev: string;
  do {
    prev = cleaned;
    cleaned = cleaned.replace(RESELLER_SUFFIX_PATTERN, "").trim();
    cleaned = cleaned.replace(TIER_SUFFIX_PATTERN, "").trim();
  } while (cleaned !== prev);
  return cleaned.replace(/\bplus\b/i, "+").replace(/\s+\+/, "+");
}

const PROVIDER_BRAND_PATTERNS: [RegExp, string][] = [
  [/^netflix\b/i, "Netflix"],
  [/^hulu\b/i, "Hulu"],
  [/^disney\s*\+?/i, "Disney+"],
  [/^hbo\s*max\b/i, "Max"],
  [/^max\b/i, "Max"],
  [/^amazon\s*(prime)?\s*video\b/i, "Amazon Prime Video"],
  [/^apple\s*tv\s*\+/i, "Apple TV+"],
  [/^peacock\b/i, "Peacock"],
  [/^paramount\s*\+?/i, "Paramount+"],
  [/^starz\b/i, "Starz"],
  [/^showtime\b/i, "Showtime"],
  [/^amc\s*\+/i, "AMC+"],
  [/^crunchyroll\b/i, "Crunchyroll"],
];

export function canonicalProviderBrand(name: string): string {
  const cleaned = stripKnownSuffixes(name);
  for (const [pattern, brand] of PROVIDER_BRAND_PATTERNS) {
    if (pattern.test(cleaned) || pattern.test(name)) return brand;
  }
  return cleaned || name;
}
