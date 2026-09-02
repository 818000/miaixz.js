import type { HTMLAttributes, ReactNode } from "react";

/**
 * Configures a labeled group inside an expandable application navigation rail.
 *
 * @public
 */
export interface NavigationRailGroupProps extends HTMLAttributes<HTMLElement> {
  /**
   * Supplies the group label revealed when the containing rail is expanded.
   */
  readonly label: ReactNode;
  /**
   * Displays a compact divider that transitions into the group label.
   *
   * @defaultValue `false`
   */
  readonly separated?: boolean;
}
