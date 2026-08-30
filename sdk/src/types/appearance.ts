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
  "background",
  "surface",
  "surface-secondary",
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
export type MiaixzThemeColors = Partial<Readonly<Record<MiaixzThemeColorToken, string>>>;

/**
 * Configures visual preferences shared across Miaixz applications.
 *
 * @public
 */
export interface MiaixzAppearanceSettings {
  /**
   * Preferred light, dark, or system color mode.
   */
  readonly colorMode: MiaixzColorMode;

  /**
   * Preferred interface density.
   */
  readonly density: MiaixzDensity;

  /**
   * Optional theme color overrides keyed by semantic token.
   */
  readonly colors?: MiaixzThemeColors;
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
   * @defaultValue 1
   */
  readonly schemaVersion: 1;

  /**
   * Contains the validated appearance settings snapshot.
   */
  readonly value: MiaixzAppearanceSettings;
}
