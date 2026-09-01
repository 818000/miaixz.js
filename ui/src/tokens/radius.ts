/**
 * Defines theme-controlled corner radii in pixels.
 *
 * @public
 */
export interface MiaixzThemeRadius {
  /**
   * Control radius in pixels.
   */
  readonly control?: number;
  /**
   * Panel radius in pixels.
   */
  readonly panel?: number;
  /**
   * Dialog radius in pixels.
   */
  readonly dialog?: number;
}

/**
 * Freezes the radius field order used by validators and serializers.
 *
 * @public
 */
export const miaixzThemeRadiusFields = ["control", "panel", "dialog"] as const;

/**
 * Defines the accepted radius range in pixels.
 *
 * @public
 */
export const miaixzThemeRadiusRange = Object.freeze({ min: 0, max: 32 });
