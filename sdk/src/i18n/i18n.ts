import { MiaixzSdkError } from "../api/errors.js";
import { setMiaixzDefaultTranslator } from "./default-translator.js";

/**
 * Identifies a locale supported by the Miaixz internationalization runtime.
 *
 * @public
 */
export type MiaixzLocale = string;

/**
 * Maps named message placeholders to scalar replacement values.
 *
 * @public
 */
export type MiaixzMessageParams = Readonly<Record<string, string | number | boolean>>;

/**
 * Maps translation keys to localized strings for one locale.
 *
 * @public
 */
export type MiaixzMessages = Readonly<Record<string, string>>;

/**
 * Maps locale identifiers to flat message collections.
 *
 * @public
 */
export type MiaixzMessageCatalog = Readonly<Record<MiaixzLocale, MiaixzMessages>>;

/**
 * Identifies whether messages originate from a package or the consuming project.
 *
 * @public
 */
export type MiaixzMessageSource = "builtin" | "project";

/**
 * Describes an ES module whose default export contains localized messages.
 *
 * @public
 */
export interface MiaixzMessageModule {
  /**
   * Contains the localized messages exported by the language module.
   */
  readonly default: MiaixzMessages;
}

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
 * Provides the built-in SDK messages in English and Simplified Chinese.
 *
 * @public
 */
