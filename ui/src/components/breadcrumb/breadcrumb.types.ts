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
}

/**
 * Configures one destination in a breadcrumb trail.
 *
 * @public
 */
export interface BreadcrumbItemProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
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
