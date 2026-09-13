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

import { MiaixzSdkError } from "../errors/errors.js";
import { canonicalizeLocale, getBaseLanguage, type MiaixzLocale } from "./locale-catalog.js";
import {
  createI18nContractError,
  isMessages,
  validateNamespace,
  type MiaixzMessageModule,
  type MiaixzMessages,
} from "./messages.js";

/**
 * Represents direct messages or a dynamically imported language module.
 *
 * @public
 */
export type MiaixzMessageLoaderResult = MiaixzMessages | MiaixzMessageModule;

/**
 * Loads project-owned messages for one namespace and locale.
 *
 * @public
 */
export type MiaixzMessageLoader = (
  namespace: string,
  locale: MiaixzLocale,
) => Promise<MiaixzMessageLoaderResult>;

/**
 * Maps namespaces and locales to project-owned dynamic import functions.
 *
 * @public
 */
export type MiaixzMessageLoaderMap = Readonly<
  Record<string, Readonly<Record<MiaixzLocale, () => Promise<MiaixzMessageLoaderResult>>>>
>;

/**
 * Extracts messages from a direct object or an ES module default export.
 *
 * @param value - Loader result to normalize.
 * @returns Runtime message collection awaiting namespace validation.
 */
export function unwrapMessages(value: MiaixzMessageLoaderResult): MiaixzMessages {
  if (typeof value === "object" && value !== null && !Array.isArray(value) && "default" in value) {
    if (isMessages(value.default)) return value.default;
    throw createI18nContractError("I18N_MESSAGES_INVALID");
  }
  if (isMessages(value)) return value;
  throw createI18nContractError("I18N_MESSAGES_INVALID");
}

/**
 * Finds an exact or base-language loader in deterministic key order.
 *
 * @param namespace - Message namespace.
 * @param locale - Canonical requested locale.
 * @param loaders - Namespace and locale loader map.
 * @returns Matching dynamic import function when registered.
 */
function resolveLoader(
  namespace: string,
  locale: MiaixzLocale,
  loaders: MiaixzMessageLoaderMap,
): (() => Promise<MiaixzMessageLoaderResult>) | undefined {
  const namespaceLoaders = loaders[namespace];
  if (!namespaceLoaders) return undefined;
  for (const [candidate, loader] of Object.entries(namespaceLoaders)) {
    if (canonicalizeLocale(candidate) === locale) return loader;
  }
  const language = getBaseLanguage(locale);
  return Object.entries(namespaceLoaders)
    .map(([candidate, loader]) => ({ locale: canonicalizeLocale(candidate), loader }))
    .sort((left, right) => left.locale.localeCompare(right.locale))
    .find((candidate) => getBaseLanguage(candidate.locale) === language)?.loader;
}

/**
 * Creates a deduplicating loader from project-owned language module mappings.
 * Failed imports are evicted so a later call can retry them.
 *
 * @param loaders - Namespace and locale keys mapped to dynamic import functions.
 * @returns Message loader implementing exact and base-language lookup.
 * @public
 */
export function createMiaixzMessageLoader(loaders: MiaixzMessageLoaderMap): MiaixzMessageLoader {
  const cache = new Map<string, Promise<MiaixzMessageLoaderResult>>();
  return (namespace, locale) => {
    const validNamespace = validateNamespace(namespace);
    const canonicalLocale = canonicalizeLocale(locale);
    const cacheKey = `${validNamespace}\u0000${canonicalLocale}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;
    const loader = resolveLoader(validNamespace, canonicalLocale, loaders);
    const pending = Promise.resolve()
      .then(() => (loader ? loader() : {}))
      .catch((error: unknown) => {
        cache.delete(cacheKey);
        throw error;
      });
    cache.set(cacheKey, pending);
    return pending;
  };
}

/**
 * Error raised when a project language file fails to load or validate.
 *
 * @public
 */
export class MiaixzI18nLoadError extends MiaixzSdkError {
  /**
   * Contains the canonical locale whose language file failed.
   */
  readonly locale: MiaixzLocale;

  /**
   * Contains the namespace whose language file failed.
   */
  readonly namespace: string;

  /**
   * Creates a project language-file loading error.
   *
   * @param locale - Canonical requested locale.
   * @param namespace - Requested message namespace.
   * @param cause - Original loader or validation error.
   */
  constructor(locale: MiaixzLocale, namespace: string, cause?: unknown) {
    super({ code: "I18N_LOAD_FAILED", cause, details: { locale, namespace } });
    this.name = "MiaixzI18nLoadError";
    this.locale = locale;
    this.namespace = namespace;
  }
}
