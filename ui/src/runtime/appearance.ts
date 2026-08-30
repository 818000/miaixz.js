import {
  miaixzThemeColorTokens,
  parseMiaixzAppearanceSettings,
  type MiaixzAppearanceSettings,
  type MiaixzColorMode,
  type MiaixzResolvedColorMode,
} from "@miaixz/sdk/appearance";

export {
  isMiaixzAppearanceSettings,
  isMiaixzColorMode,
  isMiaixzDensity,
  miaixzColorModes,
  miaixzDarkThemeColors,
  miaixzDefaultAppearance,
  miaixzDensities,
  miaixzLightThemeColors,
  miaixzThemeColorTokens,
  parseMiaixzAppearanceSettings,
  validateMiaixzThemeContrast,
} from "@miaixz/sdk/appearance";
export type {
  MiaixzAppearancePayload,
  MiaixzAppearanceSettings,
  MiaixzColorMode,
  MiaixzDensity,
  MiaixzResolvedColorMode,
  MiaixzThemeColors,
  MiaixzThemeColorToken,
} from "@miaixz/sdk/appearance";

/**
 * Resolves a color preference to a concrete light or dark mode.
 *
 * @param colorMode - Configured light, dark, or system preference.
 * @param prefersDark - Optional explicit system dark-mode result.
 * @returns Concrete light or dark mode.
 * @public
 */
export function resolveMiaixzColorMode(
  colorMode: MiaixzColorMode,
  prefersDark = readSystemDarkPreference(),
): MiaixzResolvedColorMode {
  return colorMode === "system" ? (prefersDark ? "dark" : "light") : colorMode;
}

/**
 * Validates and atomically applies appearance attributes and custom colors to a DOM target.
 *
 * @param appearance - Appearance settings to validate and apply.
 * @param target - Optional target element, null for resolution without DOM writes.
 * @param prefersDark - Optional explicit system dark-mode result.
 * @returns Concrete light or dark mode applied or resolved.
 * @throws MiaixzSdkError When the appearance syntax, colors, or contrast are invalid.
 * @public
 */
export function applyMiaixzAppearance(
  appearance: Readonly<MiaixzAppearanceSettings>,
  target: HTMLElement | null = typeof document === "undefined" ? null : document.documentElement,
  prefersDark?: boolean,
): MiaixzResolvedColorMode {
  const parsed = parseMiaixzAppearanceSettings(appearance);
  const resolvedMode = resolveMiaixzColorMode(
    parsed.colorMode,
    prefersDark ?? readSystemDarkPreference(),
  );
  if (target === null) return resolvedMode;

  const attributes = [
    ["data-miaixz-color-mode", resolvedMode],
    ["data-miaixz-color-preference", parsed.colorMode],
    ["data-miaixz-density", parsed.density],
  ] as const;
  const previousAttributes = attributes.map(([name]) => [name, target.getAttribute(name)] as const);
  const previousColors = miaixzThemeColorTokens.map((token) => {
    const property = `--miaixz-color-${token}`;
    return [
      property,
      target.style.getPropertyValue(property),
      target.style.getPropertyPriority(property),
    ] as const;
  });

  try {
    for (const [name, value] of attributes) target.setAttribute(name, value);
    for (const token of miaixzThemeColorTokens) {
      const property = `--miaixz-color-${token}`;
      const color = parsed.colors?.[token];
      if (color === undefined) target.style.removeProperty(property);
      else target.style.setProperty(property, color);
    }
  } catch (error) {
    restoreAppearanceTarget(target, previousAttributes, previousColors);
    throw error;
  }

  return resolvedMode;
}

/**
 * Watches operating-system color preference changes in supported browsers.
 *
 * @param listener - Callback invoked with each changed concrete color mode.
 * @returns An idempotent function that removes the system listener.
 * @public
 */
export function watchMiaixzSystemColorMode(
  listener: (mode: MiaixzResolvedColorMode) => void,
): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => undefined;
  }
  const query = window.matchMedia("(prefers-color-scheme: dark)");
  if (
    typeof query.addEventListener !== "function" ||
    typeof query.removeEventListener !== "function"
  ) {
    return () => undefined;
  }
  const handleChange = (event: MediaQueryListEvent) => listener(event.matches ? "dark" : "light");
  query.addEventListener("change", handleChange);
  let listening = true;
  return () => {
    if (!listening) return;
    listening = false;
    query.removeEventListener("change", handleChange);
  };
}

/**
 * Reads the current system dark-mode preference with an SSR-safe fallback.
 *
 * @returns Whether the current browser reports a dark preference.
 */
function readSystemDarkPreference(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

/**
 * Restores attributes and custom properties after a failed DOM mutation.
 *
 * @param target - Partially modified DOM element.
 * @param attributes - Attribute names and their original values.
 * @param colors - CSS custom properties with original values and priorities.
 */
function restoreAppearanceTarget(
  target: HTMLElement,
  attributes: readonly (readonly [string, string | null])[],
  colors: readonly (readonly [string, string, string])[],
): void {
  try {
    for (const [name, value] of attributes) {
      if (value === null) target.removeAttribute(name);
      else target.setAttribute(name, value);
    }
    for (const [property, value, priority] of colors) {
      if (value.length === 0) target.style.removeProperty(property);
      else target.style.setProperty(property, value, priority);
    }
  } catch {
    // The original DOM mutation error remains the only observable failure.
  }
}
