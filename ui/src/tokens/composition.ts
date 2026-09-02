/**
 * Defines registered component composition variants selected by a theme.
 *
 * @public
 */
export interface MiaixzThemeComposition {
  /**
   * Entry-page composition.
   */
  readonly entry?: "split" | "centered";
  /**
   * Application-shell navigation composition.
   */
  readonly shell?: "rail" | "sidebar";
  /**
   * Panel composition.
   */
  readonly panel?: "outlined" | "separated";
}

/**
 * Freezes composition field order.
 *
 * @public
 */
export const miaixzThemeCompositionFields = ["entry", "shell", "panel"] as const;

/**
 * Defines the only registered value set for each composition field.
 *
 * @public
 */
export const miaixzThemeCompositionValues = Object.freeze({
  entry: Object.freeze(["split", "centered"] as const),
  shell: Object.freeze(["rail", "sidebar"] as const),
  panel: Object.freeze(["outlined", "separated"] as const),
});

/**
 * Defines schema-version-one composition defaults.
 *
 * @public
 */
export const miaixzThemeCompositionDefaults = Object.freeze({
  entry: "split",
  shell: "rail",
  panel: "outlined",
} as const satisfies Required<MiaixzThemeComposition>);
