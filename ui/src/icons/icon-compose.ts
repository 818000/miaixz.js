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

import type { IconLoader, IconProviderModule, LazyIconProvider } from "./icon-provider.js";

/**
 * Combines providers with explicit left-to-right precedence.
 *
 * @param primary - Highest-priority provider.
 * @param fallbacks - Providers consulted in order for missing names.
 * @returns A lazy provider containing the merged mappings.
 */
export function composeIconProviders(
  primary: LazyIconProvider,
  ...fallbacks: readonly LazyIconProvider[]
): LazyIconProvider {
  const providers = [primary, ...fallbacks];
  const id = `compose(${providers.map((provider) => provider.id).join(",")})`;
  return Object.freeze({
    id,
    dependency: "@miaixz/ui",
    path: "./icons",
    load: async (): Promise<IconProviderModule> => {
      const modules = await Promise.all(providers.map((provider) => provider.load()));
      const icons: Record<string, IconLoader> = {};
      for (const module of [...modules].reverse()) Object.assign(icons, module.icons);
      return Object.freeze({ id, icons });
    },
  });
}
