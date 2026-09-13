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

import {
  canonicalizeLocale,
  getMiaixzBrowserLocale,
  MiaixzLocaleCatalog,
  type MiaixzLocale,
  type MiaixzLocaleDefinition,
  type MiaixzLocaleDescriptor,
} from "./locale-catalog.js";
import { MiaixzI18nLoadError, type MiaixzMessageLoader, unwrapMessages } from "./message-loader.js";
import {
  createI18nContractError,
  interpolate,
  isMessages,
  miaixzSdkMessages,
  resolveSourceMessage,
  validateMessages,
  validateNamespace,
  type MiaixzMessageCatalog,
  type MiaixzMessageParams,
  type MiaixzMessages,
  type MiaixzMessageSource,
  type MutableCatalog,
} from "./messages.js";

/**
 * Translates a message key with optional interpolation and fallback text.
 *
 * @public
 */
export type MiaixzTranslator = (
  key: string,
  params?: MiaixzMessageParams,
  fallback?: string,
) => string;

/**
 * Reports the current locale and asynchronous language-loading state.
 *
 * @public
 */
export interface MiaixzI18nSnapshot {
  /**
   * Contains the active canonical BCP 47 locale.
   */
  readonly locale: MiaixzLocale;

  /**
   * Reports whether requested project messages are ready, loading, or unavailable.
   */
  readonly loadStatus: "ready" | "loading" | "error";

  /**
   * Contains the latest project-language loading failure when present.
   */
  readonly loadError?: MiaixzI18nLoadError;
}

/**
 * Configures the Miaixz internationalization runtime.
 *
 * @public
 */
export interface MiaixzI18nOptions {
  /**
   * Selects the initial active locale.
   */
  readonly locale?: MiaixzLocale;

  /**
   * Selects the locale used after active-locale resources are exhausted.
   */
  readonly fallbackLocale?: MiaixzLocale;

  /**
   * Registers trusted locale extensions after the built-in locale definitions.
   */
  readonly locales?: readonly MiaixzLocaleDefinition[];

  /**
   * Registers static project resources during construction.
   */
  readonly messages?: MiaixzMessageCatalog;

  /**
   * Loads project-owned language files by namespace and locale.
   */
  readonly loadMessages?: MiaixzMessageLoader;

  /**
   * Receives each project-language loading failure.
   */
  readonly onLoadError?: (error: MiaixzI18nLoadError) => void;
}

/**
 * Runtime translator with namespace isolation, deterministic fallbacks, and lazy loading.
 *
 * @public
 */
export class MiaixzI18n {
  #locale: MiaixzLocale;
  readonly #fallbackLocale: MiaixzLocale;
  readonly #localeCatalog: MiaixzLocaleCatalog;
  readonly #builtin: MutableCatalog = new Map();
  readonly #project: MutableCatalog = new Map();
  readonly #loadMessages: MiaixzMessageLoader | undefined;
  readonly #onLoadError: ((error: MiaixzI18nLoadError) => void) | undefined;
  readonly #namespaces = new Set<string>();
  readonly #loaded = new Set<string>();
  readonly #loading = new Map<string, Promise<void>>();
  readonly #listeners = new Set<(snapshot: Readonly<MiaixzI18nSnapshot>) => void>();
  #snapshot: Readonly<MiaixzI18nSnapshot>;
  #lastLoadError: MiaixzI18nLoadError | undefined;
  #changeSequence = 0;

  /**
   * Creates an internationalization runtime and registers built-in SDK resources first.
   *
   * @param options - Initial locale, fallback, static project messages, and loader.
   */
  constructor(options: MiaixzI18nOptions = {}) {
    this.#localeCatalog = new MiaixzLocaleCatalog(options.locales);
    this.#locale = this.#resolveRuntimeLocale(options.locale ?? getMiaixzBrowserLocale());
    this.#fallbackLocale = this.#resolveRuntimeLocale(options.fallbackLocale ?? "en-US");
    this.#loadMessages = options.loadMessages;
    this.#onLoadError = options.onLoadError;
    this.#snapshot = Object.freeze({ locale: this.#locale, loadStatus: "ready" });
    for (const [locale, messages] of Object.entries(miaixzSdkMessages)) {
      this.registerMessages("sdk", locale, messages, "builtin");
    }
    if (options.messages !== undefined) this.#registerCatalog(options.messages, "project");
  }

  /**
   * Returns the currently active canonical locale.
   *
   * @returns Active locale identifier.
   */
  get locale(): MiaixzLocale {
    return this.#locale;
  }

  /**
   * Returns the ordered immutable locale descriptors available to selectors.
   *
   * @returns Built-in and registered locale descriptors.
   */
  get locales(): readonly MiaixzLocaleDescriptor[] {
    return this.#localeCatalog.descriptors();
  }

