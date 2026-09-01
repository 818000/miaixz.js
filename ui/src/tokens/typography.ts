/**
 * Defines theme-controlled typography families.
 *
 * @public
 */
export interface MiaixzThemeTypography {
  /**
   * Sans-serif font-family list.
   */
  readonly familySans?: string;
  /**
   * Monospace font-family list.
   */
  readonly familyMono?: string;
}

/**
 * Freezes the theme typography field order used by validators and serializers.
 *
 * @public
 */
export const miaixzThemeTypographyFields = ["familySans", "familyMono"] as const;

/**
 * Defines the immutable component base font size in pixels.
 *
 * @public
 */
export const miaixzBaseFontSize = 14;

/**
 * Defines the immutable component base line height in pixels.
 *
 * @public
 */
export const miaixzBaseLineHeight = 22;

/**
 * Defines the accepted font-family string length range.
 *
 * @public
 */
export const miaixzThemeFontFamilyLength = Object.freeze({ min: 1, max: 256 });
