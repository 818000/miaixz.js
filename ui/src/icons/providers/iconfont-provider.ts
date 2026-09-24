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

import type { LazyIconProvider } from "../icon-provider.js";
import { createCustomIconProvider } from "./custom-provider.js";
import { createIconfontModule, type IconfontManifest } from "./iconfont-module.js";

/**
 * Configures an Iconfont provider from one exported manifest.
 */
export interface IconfontProviderOptions {
  readonly id: string;
  readonly dependency: string;
  readonly path: string;
  readonly load: () => Promise<{ readonly default: IconfontManifest } | IconfontManifest>;
}

/**
 * Creates a local, lazily loaded Iconfont provider.
 *
 * @param options - Dependency-owned Iconfont manifest declaration.
 * @returns A validated lazy Iconfont provider.
 */
export function createIconfontProvider(options: IconfontProviderOptions): LazyIconProvider {
  return createCustomIconProvider({
    id: options.id,
    dependency: options.dependency,
    path: options.path,
    load: async () => {
      const loaded = await options.load();
      const manifest = "default" in loaded ? loaded.default : loaded;
      return createIconfontModule(options.id, manifest);
    },
  });
}

export type { IconfontManifest } from "./iconfont-module.js";
