import type { InputHTMLAttributes, ReactNode } from "react";

/**
 * Configures a labeled native radio control.
 *
 * @public
 */
export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "type"> {
  /**
   * Displays the primary radio label.
   */
  label?: ReactNode;
  /**
   * Displays supporting descriptive content.
   */
  description?: ReactNode;
}
