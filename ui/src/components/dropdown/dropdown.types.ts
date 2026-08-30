import type { AnchorHTMLAttributes, ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

import type { PopoverProps } from "../popover/index.js";

/**
 * Configures a disclosure-based dropdown menu.
 *
 * @public
 */
export interface DropdownProps extends Omit<PopoverProps, "contentClassName"> {
  /**
   * Provides the accessible menu label.
   */
  label?: string;
}

/**
 * Defines properties shared by Miaixz dropdown item variants.
 *
 * @public
 */
export interface MiaixzDropdownItemBaseProps {
  /**
   * Displays optional leading icon content.
   */
  icon?: ReactNode;
  /**
   * Displays supporting item description content.
   */
  description?: ReactNode;
  /**
   * Applies the destructive-action treatment.
   *
   * @defaultValue `false`
   */
  danger?: boolean;
  /**
   * Displays the selected-item indicator.
   *
   * @defaultValue `false`
   */
  selected?: boolean;
}

/**
 * Configures a link-backed Miaixz dropdown item.
 *
 * @public
 */
export interface MiaixzDropdownAnchorItemProps extends Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "href"
> {
  /**
   * Supplies the required link destination.
   */
  href: string;
}

/**
 * Configures a button-backed Miaixz dropdown item.
 *
 * @public
 */
export interface MiaixzDropdownButtonItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Keeps the item in button mode when no destination is supplied.
   */
  href?: undefined;
}

/**
 * Configures a dropdown item rendered as either a link or a button.
 *
 * @public
 */
export type DropdownItemProps = MiaixzDropdownItemBaseProps &
  (MiaixzDropdownAnchorItemProps | MiaixzDropdownButtonItemProps);

/**
 * Configures a non-interactive label within a dropdown menu.
 *
 * @public
 */
export interface DropdownLabelProps extends HTMLAttributes<HTMLDivElement> {}

/**
 * Configures a semantic divider within a dropdown menu.
 *
 * @public
 */
export interface DropdownDividerProps extends HTMLAttributes<HTMLHRElement> {}
