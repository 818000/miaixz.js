import type { HTMLAttributes } from "react";

/**
 * Configures a responsive two-column split layout. @public
 */
export interface SplitProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Selects the relative column widths.
   */
  ratio?: "equal" | "primary" | "secondary";
}
