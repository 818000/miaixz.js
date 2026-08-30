import type { HTMLAttributes, ReactNode } from "react";

/**
 * Configures the root application shell.
 *
 * @public
 */
export interface AppShellProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Supplies global header content.
   */
  header: ReactNode;
  /**
   * Supplies global navigation content.
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

/**
 * Configures the standard page container.
 *
 * @public
 */
export interface PageProps extends HTMLAttributes<HTMLElement> {
  /**
   * Removes the page maximum-width constraint.
   *
   * @defaultValue `false`
   */
  fullWidth?: boolean;
}

/**
 * Configures a page title and action region.
 *
 * @public
 */
export interface PageHeaderProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  /**
   * Supplies the page heading.
   */
  title: ReactNode;
  /**
   * Displays compact context above the heading.
   */
  eyebrow?: ReactNode;
  /**
   * Displays supporting page description content.
   */
  description?: ReactNode;
  /**
   * Displays page-level actions.
   */
  actions?: ReactNode;
  /**
   * Selects the semantic heading level.
   *
   * @defaultValue `1`
   */
  headingLevel?: 1 | 2 | 3;
}

/**
 * Configures the primary page content region.
 *
 * @public
 */
export interface PageBodyProps extends HTMLAttributes<HTMLDivElement> {}

/**
 * Configures a page-level toolbar.
 *
 * @public
 */
export interface PageToolbarProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Supplies leading filters, search, or contextual content.
   */
  leading?: ReactNode;
  /**
   * Supplies trailing toolbar actions.
   */
  actions?: ReactNode;
  /**
   * Keeps the toolbar visible within its scrolling container.
   *
   * @defaultValue `false`
   */
  sticky?: boolean;
}

/**
 * Configures a vertical stack layout.
 *
 * @public
 */
export interface StackProps extends HTMLAttributes<HTMLDivElement> {}

/**
 * Configures a wrapping inline cluster layout.
 *
 * @public
 */
export interface ClusterProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Selects the horizontal distribution of items.
   *
   * @defaultValue `"start"`
   */
  justify?: "start" | "between" | "end";
}

/**
 * Configures a responsive auto-fit grid.
 *
 * @public
 */
export interface GridProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Selects the minimum responsive item width.
   *
   * @defaultValue `"standard"`
   */
  minItemWidth?: "standard" | "wide";
}

/**
 * Configures a responsive two-column split layout.
 *
 * @public
 */
export interface SplitLayoutProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Selects the relative width of the two regions.
   *
   * @defaultValue `"equal"`
   */
  ratio?: "equal" | "primary" | "secondary";
}

/**
 * Configures a local sidebar and content layout.
 *
 * @public
 */
export interface SidebarLayoutProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Supplies the local sidebar content.
   */
  sidebar: ReactNode;
  /**
   * Overrides the localized sidebar landmark label.
   */
  sidebarLabel?: string;
  /**
   * Keeps the sidebar visible while its content scrolls.
   *
   * @defaultValue `true`
   */
  stickySidebar?: boolean;
  /**
   * Adds a class to the main content region.
   */
  contentClassName?: string;
}

/**
 * Configures a bounded overflow region.
 *
 * @public
 */
export interface ScrollRegionProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Provides an accessible region label and landmark role.
   */
  label?: string;
}

/**
 * Configures a sticky content wrapper.
 *
 * @public
 */
export interface StickyProps extends HTMLAttributes<HTMLDivElement> {}
