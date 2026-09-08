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

import type { HTMLAttributes, ReactNode } from "react";

/**
 * Defines one item inside a grouped read-only collection. @public
 */
export interface GroupedListItem {
  /**
   * Uniquely identifies the item within its group.
   */
  readonly id: string;
  /**
   * Supplies the primary item label.
   */
  readonly title: ReactNode;
  /**
   * Supplies supporting item information.
   */
  readonly description?: ReactNode;
}

/**
 * Defines one labeled group inside a grouped read-only collection. @public
 */
export interface GroupedListGroup {
  /**
   * Uniquely identifies the group.
   */
  readonly id: string;
  /**
   * Supplies the visible group label.
   */
  readonly label: ReactNode;
  /**
   * Supplies optional group metadata such as an item count.
   */
  readonly count?: ReactNode;
  /**
   * Supplies the items in the group.
   */
  readonly items: readonly GroupedListItem[];
  /**
   * Supplies fallback content when the group has no visible items.
   */
  readonly empty?: ReactNode;
}

/**
 * Configures a grouped read-only collection. @public
 */
export interface GroupedListProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /**
   * Supplies the labeled collection groups.
   */
  readonly groups: readonly GroupedListGroup[];
  /**
   * Selects whether groups flow as horizontal columns or stacked label-and-content rows.
   * @defaultValue "rows"
   */
  readonly layout?: "columns" | "rows";
  /**
   * Selects the semantic heading level for group labels.
   */
  readonly headingLevel?: 2 | 3 | 4 | 5 | 6;
}
