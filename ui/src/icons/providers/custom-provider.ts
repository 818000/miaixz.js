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
 * Implements the custom provider icon provider integration.
 */

import type { IconLoader, LazyIconProvider, LazyIconSource } from "../icon-provider.js";
import { resolveCustomProviderModule, type CustomProviderModuleExport } from "./custom-module.js";

const dependencyPattern = /^(?:@[a-z0-9][a-z0-9._-]*\/[a-z0-9][a-z0-9._-]*|[a-z0-9][a-z0-9._-]*)$/u;
const pathPattern = /^(?:\.|\.\/[a-z0-9][a-z0-9._/-]*)$/u;

/**
 * Validates a declared public dependency and export path.
 *
 * @param dependency - Installed package name.
 * @param path - Public package export path.
 */
const assertDependencyPath = (dependency: string, path: string): void => {
  if (!dependencyPattern.test(dependency)) {
    throw new TypeError(`[miaixz] Invalid icon dependency "${dependency}".`);
  }
  if (
    !pathPattern.test(path) ||
    path.includes("..") ||
    path.includes("\\") ||
    path.includes("?") ||
    path.includes("#")
  ) {
    throw new TypeError(`[miaixz] Invalid icon dependency path "${path}".`);
  }
};

/**
 * Configures a complete or partial custom provider from one public dependency path.
 */
export interface CustomIconProviderOptions {
  readonly id: string;
  readonly dependency: string;
  readonly path: string;
  readonly load: () => Promise<CustomProviderModuleExport>;
}

/**
 * Creates a lazy custom provider without accepting an arbitrary runtime path.
 *
 * @param options - Dependency-owned provider declaration.
 * @returns A validated lazy provider.
 */
export function createCustomIconProvider(options: CustomIconProviderOptions): LazyIconProvider {
  assertDependencyPath(options.dependency, options.path);
  if (!options.id.trim()) throw new TypeError("[miaixz] Custom icon provider id is required.");
  return Object.freeze({
    id: options.id,
    dependency: options.dependency,
    path: options.path,
    load: async () => resolveCustomProviderModule(await options.load()),
  });
}

/**
 * Configures one custom icon definition from one public dependency path.
 */
export interface LazyIconSourceOptions {
  readonly dependency: string;
  readonly path: string;
  readonly load: IconLoader;
}

/**
 * Creates an exact single-icon source.
 *
 * @param options - Dependency-owned icon source declaration.
 * @returns A validated lazy icon source.
 */
export function defineLazyIconSource(options: LazyIconSourceOptions): LazyIconSource {
  assertDependencyPath(options.dependency, options.path);
  return Object.freeze({ ...options });
}
