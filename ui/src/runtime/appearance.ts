import {
  isMiaixzAppearanceSettings,
  isMiaixzColorMode,
  isMiaixzDensity,
  miaixzColorModes,
  miaixzDefaultAppearance,
  miaixzDensities,
  miaixzThemeColorTokens,
  parseMiaixzAppearanceSettings,
  type MiaixzAppearancePayload,
  type MiaixzAppearanceSettings,
  type MiaixzColorMode,
  type MiaixzDensity,
  type MiaixzResolvedColorMode,
  type MiaixzThemeColorOverrides,
  type MiaixzThemeColors,
  type MiaixzThemeColorToken,
  type MiaixzThemeOverrides,
} from "@miaixz/sdk/appearance";
import { applyTheme } from "../theme/apply.js";
import { ThemeCatalog } from "../theme/catalog.js";
import { mergeThemeColors } from "../theme/resolve.js";
import { serializeThemeApplication } from "../theme/serialize.js";
import { resolveMiaixzColorMode } from "../theme/theme.js";
import { validateResolvedTheme } from "../theme/validate.js";
import { miaixzTheme } from "../themes/index.js";

export {
  isMiaixzAppearanceSettings,
  isMiaixzColorMode,
  isMiaixzDensity,
  miaixzColorModes,
  miaixzDefaultAppearance,
  miaixzDensities,
  miaixzThemeColorTokens,
  parseMiaixzAppearanceSettings,
};
export type {
  MiaixzAppearancePayload,
  MiaixzAppearanceSettings,
  MiaixzColorMode,
  MiaixzDensity,
  MiaixzResolvedColorMode,
  MiaixzThemeColorOverrides,
  MiaixzThemeColors,
  MiaixzThemeColorToken,
  MiaixzThemeOverrides,
};

/**
 * Defines the deprecated default Miaixz light color map.
 *
 * @deprecated Read colors from `miaixzTheme.modes.light.colors`.
 * @public
 */
export const miaixzLightThemeColors = miaixzTheme.modes.light.colors as MiaixzThemeColors;

/**
 * Defines the deprecated default Miaixz dark color map.
 *
 * @deprecated Read colors from `miaixzTheme.modes.dark.colors`.
 * @public
 */
export const miaixzDarkThemeColors = miaixzTheme.modes.dark.colors as MiaixzThemeColors;

const legacyApplications = new WeakMap<HTMLElement, HTMLStyleElement>();

/**
 * Applies Appearance v2 through the shared theme catalog, serializer, and atomic DOM transaction.
 *
 * @deprecated Render `Theme` and use `useTheme()` instead. This forwarding API is removed in 0.7.0.
 * @param appearance - Complete Appearance v2 settings.
 * @param target - Optional theme target, or null for color-mode resolution only.
 * @param prefersDark - Optional explicit system preference.
 * @returns Concrete light or dark mode.
 * @public
 */
export function applyMiaixzAppearance(
  appearance: Readonly<MiaixzAppearanceSettings>,
  target: HTMLElement | null = typeof document === "undefined" ? null : document.documentElement,
  prefersDark?: boolean,
): MiaixzResolvedColorMode {
  const parsed = parseMiaixzAppearanceSettings(appearance);
  const mode = resolveMiaixzColorMode(parsed.colorMode, prefersDark);
  if (target === null) return mode;
  const catalog = new ThemeCatalog();
  const theme = catalog.get(parsed.theme);
  let style = legacyApplications.get(target);
  if (style === undefined) {
    style = target.ownerDocument.createElement("style");
    style.setAttribute("data-miaixz-theme-runtime", "legacy");
    target.ownerDocument.head.append(style);
    legacyApplications.set(target, style);
  }
  applyTheme(
    target,
    style,
    serializeThemeApplication(
      theme,
      mode,
      parsed.colorMode,
      parsed.density,
      parsed.overrides?.[mode],
      "legacy",
    ),
  );
  return mode;
}

/**
 * Validates merged user overrides against the selected built-in theme.
 *
 * @deprecated Theme performs this validation during its transaction.
 * @param appearance - Complete Appearance v2 settings.
 * @public
 */
export function validateMiaixzThemeContrast(appearance: Readonly<MiaixzAppearanceSettings>): void {
  const parsed = parseMiaixzAppearanceSettings(appearance);
  const theme = new ThemeCatalog().get(parsed.theme);
  validateResolvedTheme({
    ...theme,
    modes: {
      light: {
        colors: mergeThemeColors(theme.modes.light.colors, parsed.overrides?.light),
      },
      dark: {
        colors: mergeThemeColors(theme.modes.dark.colors, parsed.overrides?.dark),
      },
    },
  });
}

/**
 * Watches operating-system color preference changes in supported browsers.
 *
 * @param listener - Callback invoked with each changed concrete color mode.
 * @returns Idempotent function that removes the listener.
 * @public
 */
export function watchMiaixzSystemColorMode(
  listener: (mode: MiaixzResolvedColorMode) => void,
): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => undefined;
  }
  const query = window.matchMedia("(prefers-color-scheme: dark)");
  const handleChange = (event: MediaQueryListEvent) => listener(event.matches ? "dark" : "light");
  query.addEventListener("change", handleChange);
  let listening = true;
  return () => {
    if (!listening) return;
    listening = false;
    query.removeEventListener("change", handleChange);
  };
}
