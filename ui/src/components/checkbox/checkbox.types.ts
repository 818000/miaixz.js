import type { InputHTMLAttributes, ReactNode } from "react";

/**
 * Configures a native checkbox with optional supporting content.
 *
 * @public
 */
export interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "size" | "type"
> {
  /**
   * Displays the primary checkbox label.
   */
  label?: ReactNode;
  /**
   * Displays supporting descriptive content.
   */
  description?: ReactNode;
  /**
   * Displays the native mixed-selection state.
   *
   * @defaultValue `false`
   */
  indeterminate?: boolean;
}
