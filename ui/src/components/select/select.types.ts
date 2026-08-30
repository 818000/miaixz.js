import type { SelectHTMLAttributes } from "react";

/**
 * Defines the supported native select sizes.
 *
 * @public
 */
export type SelectSize = "small" | "medium" | "large";

/**
 * Configures a styled native select control.
 *
 * @public
 */
export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  /**
   * Selects the control size.
   *
   * @defaultValue `"medium"`
   */
  size?: SelectSize;
  /**
   * Applies the invalid state independently of `aria-invalid`.
   *
   * @defaultValue `false`
   */
  invalid?: boolean;
}
