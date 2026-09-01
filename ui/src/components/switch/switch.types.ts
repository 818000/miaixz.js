import type { InputHTMLAttributes, ReactNode } from "react";

import type { MiaixzFormPreviewProps } from "../shared.types.js";

/**
 * Configures an accessible native boolean switch.
 *
 * @public
 */
export interface SwitchProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "type">, MiaixzFormPreviewProps {
  /**
   * Displays the primary switch label.
   */
  label?: ReactNode;
  /**
   * Displays supporting descriptive content.
   */
  description?: ReactNode;
  /**
   * Applies the invalid state independently of `aria-invalid`.
   */
  invalid?: boolean;
}
