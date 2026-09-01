import type { InputHTMLAttributes, ReactNode } from "react";

import type { MiaixzFormPreviewProps } from "../shared.types.js";

/**
 * Configures a native checkbox with optional supporting content.
 *
 * @public
 */
export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "type">, MiaixzFormPreviewProps {
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
  /**
   * Applies the invalid state independently of `aria-invalid`.
   */
  invalid?: boolean;
}
