import type { HTMLAttributes, ReactNode } from "react";

/**
 * Configures the root application shell. @public
 */
export interface ShellProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Supplies the application header.
   */
  header: ReactNode;
  /**
   * Supplies the primary navigation sidebar.
   */
  sidebar: ReactNode;
  /**
   * Adds a class to the main content region.
   */
  mainClassName?: string;
  /**
   * Adds a class to the header region.
   */
  headerClassName?: string;
  /**
   * Adds a class to the sidebar region.
   */
  sidebarClassName?: string;
}
