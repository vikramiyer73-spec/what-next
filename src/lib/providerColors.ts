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
