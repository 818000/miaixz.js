import type { InputHTMLAttributes } from "react";

import type { MiaixzFormPreviewProps } from "../shared.types.js";

/**
 * Configures the Miaixz range control.
 *
 * @public
 */
export interface RangeProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "type">, MiaixzFormPreviewProps {
  /**
   * Applies the invalid state independently of `aria-invalid`.
   */
  invalid?: boolean;
}
