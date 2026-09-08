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

import type {
  HTMLAttributes,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from "react";

/**
 * Configures the responsive table framing container.
 *
 * @public
 */
export interface TableContainerProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Removes the outer frame without disabling table scrolling.
   *
   * @defaultValue `"default"`
   */
  frame?: "default" | "plain";
  /**
   * Selects the existing panel background or an explicitly transparent surface.
   *
   * @defaultValue `"default"`
   */
  surface?: "default" | "transparent";
}

/**
 * Configures a semantic data table.
 *
 * @public
 */
export interface TableProps extends TableHTMLAttributes<HTMLTableElement> {
  /**
   * Selects the default, dashed, or compact semantic table presentation.
   *
   * @defaultValue `"default"`
   */
  variant?: "default" | "dashed" | "compact";
  /**
   * Keeps header rows visible within the table scroll container.
   *
   * @defaultValue `false`
   */
  stickyHeader?: boolean;
}

/**
 * Configures the table header section.
 *
 * @public
 */
export interface TableHeaderProps extends HTMLAttributes<HTMLTableSectionElement> {}

/**
 * Configures the table body section.
 *
 * @public
 */
export interface TableBodyProps extends HTMLAttributes<HTMLTableSectionElement> {}

/**
 * Configures the table footer section.
 *
 * @public
 */
export interface TableFooterProps extends HTMLAttributes<HTMLTableSectionElement> {}

/**
 * Configures one semantic table row.
 *
 * @public
 */
export interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  /**
   * Applies the selected-row treatment.
   *
   * @defaultValue `false`
   */
  selected?: boolean;
}

/**
 * Configures a semantic table heading cell.
 *
 * @public
 */
export interface TableHeadProps extends ThHTMLAttributes<HTMLTableCellElement> {
  /**
   * Aligns and formats the heading as numeric content.
   *
   * @defaultValue `false`
   */
  numeric?: boolean;
  /**
   * Aligns the heading with an action column.
   *
   * @defaultValue `false`
   */
  actions?: boolean;
}

/**
 * Configures a standard table data cell.
 *
 * @public
 */
export interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  /**
   * Presents this cell as an empty-result message.
   *
   * @defaultValue `false`
   */
  empty?: boolean;
  /**
   * Aligns and formats the cell as numeric content.
   *
   * @defaultValue `false`
   */
  numeric?: boolean;
  /**
   * Aligns the cell as an action column.
   *
   * @defaultValue `false`
   */
  actions?: boolean;
}

/**
 * Configures an accessible table caption.
 *
 * @public
 */
export interface TableCaptionProps extends HTMLAttributes<HTMLTableCaptionElement> {}
