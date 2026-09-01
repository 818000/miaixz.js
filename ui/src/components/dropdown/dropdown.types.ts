import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

import type { PopoverProps } from "../popover/index.js";

interface DropdownBase {
  /**
   * Displays leading icon content.
   */
  icon?: ReactNode;
  /**
   * Displays supporting text below the label.
   */
  description?: ReactNode;
  /**
   * Applies the destructive-action treatment.
   */
  danger?: boolean;
  /**
   * Marks the item as selected.
   */
  selected?: boolean;
}

type DropdownLink = DropdownBase &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children" | "href"> & {
    /**
     * Identifies a selectable item row.
     */
    kind?: "item";
    /**
     * Supplies the visible item label.
     */
    label: ReactNode;
    /**
     * Navigates to this location when selected.
     */
    href: string;
  };

type DropdownButton = DropdownBase &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
    /**
     * Identifies a selectable item row.
     */
    kind?: "item";
    /**
     * Supplies the visible item label.
     */
    label: ReactNode;
    /**
     * Distinguishes button items from link items.
     */
    href?: undefined;
  };

/**
 * Defines one declarative dropdown row. @public
 */
export type DropdownEntry =
  | DropdownLink
  | DropdownButton
  | {
      /**
       * Identifies a non-interactive group label.
       */
      kind: "label";
      /**
       * Supplies the group label content.
       */
      label: ReactNode;
    }
  | {
      /**
       * Identifies a visual separator.
       */
      kind: "divider";
    };

/**
 * Configures a disclosure-based dropdown menu. @public
 */
export interface DropdownProps extends Omit<PopoverProps, "contentClassName"> {
  /**
   * Provides the menu's accessible name.
   */
  label?: string;
  /**
   * Supplies declarative menu rows.
   */
  items?: readonly DropdownEntry[];
}
