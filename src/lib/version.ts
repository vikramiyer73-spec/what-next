export const APP_VERSION = "v7";

export const APP_VERSION_CHANGES = [
  "fixed: mid-word title breaks on long titles were a too-narrow-column artifact, not a wrong CSS property — root cause fixed by widening the layout",
  "results layout widened (page container + explicit column min-width) so the center column has real room to breathe",
  "3-column layout now only activates at large-desktop widths (lg breakpoint); tablet gets the roomy single-column layout instead of a cramped 3-column one",
  "title font size now also scales down for long titles specifically, not just narrow viewports",
  "provider pills dedupe tier/channel variants of the same service (e.g. Netflix vs Netflix Standard with Ads collapse to one pill)",
];
