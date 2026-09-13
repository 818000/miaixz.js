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

/**
 * Identifies a locale supported by the Miaixz internationalization runtime.
 *
 * @public
 */
export type MiaixzLocale = string;

/**
 * Defines the writing direction used by one locale.
 *
 * @public
 */
export type MiaixzLocaleDirection = "ltr" | "rtl";

/**
 * Defines one trusted developer-authored locale extension.
 *
 * @public
 */
export interface MiaixzLocaleDefinition {
  /**
   * Locale definition schema version.
   */
  readonly schemaVersion: 1;

  /**
   * Stable canonical BCP 47 locale identifier.
   */
  readonly id: MiaixzLocale;

  /**
   * Native human-readable language label.
   */
  readonly label: string;

  /**
   * Compact language label used by constrained controls.
   */
  readonly shortLabel: string;

  /**
   * Semantic version of the locale metadata and resources.
   */
  readonly version: string;

  /**
   * Writing direction applied while this locale is active.
   *
   * @defaultValue `"ltr"`
   */
  readonly direction?: MiaixzLocaleDirection;

  /**
   * Additional canonical locale identifiers that resolve to this definition.
   */
  readonly aliases?: readonly MiaixzLocale[];

  /**
   * Additional native or translated search terms.
   */
  readonly keywords?: readonly string[];

  /**
   * Locale consulted before the runtime-wide fallback locale.
   */
  readonly fallback?: MiaixzLocale;

  /**
   * Optional namespace loader owned by this locale extension.
   */
  readonly loadMessages?: import("./message-loader.js").MiaixzMessageLoader;
}

/**
 * Describes one locale exposed by the active runtime catalog.
 *
 * @public
 */
export interface MiaixzLocaleDescriptor {
  /**
   * Stable canonical BCP 47 locale identifier.
   */
  readonly id: MiaixzLocale;

  /**
   * Native human-readable language label.
   */
  readonly label: string;

  /**
   * Compact language label used by constrained controls.
   */
  readonly shortLabel: string;

  /**
   * Semantic version of the locale metadata and resources.
   */
  readonly version: string;

  /**
   * Writing direction applied while this locale is active.
   */
  readonly direction: MiaixzLocaleDirection;

  /**
   * Canonical locale aliases resolved by the catalog.
   */
  readonly aliases: readonly MiaixzLocale[];

  /**
   * Additional native or translated search terms.
   */
  readonly keywords: readonly string[];

  /**
   * Optional locale-specific resource fallback.
   */
  readonly fallback?: MiaixzLocale;

  /**
   * Catalog source category.
   */
  readonly source: "builtin" | "registered";
}

/**
 * Validates and deeply freezes one trusted developer-authored locale definition.
 *
 * @param value - Locale definition to validate.
 * @returns Detached immutable locale definition.
 * @public
 */
export function defineLocale(value: MiaixzLocaleDefinition): Readonly<MiaixzLocaleDefinition> {
  if (
    typeof value !== "object" ||
    value === null ||
    value.schemaVersion !== 1 ||
    typeof value.label !== "string" ||
    value.label.trim().length === 0 ||
    typeof value.shortLabel !== "string" ||
    value.shortLabel.trim().length === 0 ||
    typeof value.version !== "string" ||
    value.version.trim().length === 0 ||
    (value.direction !== undefined && value.direction !== "ltr" && value.direction !== "rtl") ||
    (value.loadMessages !== undefined && typeof value.loadMessages !== "function")
  ) {
    throw new MiaixzSdkError({ code: "I18N_LOCALE_DEFINITION_INVALID" });
  }

  const id = canonicalizeLocale(value.id);
  const aliases = normalizeLocaleAliases(value.aliases ?? [], id);
  const keywords = normalizeLocaleKeywords(value.keywords ?? []);
  const fallback = value.fallback === undefined ? undefined : canonicalizeLocale(value.fallback);

  return Object.freeze({
    schemaVersion: 1,
    id,
    label: value.label.trim(),
    shortLabel: value.shortLabel.trim(),
    version: value.version.trim(),
    direction: value.direction ?? "ltr",
    aliases,
    keywords,
    ...(fallback === undefined ? {} : { fallback }),
    ...(value.loadMessages === undefined ? {} : { loadMessages: value.loadMessages }),
  });
}