  /**
   * Resolves one registered locale definition.
   *
   * @param locale - Locale identifier or alias.
   * @returns Matching frozen definition when available.
   */
  getLocale(locale: MiaixzLocale): Readonly<MiaixzLocaleDefinition> | undefined {
    return this.#localeCatalog.resolve(locale);
  }

  /**
   * Returns the immutable current internationalization snapshot.
   *
   * @returns Current locale and loading state.
   */
  getSnapshot(): Readonly<MiaixzI18nSnapshot> {
    return this.#snapshot;
  }

  /**
   * Registers messages synchronously within an isolated namespace and source layer.
   *
   * @param namespace - Valid package or module namespace.
   * @param locale - Locale that owns the messages.
   * @param messages - Flat messages whose keys start with the namespace.
   * @param source - Built-in or project precedence layer.
   */
  registerMessages(
    namespace: string,
    locale: MiaixzLocale,
    messages: MiaixzMessages,
    source: MiaixzMessageSource,
  ): void {
    const validNamespace = validateNamespace(namespace);
    const canonicalLocale = canonicalizeLocale(locale);
    const validMessages = validateMessages(validNamespace, messages);
    const catalog = source === "builtin" ? this.#builtin : this.#project;
    const locales = catalog.get(validNamespace) ?? new Map();
    const previous = locales.get(canonicalLocale) ?? {};
    locales.set(canonicalLocale, { ...previous, ...validMessages });
    catalog.set(validNamespace, locales);
    this.#namespaces.add(validNamespace);
    this.#publish(this.#snapshot.loadStatus, this.#snapshot.loadError);
  }

