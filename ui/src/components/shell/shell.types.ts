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
   * Selects whether the header remains pinned or scrolls with content.
   *
   * @defaultValue `"fixed"`
   */
  headerBehavior?: "fixed" | "scroll";
  /**
   * Overrides the shell navigation composition registered by the active theme.
   */
  navigationVariant?: "rail" | "sidebar";
  /**
   * Supplies optional narrow-screen bottom navigation.
   */
  mobileNavigation?: ReactNode;
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
  /**
   * Adds a class to the mobile navigation region.
   */
  mobileNavigationClassName?: string;
}
