/*
 * Exact intrinsic geometry exceptions; public typography and density never bypass tokens.
 */
export const CSS_GEOMETRY_EXCEPTIONS = Object.freeze([
  ["bar.css", ".miaixz-bar", "height", "2px", "Decorative progress hairline"],
  [
    "relation-map.css",
    ".miaixz-relation-map-zoom",
    "min-inline-size",
    "4ch",
    "Stable zoom percentage width",
  ],
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
  ["avatar.css", ".miaixz-avatar-profile", "width", "96px", "Profile asset box"],
  ["avatar.css", ".miaixz-avatar-profile", "height", "96px", "Profile asset box"],
  [
    "heatmap.css",
    ".miaixz-heatmap-compact .miaixz-heatmap-column-label",
    "padding-block-end",
    "3px",
    "Chart label clearance",
  ],
  ...["inset-block-start", "inset-inline-end"].map((property) => [
    "metric.css",
    ".miaixz-metric-summary .miaixz-metric-status",
    property,
    "10px",
    "Graphic status anchor",
  ]),
  [
    "metric.css",
    ".miaixz-metric-summary .miaixz-metric-visual",
    "inset-block-start",
    "24px",
    "Graphic viewport anchor",
  ],
  ...["14px", "12px"].map((value) => [
    "metric.css",
    ".miaixz-metric-summary .miaixz-metric-visual",
    "inset-inline-end",
    value,
    "Graphic viewport anchor",
  ]),
  [
    "metric.css",
    ".miaixz-metric-summary",
    "padding-inline-end",
    "20px",
    "Responsive graphic clearance",
  ],
  ...[
    ["inset-block-end", "13px"],
    ["inset-inline-end", "16px"],
    ["inset-block-end", "11px"],
    ["inset-inline-end", "12px"],
  ].map(([property, value]) => [
    "status.css",
    ".miaixz-status-metric",
    property,
    value,
    "Metric annotation anchor",
  ]),
  ...["inline-size", "block-size"].map((property) => [
    "navigation.css",
    ".miaixz-navigation-icon-only .miaixz-navigation-label, .miaixz-navigation-icon-only .miaixz-navigation-meta",
    property,
    "1px",
    "Visually hidden accessible label",
  ]),
  ...["width", "height"].map((property) => [
    "datagrid.css",
    ".miaixz-datagrid-caption-hidden .miaixz-table-caption",
    property,
    "1px",
    "Visually hidden accessible caption",
  ]),
  [
    "datagrid.css",
    ".miaixz-datagrid-rows-compact .miaixz-table-cell",
    "height",
    "48px",
    "Compact data row target",
  ],
  [
    "datagrid.css",
    ".miaixz-datagrid-rows-compact .miaixz-table-cell",
    "padding",
    "8px 10px",
    "Compact data cell geometry",
  ],
  [
    "datagrid.css",
    ".miaixz-datagrid-rows-compact .miaixz-table-header",
    "height",
    "40px",
    "Compact data header height",
  ],
  [
    "datagrid.css",
    ".miaixz-datagrid-rows-compact .miaixz-table-header",
    "padding-inline",
    "10px",
    "Compact data header inset",
  ],
  [
    "navigation.css",
    ".miaixz-navigation-icon-only .miaixz-navigation-label, .miaixz-navigation-icon-only .miaixz-navigation-meta",
    "margin",
    "-1px",
    "Visually hidden accessible label offset",
  ],
  [
    "relation-map.css",
    ".miaixz-relation-map-viewport",
    "min-block-size",
    "22rem",
    "Relation canvas viewport",
  ],
  [
    "relation-map.css",
    ".miaixz-relation-map-canvas",
    "block-size",
    "22rem",
    "Relation canvas viewport",
  ],
  [
    "relation-map.css",
    ".miaixz-relation-map-viewport, .miaixz-relation-map-canvas",
    "block-size",
    "18rem",
    "Compact relation canvas viewport",
  ],
  [
    "relation-map.css",
    ".miaixz-relation-map-viewport, .miaixz-relation-map-canvas",
    "min-block-size",
    "18rem",
    "Compact relation canvas viewport",
  ],
  [
    "tabs.css",
    ".miaixz-tabs-header-toolbar > .miaixz-tabs-header",
    "min-height",
    "60px",
    "Directory toolbar alignment",
  ],
  ["toolbar.css", ".miaixz-toolbar-panel", "min-height", "60px", "Panel toolbar alignment"],
  [
    "tree.css",
    ".miaixz-tree-directory .miaixz-tree-row",
    "min-height",
    "42px",
    "Directory row rhythm",
  ],
  ["tree.css", ".miaixz-tree-outline .miaixz-tree-row", "min-height", "48px", "Outline row rhythm"],
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
