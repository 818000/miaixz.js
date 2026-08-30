import type { InputHTMLAttributes, ReactNode } from "react";

/**
 * Configures an accessible native boolean switch.
 *
 * @public
 */
export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "type"> {
  /**
   * Displays the primary switch label.
   */
  label?: ReactNode;
  /**
   * Displays supporting descriptive content.
   */
  description?: ReactNode;
}
