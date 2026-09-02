import type { AnchorHTMLAttributes, ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

/**
 * Defines the supported navigation flow directions.
 *
 * @public
 */
export type NavigationOrientation = "horizontal" | "vertical";

/**
 * Configures a labeled application navigation region.
 *
 * @public
 */
export interface NavigationProps extends HTMLAttributes<HTMLElement> {
  /**
   * Supplies navigation destinations and actions.
   */
  items?: readonly NavigationEntry[];
  /**
   * Selects the standard navigation or compact rail presentation.
   *
   * @defaultValue `"default"`
   */
  variant?: "default" | "rail";
  /**
   * Selects the navigation flow direction.
   *
   * @defaultValue `"vertical"`
   */
  orientation?: NavigationOrientation;
  /**
   * Provides the required accessible navigation label.
   */
  label: string;
}

/**
 * Defines properties shared by Miaixz navigation item variants.
 *
 * @public
 */
export interface MiaixzNavigationItemBaseProps {
  /**
   * Marks the item as the active page.
   *
   * @defaultValue `false`
   */
  active?: boolean;
  /**
   * Prevents item interaction.
   *
   * @defaultValue `false`
   */
  disabled?: boolean;
  /**
   * Displays optional leading icon content.
   */
  icon?: ReactNode;
  /**
   * Supplies the visible item label.
   */
  label: ReactNode;
  /**
   * Displays compact trailing metadata.
   */
  meta?: ReactNode;
}

/**
 * Configures a link-backed Miaixz navigation item.
 *
 * @public
 */
export interface MiaixzNavigationLinkItemProps extends Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "children" | "href"
> {
  /**
   * Supplies the required navigation destination.
   */
  href: string;
}

/**
 * Configures a button-backed Miaixz navigation item.
 *
 * @public
 */
export interface MiaixzNavigationButtonItemProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "disabled"
> {
  /**
   * Keeps the item in button mode when no destination is supplied.
   */
  href?: undefined;
}

/**
 * Configures a navigation item rendered as either a link or a button.
 *
 * @public
 */
export type NavigationEntry = MiaixzNavigationItemBaseProps &
  (MiaixzNavigationLinkItemProps | MiaixzNavigationButtonItemProps);
