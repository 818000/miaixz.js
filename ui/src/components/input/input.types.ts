import type { InputHTMLAttributes, ReactNode } from "react";

/**
 * Defines the supported single-line input sizes.
 *
 * @public
 */
export type InputSize = "small" | "medium" | "large";

/**
 * Configures a single-line native input wrapper.
 *
 * @public
 */
export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  /**
   * Selects the control size.
   *
   * @defaultValue `"medium"`
   */
  size?: InputSize;
  /**
   * Applies the invalid state independently of `aria-invalid`.
   *
   * @defaultValue `false`
   */
  invalid?: boolean;
  /**
   * Displays content before the native input.
   */
  startAdornment?: ReactNode;
  /**
   * Displays content after the native input.
   */
  endAdornment?: ReactNode;
}
