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

import type { IconDefinitionModule } from "./icon-definition.js";
import type { IconName } from "./icon-names.js";

/**
 * Loads one provider-neutral icon definition.
 */
export type IconLoader = () => Promise<IconDefinitionModule>;

/**
 * Defines a loaded provider mapping.
 */
export interface IconProviderModule {
  readonly id: string;
  readonly icons: Readonly<Partial<Record<IconName, IconLoader>>>;
}

/**
 * Describes a provider whose mapping module is loaded only when selected.
 */
export interface LazyIconProvider {
  readonly id: string;
  readonly dependency: string;
  readonly path: string;
  readonly load: () => Promise<IconProviderModule>;
}

/**
 * Describes an individual icon imported from a public dependency path.
 */
export interface LazyIconSource {
  readonly dependency: string;
  readonly path: string;
  readonly load: IconLoader;
}

/**
 * Configures the immutable icon registry.
 */
export interface IconRegistryOptions {
  readonly defaultProvider?: LazyIconProvider;
  readonly icons?: Readonly<Partial<Record<IconName, LazyIconSource | LazyIconProvider>>>;
  readonly fallback?: IconName;
}

/**
 * Returns whether a configured override is a provider rather than a single icon source.
 *
 * @param value - Configured provider or exact icon source.
 * @returns Whether the value is a lazy provider.
 */
export const isLazyIconProvider = (
  value: LazyIconSource | LazyIconProvider,
): value is LazyIconProvider => "id" in value;
