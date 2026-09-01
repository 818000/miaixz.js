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
   * Adds a class to the main content region.
   */
  contentClassName?: string;
}