export const miaixzSdkMessages: MiaixzMessageCatalog = Object.freeze({
  "en-US": Object.freeze({
    "sdk.error.unknown": "An unknown SDK error occurred",
    "sdk.error.network": "The network request failed",
    "sdk.error.timeout": "The request timed out after {timeoutMs}ms",
    "sdk.error.aborted": "The request was aborted",
    "sdk.error.http": "Request failed with status {status}",
    "sdk.error.api.fetchUnavailable": "A Fetch implementation is required",
    "sdk.error.api.baseUrlInvalid": "The API base URL is invalid",
    "sdk.error.api.requestOriginInvalid": "The request origin is invalid",
    "sdk.error.api.envelopeInvalid": "The API response does not use the required Miaixz envelope",
    "sdk.error.api.envelopeModeInvalid":
      "The selected response type does not support envelope processing",
    "sdk.error.api.responseInvalid": "The API response data is invalid",
    "sdk.error.api.business": "The API rejected the request",
    "sdk.error.api.timeoutInvalid": "The request timeout must be a finite number greater than zero",
    "sdk.error.api.retryInvalid": "The retry count must be an integer from zero through five",
    "sdk.error.api.cryptoUnavailable": "A secure random identifier generator is required",
    "sdk.error.api.csrfTokenMissing": "The CSRF token is missing",
    "sdk.error.auth.sessionInvalid": "The authentication session is invalid",
    "sdk.error.auth.refreshFailed": "The authentication session could not be refreshed",
    "sdk.error.auth.persistenceAcknowledgementRequired":
      "Persistent authentication storage requires explicit Web Storage risk acknowledgement",
    "sdk.error.auth.modeMismatch":
      "The requested authentication operation is unavailable in this mode",
    "sdk.error.config.invalid": "The SDK configuration is invalid",
    "sdk.error.config.fetchUnavailable": "A Fetch implementation is required to load configuration",
    "sdk.error.config.fetchFailed": "The configuration could not be loaded",
    "sdk.error.config.serviceMissing": "Service endpoint {service} is not configured",
    "sdk.error.context.invalid": "The runtime context is invalid",
    "sdk.error.permissions.invalid": "The permission snapshot is invalid",
    "sdk.error.file.download": "The file could not be downloaded",
    "sdk.error.file.downloadFailed": "The file could not be downloaded",
    "sdk.error.module.manifestInvalid": "The module manifest is invalid",
    "sdk.error.module.hostIncompatible": "The module is incompatible with this host",
    "sdk.error.bridge.capabilityUnavailable": "The requested host capability is unavailable",
    "sdk.error.bridge.navigationStateInvalid": "The requested navigation state is invalid",
    "sdk.error.bridge.originInvalid": "The module origin is invalid",
    "sdk.error.bridge.messageInvalid": "The module bridge message is invalid",
    "sdk.error.bridge.notReady": "The module bridge is not ready",
    "sdk.error.bridge.timeout": "The module bridge request timed out",
    "sdk.error.bridge.disposed": "The module bridge has been disposed",
    "sdk.error.bridge.cryptoUnavailable": "A secure random identifier generator is required",
    "sdk.error.event.channelInvalid": "The event channel is invalid",
    "sdk.error.event.validatorMissing": "The event payload validator is missing",
    "sdk.error.event.payloadNotCloneable": "The event payload cannot be safely cloned",
    "sdk.error.event.cryptoUnavailable": "A secure random identifier generator is required",
    "sdk.error.appearance.invalid": "The appearance settings are invalid",
    "sdk.error.appearance.colorInvalid": "The appearance color is invalid",
    "sdk.error.appearance.contrastInvalid": "The appearance color contrast is insufficient",
    "sdk.error.storage.scopeInvalid": "The storage scope is invalid",
    "sdk.error.storage.migrationChainInvalid": "The storage migration chain is invalid",
    "sdk.error.i18n.localeInvalid": "The locale is invalid",
    "sdk.error.i18n.namespaceInvalid": "The message namespace is invalid",
    "sdk.error.i18n.messagesInvalid": "The language file is invalid",
    "sdk.error.i18n.loadFailed": "The {namespace} messages for {locale} could not be loaded",
  }),
  "zh-CN": Object.freeze({
    "sdk.error.unknown": "发生未知 SDK 错误",
    "sdk.error.network": "网络请求失败",
    "sdk.error.timeout": "请求在 {timeoutMs} 毫秒后超时",
    "sdk.error.aborted": "请求已取消",
    "sdk.error.http": "请求失败，状态码为 {status}",
    "sdk.error.api.fetchUnavailable": "需要提供 Fetch 实现",
    "sdk.error.api.baseUrlInvalid": "API 基础地址无效",
    "sdk.error.api.requestOriginInvalid": "请求来源无效",
    "sdk.error.api.envelopeInvalid": "API 响应未使用规定的 Miaixz 返回结构",
    "sdk.error.api.envelopeModeInvalid": "当前响应类型不支持返回包处理",
    "sdk.error.api.responseInvalid": "API 响应数据无效",
    "sdk.error.api.business": "API 拒绝了该请求",
    "sdk.error.api.timeoutInvalid": "请求超时时间必须是大于零的有限数值",
    "sdk.error.api.retryInvalid": "重试次数必须是零到五之间的整数",
    "sdk.error.api.cryptoUnavailable": "需要安全的随机标识生成器",
    "sdk.error.api.csrfTokenMissing": "缺少 CSRF 令牌",
    "sdk.error.auth.sessionInvalid": "登录会话无效",
    "sdk.error.auth.refreshFailed": "无法刷新登录会话",
    "sdk.error.auth.persistenceAcknowledgementRequired":
      "持久化认证存储需要显式确认 Web Storage 安全风险",
    "sdk.error.auth.modeMismatch": "当前认证模式不支持该操作",
    "sdk.error.config.invalid": "SDK 配置无效",
    "sdk.error.config.fetchUnavailable": "加载配置需要提供 Fetch 实现",
    "sdk.error.config.fetchFailed": "无法加载配置",
    "sdk.error.config.serviceMissing": "未配置服务端点 {service}",
    "sdk.error.context.invalid": "运行上下文无效",
    "sdk.error.permissions.invalid": "权限快照无效",
    "sdk.error.file.download": "文件下载失败",
    "sdk.error.file.downloadFailed": "文件下载失败",
    "sdk.error.module.manifestInvalid": "模块清单无效",
    "sdk.error.module.hostIncompatible": "模块与当前宿主不兼容",
    "sdk.error.bridge.capabilityUnavailable": "请求的宿主能力不可用",
    "sdk.error.bridge.navigationStateInvalid": "请求的导航状态无效",
    "sdk.error.bridge.originInvalid": "模块来源无效",
    "sdk.error.bridge.messageInvalid": "模块桥接消息无效",
    "sdk.error.bridge.notReady": "模块桥接尚未就绪",
    "sdk.error.bridge.timeout": "模块桥接请求超时",
    "sdk.error.bridge.disposed": "模块桥接已释放",
    "sdk.error.bridge.cryptoUnavailable": "需要安全的随机标识生成器",
    "sdk.error.event.channelInvalid": "事件通道无效",
    "sdk.error.event.validatorMissing": "缺少事件载荷校验器",
    "sdk.error.event.payloadNotCloneable": "事件载荷无法安全复制",
    "sdk.error.event.cryptoUnavailable": "需要安全的随机标识生成器",
    "sdk.error.appearance.invalid": "外观设置无效",
    "sdk.error.appearance.colorInvalid": "外观颜色无效",
    "sdk.error.appearance.contrastInvalid": "外观颜色对比度不足",
    "sdk.error.storage.scopeInvalid": "存储范围无效",
    "sdk.error.storage.migrationChainInvalid": "存储迁移链无效",
    "sdk.error.i18n.localeInvalid": "语言区域标识无效",
    "sdk.error.i18n.namespaceInvalid": "消息命名空间无效",
    "sdk.error.i18n.messagesInvalid": "语言文件无效",
    "sdk.error.i18n.loadFailed": "无法加载 {locale} 的 {namespace} 消息",
  }),
});

