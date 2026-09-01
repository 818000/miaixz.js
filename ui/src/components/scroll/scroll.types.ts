import type { HTMLAttributes } from "react";

/**
 * Configures a bounded overflow region. @public
 */
export interface ScrollProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Provides an accessible label for the scroll region.
   */
  label?: string;
}
