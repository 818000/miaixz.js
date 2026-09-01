import type { SelectHTMLAttributes } from "react";

import type { MiaixzFormPreviewProps } from "../shared.types.js";

/**
 * Defines the supported Miaixz select sizes.
 *
 * @public
 */
export type SelectSize = "small" | "medium" | "large";

/**
 * Configures a form-compatible Miaixz select control.
 *
 * Native option children and change-event behavior are retained while the
 * visible trigger and option surface use the shared Miaixz interaction system.
 *
 * @public
 */
export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size">, MiaixzFormPreviewProps {
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
  /**
   * Prevents selection changes while keeping the trigger discoverable and focusable.
   *
   * @defaultValue `false`
   */
  readOnly?: boolean;
}
