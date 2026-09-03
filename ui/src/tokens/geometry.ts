import { miaixzDensities } from "@miaixz/sdk/appearance";

/**
 * Defines one density-specific geometry branch in pixels.
 *
 * @public
 */
export interface MiaixzThemeDensityGeometry {
  /**
   * Control block size.
   */
  readonly controlHeight?: number;
  /**
   * Control inline padding.
   */
  readonly controlPaddingInline?: number;
  /**
   * Gap between control contents.
   */
  readonly controlGap?: number;
  /**
   * Panel internal padding.
   */
  readonly panelPadding?: number;
  /**
   * Table row block size.
   */
  readonly tableRowHeight?: number;
  /**
   * Generic item block size.
   */
  readonly itemHeight?: number;
  /**
   * Gap between page sections.
   */
  readonly sectionGap?: number;
}

/**
 * Defines theme-controlled application layout geometry.
 *
 * @public
 */
export interface MiaixzThemeLayoutGeometry {
  /**
   * Header block size in pixels.
   */
  readonly headerHeight?: number;
  /**
   * Expanded sidebar inline size in pixels.
   */
  readonly sidebarWidth?: number;
  /**
   * Compact sidebar inline size in pixels.
   */
  readonly sidebarCompactWidth?: number;
  /**
   * Maximum page content inline size in pixels.
   */
  readonly pageMaxWidth?: number;
  /**
   * Minimum page gutter in pixels.
   */
  readonly pageGutterMin?: number;
  /**
   * Maximum page gutter in pixels.
   */
  readonly pageGutterMax?: number;
  /**
   * Dialog inline size in pixels.
   */
  readonly dialogWidth?: number;
  /**
   * Drawer inline size in pixels.
   */
  readonly drawerWidth?: number;
  /**
   * Maximum popover inline size in pixels.
   */
  readonly popoverMaxWidth?: number;
  /**
   * Minimum card inline size in pixels.
   */
  readonly cardMinWidth?: number;
  /**
   * Reading width measured in characters.
   */
  readonly readingWidthCh?: number;
  /**
   * Mobile navigation block size in pixels.
   */
  readonly mobileNavigationHeight?: number;
  /**
   * Entry aside inline proportion in percent.
   */
  readonly entryAsidePercent?: number;
  /**
   * Appearance trigger positioning frame size in pixels.
   */
  readonly appearanceTriggerSize?: number;
  /**
   * Compact appearance trigger positioning frame size in pixels.
   */
  readonly appearanceTriggerCompactSize?: number;
  /**
   * Visible appearance trigger diameter in pixels, centered within its frame.
   */
  readonly appearanceTriggerVisualSize?: number;
  /**
   * Default appearance trigger block position in percent.
   */
  readonly appearanceBlockPositionPercent?: number;
}

/**
 * Defines every theme-controlled geometry branch.
 *
 * @public
 */
export interface MiaixzThemeGeometry {
  /**
   * Compact density geometry.
   */
  readonly compact?: MiaixzThemeDensityGeometry;
  /**
   * Standard density geometry.
   */
  readonly standard?: MiaixzThemeDensityGeometry;
  /**
   * Comfortable density geometry.
   */
  readonly comfortable?: MiaixzThemeDensityGeometry;
  /**
   * Application layout geometry.
   */
  readonly layout?: MiaixzThemeLayoutGeometry;
}

/**
 * Re-exports the SDK-owned density order.
 *
 * @public
 */
export { miaixzDensities };

/**
 * Freezes density geometry serialization order.
 *
 * @public
 */
export const miaixzThemeDensityGeometryFields = [
  "controlHeight",
  "controlPaddingInline",
  "controlGap",
  "panelPadding",
  "tableRowHeight",
  "itemHeight",
  "sectionGap",
] as const;

/**
 * Freezes layout geometry serialization order.
 *
 * @public
 */
export const miaixzThemeLayoutGeometryFields = [
  "headerHeight",
  "sidebarWidth",
  "sidebarCompactWidth",
  "pageMaxWidth",
  "pageGutterMin",
  "pageGutterMax",
  "dialogWidth",
  "drawerWidth",
  "popoverMaxWidth",
  "cardMinWidth",
  "readingWidthCh",
  "mobileNavigationHeight",
  "entryAsidePercent",
  "appearanceTriggerSize",
  "appearanceTriggerCompactSize",
  "appearanceTriggerVisualSize",
  "appearanceBlockPositionPercent",
] as const;

/**
 * Defines defaults for layout fields introduced after the initial theme schema.
 *
 * Existing schema-version-one themes receive these values during resolution.
 *
 * @public
 */
export const miaixzThemeLayoutGeometryDefaults = Object.freeze({
  mobileNavigationHeight: 58,
  entryAsidePercent: 55,
  appearanceTriggerSize: 52,
  appearanceTriggerCompactSize: 48,
  appearanceTriggerVisualSize: 44,
  appearanceBlockPositionPercent: 33.3333,
});

/**
 * Defines density geometry value ranges in pixels.
 *
 * @public
 */
export const miaixzThemeDensityGeometryRanges = Object.freeze({
  controlHeight: Object.freeze({ min: 24, max: 96 }),
  controlPaddingInline: Object.freeze({ min: 0, max: 64 }),
  controlGap: Object.freeze({ min: 0, max: 64 }),
  panelPadding: Object.freeze({ min: 0, max: 64 }),
  tableRowHeight: Object.freeze({ min: 24, max: 96 }),
  itemHeight: Object.freeze({ min: 24, max: 96 }),
  sectionGap: Object.freeze({ min: 0, max: 64 }),
});

/**
 * Defines layout geometry value ranges using their documented units.
 *
 * @public
 */
export const miaixzThemeLayoutGeometryRanges = Object.freeze({
  headerHeight: Object.freeze({ min: 40, max: 96, unit: "px" }),
  sidebarWidth: Object.freeze({ min: 160, max: 360, unit: "px" }),
  sidebarCompactWidth: Object.freeze({ min: 48, max: 96, unit: "px" }),
  pageMaxWidth: Object.freeze({ min: 960, max: 1920, unit: "px" }),
  pageGutterMin: Object.freeze({ min: 8, max: 40, unit: "px" }),
  pageGutterMax: Object.freeze({ min: 16, max: 64, unit: "px" }),
  dialogWidth: Object.freeze({ min: 320, max: 960, unit: "px" }),
  drawerWidth: Object.freeze({ min: 280, max: 640, unit: "px" }),
  popoverMaxWidth: Object.freeze({ min: 240, max: 600, unit: "px" }),
  cardMinWidth: Object.freeze({ min: 200, max: 480, unit: "px" }),
  readingWidthCh: Object.freeze({ min: 40, max: 100, unit: "ch" }),
  mobileNavigationHeight: Object.freeze({ min: 48, max: 96, unit: "px" }),
  entryAsidePercent: Object.freeze({ min: 35, max: 70, unit: "%" }),
  appearanceTriggerSize: Object.freeze({ min: 40, max: 72, unit: "px" }),
  appearanceTriggerCompactSize: Object.freeze({ min: 40, max: 64, unit: "px" }),
  appearanceTriggerVisualSize: Object.freeze({ min: 44, max: 72, unit: "px" }),
  appearanceBlockPositionPercent: Object.freeze({ min: 10, max: 90, unit: "%" }),
});
