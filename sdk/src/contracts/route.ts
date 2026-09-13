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

import { isMiaixzModulePermission } from "./permission.js";

/**
 * Describes a route contributed by a remotely loaded Miaixz module.
 *
 * @public
 */
export interface MiaixzModuleRoute {
  /**
   * Module-local route identifier.
   */
  readonly id: string;

  /**
   * Slash-relative path joined to the module base path.
   */
  readonly path: string;

  /**
   * Internationalization key used for the route title.
   */
  readonly titleKey: string;

  /**
   * Optional permissions required before the route is made available.
   */
  readonly requiredPermissions?: readonly string[];
}

/**
 * Validates IDs used by modules, routes, and navigation items.
 *
 * @param value - Identifier candidate to inspect.
 * @returns Whether the value satisfies the frozen kebab-case identifier grammar.
 */
export function isMiaixzModuleIdentifier(value: unknown): value is string {
  return typeof value === "string" && /^[a-z][a-z0-9-]{1,63}$/.test(value);
}

/**
 * Validates a module base path or slash-relative route path.
 *
 * @param value - Path candidate to inspect.
 * @returns Whether the path is static, absolute-path-shaped, and normalized.
 */
export function isMiaixzModulePath(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    (value === "/" || !value.endsWith("/")) &&
    !value.includes(":") &&
    !value.includes("?") &&
    !value.includes("#")
  );
}

/**
 * Validates the required-permission list attached to a route or manifest.
 *
 * @param value - Permission-list candidate to inspect.
 * @returns Whether every item is a non-wildcard module permission.
 */
export function isMiaixzModulePermissionList(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every(isMiaixzModulePermission);
}
