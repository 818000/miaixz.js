/**
 * Defines one structured shadow level in pixels.
 *
 * @public
 */
export interface MiaixzThemeShadowLevel {
  /**
   * Vertical offset in pixels.
   */
  readonly y: number;
  /**
   * Blur radius in pixels.
   */
  readonly blur: number;
  /**
   * Spread radius in pixels.
   */
  readonly spread: number;
}

/**
 * Defines theme-controlled elevation levels.
 *
 * @public
 */
export interface MiaixzThemeShadow {
  /**
   * Low elevation shadow.
   */
  readonly low?: MiaixzThemeShadowLevel;
  /**
   * Medium elevation shadow.
   */
  readonly medium?: MiaixzThemeShadowLevel;
  /**
   * High elevation shadow.
   */
  readonly high?: MiaixzThemeShadowLevel;
  /**
   * Overlay elevation shadow.
   */
  readonly overlay?: MiaixzThemeShadowLevel;
}

/**
 * Freezes the shadow level order used by validators and serializers.
 *
 * @public
 */
export const miaixzThemeShadowLevels = ["low", "medium", "high", "overlay"] as const;

/**
 * Freezes the fields of a structured shadow level.
 *
 * @public
 */
export const miaixzThemeShadowFields = ["y", "blur", "spread"] as const;

/**
 * Defines the accepted shadow value ranges in pixels.
 *
 * @public
 */
export const miaixzThemeShadowRanges = Object.freeze({
  y: Object.freeze({ min: -32, max: 32 }),
  blur: Object.freeze({ min: 0, max: 96 }),
  spread: Object.freeze({ min: -32, max: 32 }),
});
