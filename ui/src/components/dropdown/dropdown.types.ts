/*
 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
 ~                                                                           ~
 ~ Copyright (c) 2015-2026 miaixz.org and other contributors.                ~
 ~                                                                           ~
 ~ Licensed under the Apache License, Version 2.0 (the "License");           ~
 ~ you may not use this file except in compliance with the License.          ~
 ~ You may obtain a copy of the License at                                   ~
 ~                                                                           ~
 ~      https://www.apache.org/licenses/LICENSE-2.0                          ~
 ~                                                                           ~
 ~ Unless required by applicable law or agreed to in writing, software       ~
 ~ distributed under the License is distributed on an "AS IS" BASIS,         ~
 ~ WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  ~
 ~ See the License for the specific language governing permissions and       ~
 ~ limitations under the License.                                            ~
 ~                                                                           ~
 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
*/

import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

import type { PopoverProps } from "../popover/index.js";

interface DropdownBase {
  /**
   * Emphasizes an action without changing its semantic color.
   *
   * @defaultValue `false`
   */
  emphasis?: boolean;
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
   *
   * @defaultValue `false`
   */
  danger?: boolean;
  /**
   * Marks the item as selected.
   *
   * @defaultValue `false`
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
   * Selects the original disclosure menu or a neutral action-list density.
   *
   * @defaultValue `"default"`
   */
  variant?: "default" | "plain" | "compact";
  /**
   * Adds a class to the rendered dropdown surface.
   */
  contentClassName?: string;
  /**
   * Provides the menu's accessible name.
   */
  label?: string;
  /**
   * Supplies declarative menu rows.
   */
  items?: readonly DropdownEntry[];
}
