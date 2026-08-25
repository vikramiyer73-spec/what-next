// Every color here was checked against the page background (#1a1626) and
// clears WCAG AA comfortably (8.5:1+) at any text size, so picking one for a
// title never risks a contrast failure. Gives each row a distinct anchor
// color instead of every card carrying identical visual weight.
const ROW_ACCENT_COLORS = [
  "#FF9E8A", // coral
  "#F5C777", // amber
  "#9ED9A8", // sage
  "#8FC7F0", // sky
  "#C9A6F0", // violet
  "#F5A3C7", // rose
  "#7FDDD1", // teal
];

/**
 * Index-based rather than hashed on title: cycling by position guarantees
 * adjacent rows never repeat a color (a hash can and did collide with only
 * 7 colors in the palette), which is what actually serves "anchor the eye
 * per row" — row-to-row variety matters more here than a color staying
 * pinned to a specific show across a dismiss/regenerate.
 */
export function accentColorForRow(index: number): string {
  return ROW_ACCENT_COLORS[index % ROW_ACCENT_COLORS.length];
}