  /**
   * Loads the initial active and fallback locales for sorted unique namespaces.
   *
   * @param namespaces - Namespaces to initialize; defaults to the SDK namespace.
   * @returns Promise settled after all requested messages are ready.
   */
  async initialize(namespaces: readonly string[] = ["sdk"]): Promise<void> {
    const requestedNamespaces = this.#normalizeNamespaces(namespaces);
    const locales = [...new Set([this.#fallbackLocale, this.#locale])].sort();
    await Promise.all(
      requestedNamespaces.flatMap((namespace) =>
        locales.map((locale) => this.loadNamespace(namespace, locale)),
      ),
    );
  }

  /**
   * Loads one project namespace and locale with in-flight request deduplication.
   *
   * @param namespace - Namespace to load.
   * @param locale - Locale to load.
   * @returns Promise settled after project messages are registered.
   * @throws MiaixzI18nLoadError When loading or validation fails.
   */
  loadNamespace(namespace: string, locale: MiaixzLocale): Promise<void> {
    const validNamespace = validateNamespace(namespace);
    const canonicalLocale = this.#resolveRuntimeLocale(locale);
    this.#namespaces.add(validNamespace);
    const loadKey = `${canonicalLocale}\u0000${validNamespace}`;
    const localeLoader = this.#localeCatalog.resolve(canonicalLocale)?.loadMessages;
    const loaders = [localeLoader, this.#loadMessages].filter(
      (loader): loader is MiaixzMessageLoader => loader !== undefined,
    );
    if (this.#loaded.has(loadKey) || loaders.length === 0) return Promise.resolve();
    const activeLoad = this.#loading.get(loadKey);
    if (activeLoad) return activeLoad;
    this.#lastLoadError = undefined;
    this.#publish("loading");
    const operation = Promise.resolve()
      .then(() => Promise.all(loaders.map((loader) => loader(validNamespace, canonicalLocale))))
      .then((results) => {
        for (const result of results) {
          const messages = unwrapMessages(result);
          this.registerMessages(validNamespace, canonicalLocale, messages, "project");
        }
        this.#loaded.add(loadKey);
      })
      .catch((cause: unknown) => {
        const error = new MiaixzI18nLoadError(canonicalLocale, validNamespace, cause);
        this.#lastLoadError = error;
        try {
          this.#onLoadError?.(error);
        } catch {
          /*
           * Host callbacks cannot replace the deterministic loader failure.
           */
        }
        throw error;
      })
      .finally(() => {
        this.#loading.delete(loadKey);
        if (this.#loading.size === 0) {
          this.#publish(this.#lastLoadError === undefined ? "ready" : "error", this.#lastLoadError);
        }
      });
    this.#loading.set(loadKey, operation);
    return operation;
  }

  /**
   * Loads every known namespace before applying the latest requested locale switch.
   *
   * @param locale - Target locale to load and activate.
   * @returns Promise settled after the request either becomes active or is superseded.
   * @throws MiaixzI18nLoadError When the target locale cannot be loaded.
   */
  async changeLocale(locale: MiaixzLocale): Promise<void> {
    const targetLocale = this.#resolveRuntimeLocale(locale);
    const sequence = ++this.#changeSequence;
    const namespaces = [...this.#namespaces].sort();
    await Promise.all(namespaces.map((namespace) => this.loadNamespace(namespace, targetLocale)));
    if (sequence !== this.#changeSequence) return;
    this.#locale = targetLocale;
    this.#publish(this.#lastLoadError === undefined ? "ready" : "error", this.#lastLoadError);
  }

  /**
   * Registers a snapshot listener and returns its unsubscribe function.
   *
   * @param listener - Callback invoked after locale, resource, or loading changes.
   * @returns Function that removes the listener.
   */
  subscribe(listener: (snapshot: Readonly<MiaixzI18nSnapshot>) => void): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  /**
   * Translates a key using project, built-in, configured locale, and explicit fallbacks.
   *
   * @param key - Translation key to resolve.
   * @param params - Optional named scalar values.
   * @param fallback - Optional final human-readable fallback.
   * @returns Localized and interpolated message.
   */
  readonly t: MiaixzTranslator = (key, params, fallback) => {
    const namespace = key.split(".")[0] ?? "";
    const definitionFallback = this.#localeCatalog.resolve(this.#locale)?.fallback;
    const locales = [
      ...new Set(
        [this.#locale, definitionFallback, this.#fallbackLocale].filter(
          (locale): locale is MiaixzLocale => locale !== undefined,
        ),
      ),
    ];
    for (const locale of locales) {
      const message =
        resolveSourceMessage(this.#project, namespace, locale, key) ??
        resolveSourceMessage(this.#builtin, namespace, locale, key);
      if (message !== undefined) return interpolate(message, params);
    }
    return interpolate(fallback ?? key, params);
  };

  /**
   * Registers a locale-to-flat-messages catalog by splitting keys into namespaces.
   *
   * @param catalog - Flat locale catalog.
   * @param source - Destination precedence layer.
   */
  #registerCatalog(catalog: MiaixzMessageCatalog, source: MiaixzMessageSource): void {
    if (typeof catalog !== "object" || catalog === null || Array.isArray(catalog)) {
      throw createI18nContractError("I18N_MESSAGES_INVALID");
    }
    for (const [locale, messages] of Object.entries(catalog)) {
      if (!isMessages(messages)) {
        throw createI18nContractError("I18N_MESSAGES_INVALID");
      }
      const namespaces = new Map<string, Record<string, string>>();
      for (const [key, message] of Object.entries(messages)) {
        const namespace = key.split(".")[0] ?? "";
        const grouped = namespaces.get(namespace) ?? {};
        grouped[key] = message;
        namespaces.set(namespace, grouped);
      }
      for (const [namespace, grouped] of namespaces) {
        this.registerMessages(namespace, locale, grouped, source);
      }
    }
  }

  /**
   * Validates, deduplicates, sorts, and records requested namespaces.
   *
   * @param namespaces - Namespace list supplied by a caller.
   * @returns Sorted unique namespace list.
   */
  #normalizeNamespaces(namespaces: readonly string[]): readonly string[] {
    const normalized = [...new Set(namespaces.map(validateNamespace))].sort();
    for (const namespace of normalized) this.#namespaces.add(namespace);
    return normalized;
  }

  /**
   * Canonicalizes a runtime locale and resolves registered aliases.
   *
   * @param locale - Requested locale identifier.
   * @returns Registered canonical identifier or the canonical unregistered value.
   */
  #resolveRuntimeLocale(locale: MiaixzLocale): MiaixzLocale {
    const canonical = canonicalizeLocale(locale);
    return this.#localeCatalog.resolve(canonical)?.id ?? canonical;
  }

  /**
   * Replaces the immutable snapshot and synchronously notifies subscribers.
   *
   * @param loadStatus - New loading state.
   * @param loadError - Optional latest loading failure.
   */
  #publish(loadStatus: MiaixzI18nSnapshot["loadStatus"], loadError?: MiaixzI18nLoadError): void {
    this.#snapshot = Object.freeze({
      locale: this.#locale,
      loadStatus,
      ...(loadError === undefined ? {} : { loadError }),
    });
    for (const listener of this.#listeners) listener(this.#snapshot);
  }
}

/**
 * Creates a runtime translator and project-language loader.
 *
 * @param options - Optional locale, catalogs, and project loader.
 * @returns Configured internationalization runtime.
 * @public
 */
export function createMiaixzI18n(options?: MiaixzI18nOptions): MiaixzI18n {
  return new MiaixzI18n(options);
}
