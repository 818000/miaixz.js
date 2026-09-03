import type { MiaixzThemeTokens } from "../theme/theme.types.js";
import { miaixzThemeOpacityDefaults } from "../tokens/opacity.js";
import { defineTheme } from "../theme/define.js";
import type { MiaixzThemeDefinition } from "../theme/theme.types.js";

/**
 * Defines the non-color baseline shared by the three built-in themes.
 *
 * Built-in themes only vary their color maps. Custom themes may still override
 * any of these tokens through a complete Theme Definition.
 *
 * @internal
 */
export const miaixzSharedThemeTokens = {
  opacity: miaixzThemeOpacityDefaults,
  composition: {
    entry: "split",
    shell: "rail",
    panel: "outlined",
  },
  typography: {
    familySans:
      '"Avenir Next", "PingFang SC", "Noto Sans CJK SC", -apple-system, BlinkMacSystemFont, "Microsoft YaHei", system-ui, sans-serif',
    familyMono: '"SFMono-Regular", Menlo, Consolas, "Liberation Mono", monospace',
    captionSize: 12,
    captionLineHeight: 18,
    bodySize: 14,
    bodyLineHeight: 22,
    sectionTitleSize: 16,
    sectionTitleLineHeight: 24,
    pageTitleSize: 20,
    pageTitleLineHeight: 28,
    metricSize: 24,
    metricLineHeight: 32,
    displaySize: 32,
    displayLineHeight: 40,
  },
  radius: { control: 4, panel: 4, dialog: 8 },
  shadow: {
    low: { y: 1, blur: 2, spread: 0 },
    medium: { y: 6, blur: 18, spread: 0 },
    high: { y: 16, blur: 36, spread: 0 },
    overlay: { y: 24, blur: 64, spread: 0 },
  },
  geometry: {
    compact: {
      controlHeight: 32,
      controlPaddingInline: 12,
      controlGap: 8,
      panelPadding: 12,
      tableRowHeight: 36,
      itemHeight: 32,
      sectionGap: 16,
    },
    standard: {
      controlHeight: 40,
      controlPaddingInline: 16,
      controlGap: 8,
      panelPadding: 16,
      tableRowHeight: 44,
      itemHeight: 40,
      sectionGap: 24,
    },
    comfortable: {
      controlHeight: 48,
      controlPaddingInline: 20,
      controlGap: 12,
      panelPadding: 20,
      tableRowHeight: 52,
      itemHeight: 48,
      sectionGap: 32,
    },
    layout: {
      headerHeight: 65,
      sidebarWidth: 240,
      sidebarCompactWidth: 65,
      pageMaxWidth: 1440,
      pageGutterMin: 16,
      pageGutterMax: 32,
      dialogWidth: 560,
      drawerWidth: 400,
      popoverMaxWidth: 360,
      cardMinWidth: 280,
      readingWidthCh: 72,
      mobileNavigationHeight: 58,
      entryAsidePercent: 55,
      appearanceTriggerSize: 52,
      appearanceTriggerCompactSize: 48,
      appearanceTriggerVisualSize: 44,
      appearanceBlockPositionPercent: 33.3333,
    },
  },
  surfaces: {
    page: { background: "background", foreground: "text-primary", border: "border" },
    header: { background: "surface-chrome", foreground: "text-primary", border: "border" },
    sidebar: {
      background: "surface-chrome",
      foreground: "text-primary",
      border: "border",
    },
    panel: { background: "surface", foreground: "text-primary", border: "border" },
    control: { background: "surface", foreground: "text-primary", border: "border" },
    overlay: {
      background: "surface",
      foreground: "text-primary",
      border: "border-strong",
    },
    selected: {
      background: "surface-selected",
      foreground: "text-primary",
      border: "brand",
    },
  },
} as const satisfies MiaixzThemeTokens;

/**
 * Defines one built-in theme while keeping non-color tokens in this shared module.
 *
 * @param definition - Built-in identity and light/dark color layers.
 * @returns Validated immutable built-in theme.
 * @internal
 */
export function defineBuiltInTheme(
  definition: Omit<MiaixzThemeDefinition, "tokens">,
): Readonly<MiaixzThemeDefinition> {
  return defineTheme({ ...definition, tokens: miaixzSharedThemeTokens });
}
