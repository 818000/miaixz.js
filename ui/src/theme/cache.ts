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

import { MiaixzThemeError } from "./errors.js";
import { parseTheme } from "./parse.js";
import type { MiaixzThemeDefinition, MiaixzThemeLoader } from "./types.js";

/**
 * Maintains one Theme instance's in-memory loader cache and in-flight requests.
 */
export class ThemeCache {
  readonly #values = new Map<string, Readonly<MiaixzThemeDefinition>>();
  readonly #keys = new Map<string, string>();
  readonly #inflight = new Map<string, Promise<Readonly<MiaixzThemeDefinition>>>();

  /**
   * Loads, parses, validates, and caches one target theme.
   *
   * @param name - Exact requested theme ID.
   * @param loader - Instance loader.
   * @param signal - Request cancellation signal.
   * @returns First successfully cached definition for the ID.
   */
  load(
    name: string,
    loader: MiaixzThemeLoader,
    signal: AbortSignal,
  ): Promise<Readonly<MiaixzThemeDefinition>> {
    const cached = this.#values.get(name);
    if (cached !== undefined) return Promise.resolve(cached);
    const pending = this.#inflight.get(name);
    if (pending !== undefined) return pending;
    const request = loader(name, { signal })
      .then((value) => {
        if (signal.aborted) throw new MiaixzThemeError("UI_THEME_LOAD_ABORTED", { theme: name });
        const theme = parseTheme(value);
        if (theme.name !== name) {
          throw new MiaixzThemeError("UI_THEME_INVALID", {
            theme: name,
            details: { reason: "loader-name-mismatch" },
          });
        }
        const key = `${theme.name}:${theme.schemaVersion}:${theme.version}`;
        const first = this.#values.get(name);
        if (first !== undefined) return first;
        this.#values.set(name, theme);
        this.#keys.set(name, key);
        return theme;
      })
      .catch((cause: unknown) => {
        if (cause instanceof MiaixzThemeError) throw cause;
        throw new MiaixzThemeError(
          signal.aborted ? "UI_THEME_LOAD_ABORTED" : "UI_THEME_LOAD_FAILED",
          {
            theme: name,
            cause,
          },
        );
      })
      .finally(() => {
        if (this.#inflight.get(name) === request) this.#inflight.delete(name);
      });
    this.#inflight.set(name, request);
    return request;
  }

  /**
   * Returns the immutable successful cache key for one theme.
   *
   * @param name - Theme identifier.
   * @returns Name-schema-version key, or undefined when uncached.
   */
  key(name: string): string | undefined {
    return this.#keys.get(name);
  }

  /**
   * Releases every cached definition and in-flight reference on unmount.
   */
  clear(): void {
    this.#values.clear();
    this.#keys.clear();
    this.#inflight.clear();
  }
}
