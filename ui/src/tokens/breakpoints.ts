/**
 * Defines immutable viewport range minimums in pixels.
 *
 * @public
 */
export const miaixzBreakpoints = Object.freeze({
  mobile: 0,
  tablet: 768,
  compactDesktop: 1024,
  desktop: 1280,
  wide: 1440,
});

/**
 * Defines immutable public viewport media-query strings.
 *
 * @public
 */
export const miaixzMediaQueries = Object.freeze({
  mobile: "(width < 768px)",
  tablet: "(768px <= width < 1024px)",
  compactDesktop: "(1024px <= width < 1280px)",
  desktop: "(1280px <= width < 1440px)",
  wide: "(width >= 1440px)",
});

/**
 * Defines the only reusable-component container query contracts.
 *
 * @public
 */
export const miaixzContainerQueries = Object.freeze({
  toolbar: Object.freeze({ name: "miaixz-toolbar", maxWidth: 480 }),
  panel: Object.freeze({ name: "miaixz-panel", maxWidth: 480 }),
  tabs: Object.freeze({ name: "miaixz-tabs", maxWidth: 480 }),
  form: Object.freeze({ name: "miaixz-form", maxWidth: 640 }),
  datagrid: Object.freeze({ name: "miaixz-datagrid", maxWidth: 640 }),
  split: Object.freeze({ name: "miaixz-split", maxWidth: 640 }),
  empty: Object.freeze({ name: "miaixz-empty", maxWidth: 360 }),
  upload: Object.freeze({ name: "miaixz-upload", maxWidth: 480 }),
  pagination: Object.freeze({ name: "miaixz-pagination", maxWidth: 480 }),
});

/**
 * Defines standard responsive test viewports as width-height pairs.
 *
 * @public
 */
export const miaixzResponsiveTestViewports = Object.freeze([
  Object.freeze({ width: 320, height: 568 }),
  Object.freeze({ width: 375, height: 812 }),
  Object.freeze({ width: 768, height: 1024 }),
  Object.freeze({ width: 1024, height: 768 }),
  Object.freeze({ width: 1280, height: 800 }),
  Object.freeze({ width: 1440, height: 900 }),
  Object.freeze({ width: 1920, height: 1080 }),
]);

/**
 * Defines standard component-container widths in pixels.
 *
 * @public
 */
export const miaixzResponsiveTestContainerWidths = Object.freeze([280, 360, 480, 640, 768]);
