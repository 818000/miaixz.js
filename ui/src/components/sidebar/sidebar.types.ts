import type { HTMLAttributes, ReactNode } from "react";

/**
 * Configures a local sidebar and content layout. @public
 */
export interface SidebarProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Supplies the sidebar content.
   */
  sidebar: ReactNode;
  /**
   * Provides an accessible label for the sidebar.
   */
  sidebarLabel?: string;
  /**
   * Keeps the sidebar visible while its content scrolls.
   */
  stickySidebar?: boolean;
  /**
   * Collapses this sidebar when the viewport enters the selected range or a
   * narrower range. Omitting the property preserves the default tablet collapse.
   */
  collapseAt?: "compactDesktop";
  /** Selects the public local-sidebar width preset. */
  size?: "default" | "wide";
  /**
   * Adds a class to the main content region.
   */
  contentClassName?: string;
}
