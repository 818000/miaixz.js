import type { HTMLAttributes, ReactNode } from "react";

/**
 * Selects the narrow-screen navigation presentation.
 *
 * @public
 */
export type ShellMobileNavigationMode = "bottom" | "drawer";

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
   * Selects viewport-contained main scrolling (`fixed`) or document scrolling (`scroll`).
   * Fixed mode keeps the header and navigation outside the main scroll region.
   * Both modes suppress vertical boundary bounce while preserving normal scrolling.
   * Nested sticky content can consume `--miaixz-shell-content-sticky-offset`.
   *
   * @defaultValue `"fixed"`
   */
  headerBehavior?: "fixed" | "scroll";
  /**
   * Overrides the shell navigation composition registered by the active theme.
   */
  navigationVariant?: "collapsible" | "rail" | "sidebar";
  /**
   * Expands a collapsible navigation rail to the theme sidebar width.
   *
   * @defaultValue `false`
   */
  navigationExpanded?: boolean;
  /**
   * Selects bottom navigation or a sidebar drawer on narrow screens.
   *
   * @defaultValue `"bottom"`
   */
  mobileNavigationMode?: ShellMobileNavigationMode;
  /**
   * Labels the drawer backdrop control for assistive technology.
   */
  navigationDismissLabel?: string;
  /**
   * Closes the narrow-screen navigation drawer.
   */
  onNavigationDismiss?: () => void;
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
