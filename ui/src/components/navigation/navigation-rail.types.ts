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
 * Identifies the styleable regions of an application navigation rail.
 *
 * @public
 */
export type NavigationRailSlot = "root" | "header" | "toggle" | "brand" | "body" | "utility";

/**
 * Supplies classes for individual navigation rail regions.
 *
 * @public
 */
export type NavigationRailClassNames = Partial<Readonly<Record<NavigationRailSlot, string>>>;

/**
 * Selects the visual treatment of an application navigation rail.
 *
 * @public
 */
export type NavigationRailVariant = "default" | "brand";

/**
 * Configures a single-level application navigation rail.
 *
 * @public
 */
export interface NavigationRailProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Adds classes to the rail regions without depending on internal selectors.
   */
  readonly classNames?: NavigationRailClassNames;
  /**
   * Supplies the brand destination revealed beside the toggle when expanded.
   */
  readonly brand: ReactNode;
  /**
   * Supplies the control that expands or collapses the rail.
   */
  readonly toggle: ReactNode;
  /**
   * Supplies the direct, single-level navigation content.
   */
  readonly navigation: ReactNode;
  /**
   * Reveals the brand and navigation labels without adding another menu level.
   *
   * @defaultValue `false`
   */
  readonly expanded?: boolean;
  /**
   * Selects the rail's visual treatment.
   *
   * @defaultValue `"default"`
   */
  readonly variant?: NavigationRailVariant;
  /**
   * Supplies optional account or utility actions at the bottom of the rail.
   * The utility stays in the compact icon column when the rail expands.
   */
  readonly utility?: ReactNode;
}
