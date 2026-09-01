import type { HTMLAttributes } from "react";

/**
 * Configures a wrapping inline cluster layout. @public
 */
export interface ClusterProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Aligns items along the inline axis.
   */
  justify?: "start" | "between" | "end";
}
