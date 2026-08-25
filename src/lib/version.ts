export const APP_VERSION = "v10";

export const APP_VERSION_CHANGES = [
  "contrast pass across the app: fixed every text/background pair that failed WCAG AA (several UI labels were at 3.2-3.8:1), and brightened description text + the angle label beyond the minimum per explicit feedback",
  "font system cut from three families to two — dropped EB Garamond; angle statements now use clean upright Alegreya instead of large italic serif",
  "angle statements: rewrote the prompt's own few-shot examples (several were themselves 9-12 words, silently teaching the model to ignore the 8-word rule) and added a hard server-side word-count backstop so layout can never break regardless of model output",
  "result rows made more compact (tighter padding/spacing) and the poster enlarged (240px -> 280px desktop)",
  "page widened to use empty desktop side space (max-w-5xl -> max-w-6xl); text measure capped independently at ~65ch so body copy doesn't just get wider",
  "visual hierarchy: each row gets a distinct accent color (title + left border), hashed per show so it's stable but varies row to row; description recedes in size/weight relative to title and angle",
  "landing page example made unmistakable: bordered container, explicit 'Example — not a real result' badge, muted title color instead of a real result's accent",
  "verified the submit button from the previous release is present and functional",
  "added TMDB audience rating (small, subordinate) to each recommendation",
  "provider logos are now clickable, linking to TMDB's watch page for that show (TMDB doesn't expose a distinct deep link per provider, only one aggregate link per show/region); tracks clicked_provider_link",
];
