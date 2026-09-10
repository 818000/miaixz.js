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

import type { NavigationEntry } from "./navigation.types.js";

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
 * Selects how a navigation rail handles destinations that do not fit.
 *
 * @public
 */
export type NavigationRailOverflowMode = "scroll" | "adaptive";

/**
 * Adds stable identity and overflow policy to one rail destination.
 *
 * @public
 */
export type NavigationRailItem = NavigationEntry & {
  /**
   * Stable identity used while destinations move in and out of overflow.
   */
  readonly id: string;
  /**
   * Keeps the destination in the rail whenever a usable row remains.
   */
  readonly overflow?: "auto" | "never";
  /**
   * Keeps higher-priority destinations visible before lower-priority ones.
   */
  readonly priority?: number;
};

/**
 * Describes one labeled group in an adaptive navigation rail.
 *
 * @public
 */
export interface NavigationRailGroupModel {
  /**
   * Stable group identity.
   */
  readonly id: string;
  /**
   * Group label revealed in expanded rails and overflow menus.
   */
  readonly label: ReactNode;
  /**
   * Direct destinations belonging to this group.
   */
  readonly items: readonly NavigationRailItem[];
  /**
   * Places persistent context-switching destinations next to rail utility content.
   */
  readonly placement?: "start" | "end";
}

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
  readonly navigation?: ReactNode;
  /**
   * Supplies structured destinations for adaptive overflow handling.
   * When present, this replaces `navigation`.
   */
  readonly groups?: readonly NavigationRailGroupModel[];
  /**
   * Selects legacy scrolling or height-aware overflow collection.
   * Structured `groups` default to adaptive mode; opaque `navigation` defaults to scrolling.
   *
   * @defaultValue `"adaptive"` for `groups`, otherwise `"scroll"`
   */
  readonly overflowMode?: NavigationRailOverflowMode;
  /**
   * Labels the disclosure that contains destinations which do not fit.
   */
  readonly overflowLabel?: string;
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