const namespacePattern = /^[a-z][a-z0-9-]{1,63}$/;
type MutableCatalog = Map<string, Map<MiaixzLocale, Record<string, string>>>;

/**
 * Resolves one built-in SDK message before a runtime is available.
 *
 * @param locale - Preferred locale.
 * @param key - Registered SDK message key.
 * @param params - Optional interpolation values.
 * @returns Localized built-in text or the key itself.
 */
function resolveBuiltinMessage(
  locale: MiaixzLocale,
  key: string,
  params?: MiaixzMessageParams,
): string {
  let canonical: string;
  try {
    canonical = Intl.getCanonicalLocales(locale)[0] ?? "en-US";
  } catch {
    canonical = "en-US";
  }
  const language = canonical.split("-")[0]?.toLowerCase();
  const matched = Object.keys(miaixzSdkMessages)
    .sort()
    .find((candidate) => candidate.split("-")[0]?.toLowerCase() === language);
  const message =
    miaixzSdkMessages[canonical]?.[key] ??
    (matched ? miaixzSdkMessages[matched]?.[key] : undefined) ??
    miaixzSdkMessages["en-US"]?.[key] ??
    key;
  return interpolate(message, params);
}

/**
 * Creates a localized SDK error for an invalid internationalization value.
 *
 * @param code - Stable registry error code.
 * @param messageKey - Registered SDK message key.
 * @param locale - Preferred locale for the public message.
 * @returns Localized SDK error without the rejected value.
 */
function createI18nContractError(
  code: "I18N_LOCALE_INVALID" | "I18N_NAMESPACE_INVALID" | "I18N_MESSAGES_INVALID",
  messageKey:
    | "sdk.error.i18n.localeInvalid"
    | "sdk.error.i18n.namespaceInvalid"
    | "sdk.error.i18n.messagesInvalid",
  locale = "en-US",
): MiaixzSdkError {
  return new MiaixzSdkError(resolveBuiltinMessage(locale, messageKey), { code });
}

/**
 * Canonicalizes a BCP 47 locale identifier.
 *
 * @param locale - Locale candidate to canonicalize.
 * @returns Canonical BCP 47 locale identifier.
 * @throws MiaixzSdkError When the locale is invalid.
 */
function canonicalizeLocale(locale: MiaixzLocale): MiaixzLocale {
  if (typeof locale !== "string" || locale.length === 0) {
    throw createI18nContractError("I18N_LOCALE_INVALID", "sdk.error.i18n.localeInvalid");
  }
  try {
    const canonical = Intl.getCanonicalLocales(locale)[0];
    if (!canonical) {
      throw createI18nContractError("I18N_LOCALE_INVALID", "sdk.error.i18n.localeInvalid");
    }
    return canonical;
  } catch (error) {
    if (error instanceof MiaixzSdkError) throw error;
    throw createI18nContractError("I18N_LOCALE_INVALID", "sdk.error.i18n.localeInvalid");
  }
}

/**
 * Validates and returns a message namespace.
 *
 * @param namespace - Namespace candidate to validate.
 * @returns The unchanged valid namespace.
 * @throws MiaixzSdkError When the namespace violates the frozen syntax.
 */
function validateNamespace(namespace: string): string {
  if (!namespacePattern.test(namespace)) {
    throw createI18nContractError("I18N_NAMESPACE_INVALID", "sdk.error.i18n.namespaceInvalid");
  }
  return namespace;
}

/**
 * Determines whether a runtime value is a flat message object.
 *
 * @param value - Runtime value to inspect.
 * @returns Whether every own enumerable value is a string.
 */
function isMessages(value: unknown): value is MiaixzMessages {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every((message) => typeof message === "string")
  );
}

/**
 * Validates that messages are flat and owned by one namespace.
 *
 * @param namespace - Namespace that must own every message key.
 * @param messages - Runtime message collection to validate.
 * @returns A safe mutable copy of the validated messages.
 */
function validateMessages(namespace: string, messages: unknown): Record<string, string> {
  if (!isMessages(messages)) {
    throw createI18nContractError("I18N_MESSAGES_INVALID", "sdk.error.i18n.messagesInvalid");
  }
  if (Object.keys(messages).some((key) => !key.startsWith(`${namespace}.`))) {
    throw createI18nContractError("I18N_NAMESPACE_INVALID", "sdk.error.i18n.namespaceInvalid");
  }
  return { ...messages };
}

/**
 * Extracts messages from a direct object or an ES module default export.
 *
 * @param value - Loader result to normalize.
 * @returns Runtime message collection awaiting namespace validation.
 */
