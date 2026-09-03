/**
 * Lists the color modes supported by the Miaixz interface.
 *
 * @public
 */
export const miaixzColorModes = ["light", "dark", "system"] as const;

/**
 * Lists the interface density modes supported by Miaixz.
 *
 * @public
 */
export const miaixzDensities = ["compact", "standard", "comfortable"] as const;

/**
 * Represents a configured Miaixz color mode.
 *
 * @public
 */
export type MiaixzColorMode = (typeof miaixzColorModes)[number];

/**
 * Represents a concrete color mode after resolving system preference.
 *
 * @public
 */
export type MiaixzResolvedColorMode = Exclude<MiaixzColorMode, "system">;

/**
 * Represents a supported Miaixz interface density.
 *
 * @public
 */
export type MiaixzDensity = (typeof miaixzDensities)[number];

/**
 * Lists color tokens that may be customized through appearance settings.
 *
 * @public
 */
export const miaixzThemeColorTokens = [
  "brand",
  "on-brand",
  "brand-hover",
  "brand-active",
  "brand-strong",
  "brand-soft",
  "brand-soft-hover",
  "background",
  "surface",
  "surface-secondary",
  "surface-chrome",
  "surface-hover",
  "surface-active",
  "surface-selected",
  "text-primary",
  "text-secondary",
  "text-muted",
  "text-disabled",
  "text-inverse",
  "border",
  "border-strong",
  "focus",
  "success",
  "success-soft",
  "warning",
  "warning-soft",
  "danger",
  "danger-soft",
  "info",
  "info-soft",
  "backdrop",
  "shadow",
  "shadow-strong",
  "selection",
  "data-1",
  "data-2",
  "data-3",
  "data-4",
  "data-5",
  "data-6",
  "data-7",
  "data-8",
  "data-neutral",
] as const;

/**
 * Represents the name of a customizable Miaixz theme color token.
 *
 * @public
 */
export type MiaixzThemeColorToken = (typeof miaixzThemeColorTokens)[number];

/**
 * Maps theme color tokens to valid CSS color values.
 *
 * @public
 */
export type MiaixzThemeColors = Readonly<Record<MiaixzThemeColorToken, string>>;

/**
 * Maps an optional subset of theme color tokens to hexadecimal overrides.
 *
 * @public
 */
export type MiaixzThemeColorOverrides = Readonly<Partial<Record<MiaixzThemeColorToken, string>>>;

/**
 * Separates user color overrides by resolved color mode.
 *
 * @public
 */
export interface MiaixzThemeOverrides {
  /**
   * Overrides applied while the resolved color mode is light.
   */
  readonly light?: MiaixzThemeColorOverrides;

  /**
   * Overrides applied while the resolved color mode is dark.
   */
  readonly dark?: MiaixzThemeColorOverrides;
}

/**
 * Configures visual preferences shared across Miaixz applications.
 *
 * @public
 */
export interface MiaixzAppearanceSettings {
  /**
   * Identifies the selected theme.
   */
  readonly theme: string;

  /**
   * Preferred light, dark, or system color mode.
   */
  readonly colorMode: MiaixzColorMode;

  /**
   * Preferred interface density.
   */
  readonly density: MiaixzDensity;

  /**
   * Contains optional light and dark user color overrides.
   */
  readonly overrides?: MiaixzThemeOverrides;
}

/**
 * Wraps appearance settings for versioned persistence and event transport.
 *
 * @public
 */
export interface MiaixzAppearancePayload {
  /**
   * Identifies the frozen appearance payload schema.
   *
   * @defaultValue 2
   */
  readonly schemaVersion: 2;

  /**
   * Contains the validated appearance settings snapshot.
   */
  readonly value: MiaixzAppearanceSettings;
}
