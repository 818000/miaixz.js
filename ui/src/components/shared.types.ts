/**
 * Defines semantic feedback tones shared by Miaixz components.
 *
 * @public
 */
export type MiaixzFeedbackTone = "neutral" | "info" | "success" | "warning" | "danger";

/**
 * Defines semantic component sizes shared by Miaixz components.
 *
 * @public
 */
export type MiaixzComponentSize = "small" | "medium" | "large";

/**
 * Defines the form-control state rendered by component previews and visual
 * regression fixtures. Runtime semantics continue to come from native control
 * properties such as `disabled`, `readOnly`, and `aria-invalid`.
 *
 * @public
 */
export type MiaixzFormPreviewState =
  "default" | "filled" | "hover" | "focus" | "invalid" | "readonly" | "disabled";

/**
 * Adds a non-semantic state override for documentation and visual testing.
 * Products should normally omit this property and rely on real interaction.
 *
 * @public
 */
export interface MiaixzFormPreviewProps {
  /**
   * Renders one form state without changing native semantics.
   */
  previewState?: MiaixzFormPreviewState;
}
