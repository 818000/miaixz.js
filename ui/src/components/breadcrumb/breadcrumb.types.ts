import type { AnchorHTMLAttributes, HTMLAttributes, ReactNode } from "react";

/**
 * Configures a breadcrumb navigation landmark.
 *
 * @public
 */
export interface BreadcrumbProps extends HTMLAttributes<HTMLElement> {
  /**
   * Provides the accessible navigation label.
   */
  label?: string;
  /**
   * Supplies the ordered breadcrumb destinations.
   */
  items?: readonly BreadcrumbEntry[];
}

/**
 * Configures one destination in a breadcrumb trail.
 *
 * @public
 */
export interface BreadcrumbEntry extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children"> {
  /**
   * Supplies the visible destination label.
   */
  label: ReactNode;
  /**
   * Marks the item as the current page instead of a link.
   *
   * @defaultValue `false`
   */
  current?: boolean;
  /**
   * Displays optional leading icon content.
   */
  icon?: ReactNode;
}