function unwrapMessages(value: MiaixzMessageLoaderResult): MiaixzMessages {
  if (typeof value === "object" && value !== null && !Array.isArray(value) && "default" in value) {
    if (isMessages(value.default)) return value.default;
    throw createI18nContractError("I18N_MESSAGES_INVALID", "sdk.error.i18n.messagesInvalid");
  }
  if (isMessages(value)) return value;
  throw createI18nContractError("I18N_MESSAGES_INVALID", "sdk.error.i18n.messagesInvalid");
}

/**
 * Replaces supplied scalar placeholders and preserves missing placeholders.
 *
 * @param message - Localized message template.
 * @param params - Optional named scalar values.
 * @returns Interpolated message.
 */
function interpolate(message: string, params?: MiaixzMessageParams): string {
  if (!params) return message;
  return message.replace(/\{([\w.-]+)\}/g, (placeholder, key: string) => {
    const value = params[key];
    return value === undefined ? placeholder : String(value);
  });
}

/**
 * Returns the base language portion of a canonical locale.
 *
 * @param locale - Canonical locale identifier.
 * @returns Lowercase base language.
 */
function getBaseLanguage(locale: MiaixzLocale): string {
  return locale.split("-")[0]?.toLowerCase() ?? locale.toLowerCase();
}

/**
 * Resolves exact and base-language messages from one source catalog.
 *
 * @param catalog - Source catalog to search.
 * @param namespace - Namespace that owns the requested key.
 * @param locale - Canonical locale requested by the caller.
 * @param key - Message key to resolve.
 * @returns Exact or deterministic base-language message.
 */
function resolveSourceMessage(
  catalog: MutableCatalog,
  namespace: string,
  locale: MiaixzLocale,
  key: string,
): string | undefined {
  const locales = catalog.get(namespace);
  const exact = locales?.get(locale)?.[key];
  if (exact !== undefined) return exact;
  const language = getBaseLanguage(locale);
  const baseLocale = [...(locales?.keys() ?? [])]
    .sort()
    .find((candidate) => candidate !== locale && getBaseLanguage(candidate) === language);
  return baseLocale ? locales?.get(baseLocale)?.[key] : undefined;
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
   * @param message - Localized public failure message.
   * @param cause - Original loader or validation error.
   */
  constructor(locale: MiaixzLocale, namespace: string, message: string, cause?: unknown) {
    super(message, { code: "I18N_LOAD_FAILED", cause });
    this.name = "MiaixzI18nLoadError";
    this.locale = locale;
    this.namespace = namespace;
  }
}

/**
 * Runtime translator with namespace isolation, deterministic fallbacks, and lazy loading.
 *
 * @public
 */
export class MiaixzI18n {
  #locale: MiaixzLocale;
  readonly #fallbackLocale: MiaixzLocale;
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
    this.#locale = canonicalizeLocale(options.locale ?? getMiaixzBrowserLocale());
    this.#fallbackLocale = canonicalizeLocale(options.fallbackLocale ?? "en-US");
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
    const canonicalLocale = canonicalizeLocale(locale);
    this.#namespaces.add(validNamespace);
    const loadKey = `${canonicalLocale}\u0000${validNamespace}`;
    if (this.#loaded.has(loadKey) || !this.#loadMessages) return Promise.resolve();
    const activeLoad = this.#loading.get(loadKey);
    if (activeLoad) return activeLoad;
    this.#lastLoadError = undefined;
    this.#publish("loading");
    const operation = Promise.resolve()
      .then(() => this.#loadMessages?.(validNamespace, canonicalLocale) ?? {})
      .then((result) => {
        const messages = unwrapMessages(result);
        this.registerMessages(validNamespace, canonicalLocale, messages, "project");
        this.#loaded.add(loadKey);
      })
      .catch((cause: unknown) => {
        const error = new MiaixzI18nLoadError(
          canonicalLocale,
          validNamespace,
          this.t("sdk.error.i18n.loadFailed", {
            locale: canonicalLocale,
            namespace: validNamespace,
          }),
          cause,
        );
        this.#lastLoadError = error;
        try {
          this.#onLoadError?.(error);
        } catch {
          // Host callbacks cannot replace the deterministic loader failure.
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
    const targetLocale = canonicalizeLocale(locale);
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
    const locales = [...new Set([this.#locale, this.#fallbackLocale])];
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
      throw createI18nContractError(
        "I18N_MESSAGES_INVALID",
        "sdk.error.i18n.messagesInvalid",
        this.#locale,
      );
    }
    for (const [locale, messages] of Object.entries(catalog)) {
      if (!isMessages(messages)) {
        throw createI18nContractError(
          "I18N_MESSAGES_INVALID",
          "sdk.error.i18n.messagesInvalid",
          this.#locale,
        );
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

/**
 * Provides the default internationalization runtime used by standalone SDK modules.
 *
 * @public
 */
export const miaixzDefaultI18n = new MiaixzI18n();

setMiaixzDefaultTranslator(miaixzDefaultI18n.t);
