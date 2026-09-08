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
