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

/**
 * Describes a navigation item contributed by a remotely loaded Miaixz module.
 *
 * @public
 */
export interface MiaixzModuleNavigationItem {
  /**
   * Module-local navigation item identifier.
   */
  readonly id: string;

  /**
   * Identifier of a route declared by the same manifest.
   */
  readonly routeId: string;

  /**
   * Internationalization key used for the navigation label.
   */
  readonly labelKey: string;

  /**
   * Optional UI icon name interpreted by the host application.
   */
  readonly icon?: string;

  /**
   * Numeric position used before the identifier tie-breaker.
   */
  readonly order: number;
}

/**
 * Compares navigation items using the frozen order and identifier sort rules.
 *
 * @param first - First navigation item to compare.
 * @param second - Second navigation item to compare.
 * @returns Negative, zero, or positive sort result.
 */
export function compareMiaixzModuleNavigation(
  first: MiaixzModuleNavigationItem,
  second: MiaixzModuleNavigationItem,
): number {
  return first.order - second.order || first.id.localeCompare(second.id);
}
