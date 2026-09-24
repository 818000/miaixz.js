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
 * Implements the icon registry UI module.
 */

import { assertIconDefinition, type IconDefinition } from "./icon-definition.js";
import { isIconName, type IconName } from "./icon-names.js";
import {
  isLazyIconProvider,
  type IconProviderModule,
  type IconRegistryOptions,
  type LazyIconProvider,
  type LazyIconSource,
} from "./icon-provider.js";
import { lucideProvider } from "./providers/lucide-provider.js";

interface PendingIcon {
  readonly status: "pending";
  readonly promise: Promise<void>;
}

interface ResolvedIcon {
  readonly status: "resolved";
  readonly definition: IconDefinition;
}

interface FailedIcon {
  readonly status: "failed";
}

type IconResource = PendingIcon | ResolvedIcon | FailedIcon;

/**
 * Exposes the immutable icon-resolution surface consumed by React.
 */
export interface IconRegistry {
  readonly defaultProvider: LazyIconProvider;
  readonly fallback: IconName;
  read(name: IconName): IconDefinition | null;
  preload(names: readonly IconName[]): Promise<void>;
}

const reportOnce = (() => {
  const reported = new Set<string>();
  return (key: string, message: string): void => {
    if (reported.has(key)) return;
    reported.add(key);
    console.error(message);
  };
})();

/**
 * Creates a request-safe icon registry with deterministic source resolution.
 *
 * @param options - Default provider, exact overrides, and invalid-name fallback.
 * @returns An immutable registry facade.
 */
export function createIconRegistry(options: IconRegistryOptions = {}): IconRegistry {
  const defaultProvider = options.defaultProvider ?? lucideProvider;
  const overrides = Object.freeze({ ...(options.icons ?? {}) });
  const fallback = options.fallback ?? "help";
  const resources = new Map<IconName, IconResource>();
  const providerModules = new WeakMap<LazyIconProvider, Promise<IconProviderModule>>();

  const loadProvider = (provider: LazyIconProvider): Promise<IconProviderModule> => {
    const cached = providerModules.get(provider);
    if (cached) return cached;
    const pending = provider.load().then((module) => {
      if (module.id !== provider.id) {
        throw new TypeError(
          `[miaixz] Icon provider id mismatch: expected "${provider.id}", received "${module.id}".`,
        );
      }
      return module;
    });
    providerModules.set(provider, pending);
    return pending;
  };

  const resolveSource = async (name: IconName): Promise<IconDefinition> => {
    const override: LazyIconSource | LazyIconProvider | undefined = overrides[name];
    if (override && !isLazyIconProvider(override)) {
      return assertIconDefinition((await override.load()).default);
    }
    const provider = override ?? defaultProvider;
    const module = await loadProvider(provider);
    const loader = module.icons[name];
    if (!loader) {
      throw new TypeError(
        `[miaixz] Icon provider "${provider.id}" does not define standard icon "${name}".`,
      );
    }
    return assertIconDefinition((await loader()).default);
  };

  const begin = (name: IconName): Promise<void> => {
    const current = resources.get(name);
    if (current?.status === "pending") return current.promise;
    if (current?.status === "resolved" || current?.status === "failed") return Promise.resolve();
    const promise = resolveSource(name).then(
      (definition) => {
        resources.set(name, { status: "resolved", definition });
      },
      (error: unknown) => {
        resources.set(name, { status: "failed" });
        reportOnce(
          `load:${defaultProvider.id}:${name}`,
          `[miaixz] Unable to load icon "${name}": ${String(error)}`,
        );
      },
    );
    resources.set(name, { status: "pending", promise });
    return promise;
  };

  const registry: IconRegistry = {
    defaultProvider,
    fallback,
    /**
     * Reads a resolved definition or suspends while its provider loads.
     *
     * @param name - Standard icon name to resolve.
     * @returns The resolved definition or an error placeholder signal.
     */
    read(name) {
      const resolvedName = isIconName(name) ? name : fallback;
      if (resolvedName !== name) {
        reportOnce(
          `name:${String(name)}`,
          `[miaixz] Unknown icon name "${String(name)}"; using "${fallback}".`,
        );
      }
      const current = resources.get(resolvedName);
      if (current?.status === "resolved") return current.definition;
      if (current?.status === "failed") return null;
      const pending = begin(resolvedName);
      throw current?.status === "pending" ? current.promise : pending;
    },
    /**
     * Loads a set of standard names before rendering.
     *
     * @param names - Standard names to preload.
     * @returns A promise completed after every requested load settles.
     */
    async preload(names) {
      await Promise.all(names.map((name) => begin(name)));
    },
  };
  return Object.freeze(registry);
}
