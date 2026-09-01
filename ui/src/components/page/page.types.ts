import type { HTMLAttributes } from "react";

/**
 * Configures the standard page container. @public
 */
export interface PageProps extends HTMLAttributes<HTMLElement> {
  /**
   * Removes the standard maximum content width.
   */
  fullWidth?: boolean;
}
