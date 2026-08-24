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

export function colorForProvider(name: string): string {
  return PROVIDER_COLORS[name.toLowerCase()] ?? DEFAULT_PROVIDER_COLOR;
}