/**
 * Provides the built-in selectable locale definitions.
 *
 * @public
 */
export const miaixzBuiltInLocales: readonly Readonly<MiaixzLocaleDefinition>[] = Object.freeze([
  defineLocale({
    schemaVersion: 1,
    id: "zh-CN",
    label: "简体中文",
    shortLabel: "中",
    version: "1.0.0",
    direction: "ltr",
    aliases: ["zh", "zh-Hans"],
    keywords: ["中文", "简体", "Chinese", "Simplified Chinese"],
    fallback: "en-US",
  }),
  defineLocale({
    schemaVersion: 1,
    id: "en-US",
    label: "English",
    shortLabel: "EN",
    version: "1.0.0",
    direction: "ltr",
    aliases: ["en"],
    keywords: ["English", "英语", "英文"],
  }),
]);

/**
 * Maintains one atomic, ordered, instance-local locale catalog.
 *
 * @public
 */
export class MiaixzLocaleCatalog {
  readonly #definitions = new Map<MiaixzLocale, Readonly<MiaixzLocaleDefinition>>();
  readonly #aliases = new Map<MiaixzLocale, MiaixzLocale>();
  #descriptors: readonly MiaixzLocaleDescriptor[] = Object.freeze([]);

  /**
   * Creates a catalog containing built-ins followed by trusted registered locales.
   *
   * @param locales - Optional application-registered locale definitions.
   */
  constructor(locales: readonly MiaixzLocaleDefinition[] = []) {
    this.#registerBatch(miaixzBuiltInLocales, "builtin");
    if (locales.length > 0) this.#registerBatch(locales, "registered");
  }

  /**
   * Reports whether a locale or alias exists.
   *
   * @param locale - Locale identifier or alias.
   * @returns Whether the locale can be resolved.
   */
  has(locale: MiaixzLocale): boolean {
    return this.resolve(locale) !== undefined;
  }

  /**
   * Resolves a locale identifier, alias, or base language.
   *
   * @param locale - Locale identifier to resolve.
   * @returns Matching frozen definition when available.
   */
  resolve(locale: MiaixzLocale): Readonly<MiaixzLocaleDefinition> | undefined {
    const canonical = canonicalizeLocale(locale);
    const direct = this.#definitions.get(canonical);
    if (direct !== undefined) return direct;
    const alias = this.#aliases.get(canonical);
    if (alias !== undefined) return this.#definitions.get(alias);
    const language = getBaseLanguage(canonical);
    return [...this.#definitions.values()].find(
      (definition) => getBaseLanguage(definition.id) === language,
    );
  }

  /**
   * Returns immutable descriptors in stable registration order.
   *
   * @returns Ordered frozen descriptors.
   */
  descriptors(): readonly MiaixzLocaleDescriptor[] {
    return this.#descriptors;
  }

