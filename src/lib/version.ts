export const APP_VERSION = "v6";

export const APP_VERSION_CHANGES = [
  "fixed: long show titles no longer overflow into the poster column (fluid clamp() sizing, word-break, wider gutter)",
  "fixed: wrong poster/art shown for shows whose TMDB entry only exists at the series level with per-season art (e.g. Deutschland 83 showing Deutschland 86's poster)",
  "TMDB title matching now prefers exact matches and uses a year in the title to disambiguate; logs when a fuzzy match is used",
];
