/*
 * Exact intrinsic geometry exceptions; public typography and density never bypass tokens.
 */
export const CSS_GEOMETRY_EXCEPTIONS = Object.freeze([
  ["bar.css", ".miaixz-bar", "height", "2px", "Decorative progress hairline"],
  ["graph.css", ".miaixz-graph-zoom", "min-inline-size", "4ch", "Stable zoom percentage width"],
  [
    "search.css",
    ".miaixz-search-medium",
    "width",
    "min(280px, 42vw)",
    "Bounded header search width",
  ],
  [
    "select.css",
    ".miaixz-select-width-compact",
    "width",
    "160px",
    "Public fixed-width select variant",
  ],
  [
    "select.css",
    ".miaixz-select-surface[data-scrollable]::-webkit-scrollbar",
    "width",
    "10px",
    "Native scrollbar track",
  ],
  [
    "combobox.css",
    ":is(.miaixz-combobox-surface, .miaixz-picker-surface)[data-scrollable]::-webkit-scrollbar",
    "width",
    "10px",
    "Native scrollbar track",
  ],
  [
    "heatmap.css",
    ".miaixz-heatmap-compact .miaixz-heatmap-column-label",
    "padding-block-end",
    "3px",
    "Chart label clearance",
  ],
  ...["inline-size", "block-size"].map((property) => [
    "navigation.css",
    ".miaixz-navigation-rail-frame:not([data-expanded]) .miaixz-navigation-label, .miaixz-navigation-rail-frame:not([data-expanded]) .miaixz-navigation-meta, .miaixz-navigation-rail-frame:not([data-expanded]) .miaixz-navigation-rail-group-marker-label",
    property,
    "1px",
    "Visually hidden accessible label",
  ]),
  ...["width", "height"].map((property) => [
    "datagrid.css",
    '.miaixz-datagrid[data-caption-visibility="hidden"] .miaixz-table-caption',
    property,
    "1px",
    "Visually hidden accessible caption",
  ]),
  [
    "datagrid.css",
    '.miaixz-datagrid[data-density="compact"] .miaixz-table-cell',
    "height",
    "48px",
    "Compact data row target",
  ],
  [
    "datagrid.css",
    '.miaixz-datagrid[data-density="compact"] .miaixz-table-cell',
    "padding",
    "8px 10px",
    "Compact data cell geometry",
  ],
  [
    "datagrid.css",
    '.miaixz-datagrid[data-density="compact"] .miaixz-table-header',
    "height",
    "40px",
    "Compact data header height",
  ],
  [
    "datagrid.css",
    '.miaixz-datagrid[data-density="compact"] .miaixz-table-header',
    "padding-inline",
    "10px",
    "Compact data header inset",
  ],
  [
    "navigation.css",
    ".miaixz-navigation-rail-frame:not([data-expanded]) .miaixz-navigation-label, .miaixz-navigation-rail-frame:not([data-expanded]) .miaixz-navigation-meta, .miaixz-navigation-rail-frame:not([data-expanded]) .miaixz-navigation-rail-group-marker-label",
    "margin",
    "-1px",
    "Visually hidden accessible label offset",
  ],
  ["graph.css", ".miaixz-graph-viewport", "min-block-size", "22rem", "Graph canvas viewport"],
  ["graph.css", ".miaixz-graph-canvas", "block-size", "22rem", "Graph canvas viewport"],
  [
    "graph.css",
    ".miaixz-graph-viewport, .miaixz-graph-canvas",
    "block-size",
    "18rem",
    "Compact graph canvas viewport",
  ],
  [
    "graph.css",
    ".miaixz-graph-viewport, .miaixz-graph-canvas",
    "min-block-size",
    "18rem",
    "Compact graph canvas viewport",
  ],
]);

export function geometryException({ fileName, selector, property, value }) {
  const file = fileName.split("/").at(-1);
  const normalize = (text) => text.trim().replace(/\s+/gu, " ");
  return CSS_GEOMETRY_EXCEPTIONS.find(
    ([name, rule, prop, literal]) =>
      file === name &&
      normalize(selector) === rule &&
      property === prop &&
      normalize(value) === literal,
  )?.[4];
}
