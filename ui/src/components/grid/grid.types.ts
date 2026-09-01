import type { HTMLAttributes } from "react";

/**
 * Configures a responsive auto-fit grid. @public
 */
export interface GridProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Selects the minimum width used by auto-fit columns.
   */
  minItemWidth?: "standard" | "wide";
}