  /**
   * Validates and atomically commits one definition batch.
   *
   * @param locales - Candidate locale definitions.
   * @param source - Descriptor source category.
   */
  #registerBatch(
    locales: readonly MiaixzLocaleDefinition[],
    source: MiaixzLocaleDescriptor["source"],
  ): void {
    const definitions = new Map(this.#definitions);
    const aliases = new Map(this.#aliases);
    const descriptors = [...this.#descriptors];

    for (const candidate of locales) {
      const locale = defineLocale(candidate);
      if (definitions.has(locale.id) || aliases.has(locale.id)) {
        throw new MiaixzSdkError({ code: "I18N_LOCALE_DUPLICATE" });
      }
      for (const alias of locale.aliases ?? []) {
        if (definitions.has(alias) || aliases.has(alias)) {
          throw new MiaixzSdkError({ code: "I18N_LOCALE_DUPLICATE" });
        }
      }
      definitions.set(locale.id, locale);
      for (const alias of locale.aliases ?? []) aliases.set(alias, locale.id);
      descriptors.push(
        Object.freeze({
          id: locale.id,
          label: locale.label,
          shortLabel: locale.shortLabel,
          version: locale.version,
          direction: locale.direction ?? "ltr",
          aliases: locale.aliases ?? Object.freeze([]),
          keywords: locale.keywords ?? Object.freeze([]),
          ...(locale.fallback === undefined ? {} : { fallback: locale.fallback }),
          source,
        }),
      );
    }

    this.#definitions.clear();
    this.#aliases.clear();
    for (const [id, definition] of definitions) this.#definitions.set(id, definition);
    for (const [alias, id] of aliases) this.#aliases.set(alias, id);
    this.#descriptors = Object.freeze(descriptors);
  }
}

/**
 * Canonicalizes a BCP 47 locale identifier.
 *
 * @param locale - Locale candidate to canonicalize.
 * @returns Canonical BCP 47 locale identifier.
 * @throws MiaixzSdkError When the locale is invalid.
 */
export function canonicalizeLocale(locale: MiaixzLocale): MiaixzLocale {
  if (typeof locale !== "string" || locale.length === 0) {
    throw new MiaixzSdkError({ code: "I18N_LOCALE_INVALID" });
  }
  try {
    const canonical = Intl.getCanonicalLocales(locale)[0];
    if (!canonical) {
      throw new MiaixzSdkError({ code: "I18N_LOCALE_INVALID" });
    }
    return canonical;
  } catch (error) {
    if (error instanceof MiaixzSdkError) throw error;
    throw new MiaixzSdkError({ code: "I18N_LOCALE_INVALID" });
  }
}

/**
 * Canonicalizes, deduplicates, and freezes locale aliases.
 *
 * @param aliases - Alias candidates supplied by a locale definition.
 * @param id - Canonical locale identifier that aliases must not repeat.
 * @returns Frozen canonical alias collection.
 */
function normalizeLocaleAliases(
  aliases: readonly MiaixzLocale[],
  id: MiaixzLocale,
): readonly MiaixzLocale[] {
  if (!Array.isArray(aliases)) {
    throw new MiaixzSdkError({ code: "I18N_LOCALE_DEFINITION_INVALID" });
  }
  const normalized = [...new Set(aliases.map(canonicalizeLocale))];
  if (normalized.includes(id)) {
    throw new MiaixzSdkError({ code: "I18N_LOCALE_DEFINITION_INVALID" });
  }
  return Object.freeze(normalized);
}

/**
 * Trims, deduplicates, and freezes locale search keywords.
 *
 * @param keywords - Search keyword candidates.
 * @returns Frozen non-empty keyword collection.
 */
function normalizeLocaleKeywords(keywords: readonly string[]): readonly string[] {
  if (!Array.isArray(keywords) || keywords.some((keyword) => typeof keyword !== "string")) {
    throw new MiaixzSdkError({ code: "I18N_LOCALE_DEFINITION_INVALID" });
  }
  const normalized = [...new Set(keywords.map((keyword) => keyword.trim()).filter(Boolean))];
  return Object.freeze(normalized);
}

/**
 * Returns the base language portion of a canonical locale.
 *
 * @param locale - Canonical locale identifier.
 * @returns Lowercase base language.
 */
export function getBaseLanguage(locale: MiaixzLocale): string {
  return locale.split("-")[0]?.toLowerCase() ?? locale.toLowerCase();
}

/**
 * Resolves and canonicalizes the browser's preferred locale.
 *
 * @returns Browser locale, or `en-US` in non-browser runtimes.
 * @public
 */
export function getMiaixzBrowserLocale(): MiaixzLocale {
  return canonicalizeLocale(
    typeof navigator === "undefined" ? "en-US" : navigator.language || "en-US",
  );
}
