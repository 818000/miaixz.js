import { createMiaixzAppearanceManager, type MiaixzAppearanceManager } from "./appearance/index.js";
import {
  createApiClient,
  MiaixzSdkError,
  type MiaixzApiClient,
  type MiaixzApiTelemetryHooks,
  type MiaixzCsrfTokenProvider,
} from "./api/index.js";
import {
  createMiaixzAuthManager,
  MiaixzAuthManager,
  type MiaixzAuthSession,
  type MiaixzPersistentAuthStorage,
  type MiaixzSessionRefresher,
} from "./auth/index.js";
import { MiaixzConfigStore, getMiaixzServiceEndpoint } from "./config/index.js";
import { createMiaixzContextStore, type MiaixzContextStore } from "./context/index.js";
import {
  createMiaixzEventBus,
  type MiaixzEventBus,
  type MiaixzSdkEventMap,
} from "./events/index.js";
import { createMiaixzFileClient, type MiaixzFileClient } from "./files/index.js";
import {
  createMiaixzI18n,
  type MiaixzI18n,
  type MiaixzI18nLoadError,
  type MiaixzLocale,
  type MiaixzLocaleDefinition,
  type MiaixzMessageCatalog,
  type MiaixzMessageLoader,
} from "./i18n/index.js";
import { createMiaixzPermissionSet, type MiaixzPermissionSet } from "./permissions/index.js";
import { miaixzHeaders } from "./consts/index.js";
import {
  createMiaixzStorageKey,
  getMiaixzBrowserStorage,
  type MiaixzKeyValueStorage,
} from "./storage/index.js";
import type {
  MiaixzPermissionSnapshot,
  MiaixzRuntimeContext,
  MiaixzSdkConfig,
} from "./types/index.js";

/**
 * Selects the SDK authentication integration used for API requests.
 *
 * @public
 */
export type MiaixzAuthMode = "cookie" | "bearer";

/**
 * Configures a complete Miaixz SDK instance.
 *
 * @public
 */
export interface MiaixzSdkOptions {
  /**
   * Identifies the consuming frontend application and its persistence namespace.
   */
  readonly appId: string;

  /**
   * Validated deployment configuration for the SDK.
   */
  readonly config: MiaixzSdkConfig;

  /**
   * Optional runtime Context fields merged over restored persistent state.
   */
  readonly initialContext?: MiaixzRuntimeContext;

  /**
   * Authentication integration; defaults to the Cookie/BFF mode.
   *
   * @defaultValue "cookie"
   */
  readonly authMode?: MiaixzAuthMode;

  /**
   * Explicitly acknowledged persistence used only by Bearer authentication.
   */
  readonly authPersistence?: MiaixzPersistentAuthStorage;

  /**
   * Session refresher used only by Bearer authentication.
   */
  readonly authRefresh?: MiaixzSessionRefresher;

  /**
   * Supplies the authoritative CSRF token for Cookie/BFF write requests.
   */
  readonly csrfTokenProvider?: MiaixzCsrfTokenProvider;

  /**
   * Optional initial locale.
   */
  readonly locale?: MiaixzLocale;

  /**
   * Optional locale used when a message is unavailable in the active locale.
   */
  readonly fallbackLocale?: MiaixzLocale;

  /**
   * Optional trusted locale definitions exposed to global language selectors.
   */
  readonly locales?: readonly MiaixzLocaleDefinition[];

  /**
   * Optional initial project message catalogs.
   */
  readonly messages?: MiaixzMessageCatalog;

  /**
   * Optional loader for project-owned language files.
   */
  readonly loadMessages?: MiaixzMessageLoader;

  /**
   * Optional callback invoked when a project language file cannot be loaded.
   */
  readonly onI18nLoadError?: (error: MiaixzI18nLoadError) => void;

  /**
   * Optional key-value storage shared by stateful SDK modules.
   */
  readonly storage?: MiaixzKeyValueStorage;

  /**
   * Optional Fetch implementation shared by API clients.
   */
  readonly fetch?: typeof fetch;

  /**
   * Optional observers shared by the primary and service API clients.
   */
  readonly telemetry?: MiaixzApiTelemetryHooks;

  /**
   * Optional preconfigured event bus shared by SDK modules.
   */
  readonly eventBus?: MiaixzEventBus<MiaixzSdkEventMap>;

  /**
   * Enables same-origin cross-tab events on the channel derived from `appId`.
   *
   * @defaultValue false
   */
  readonly eventChannel?: boolean;

  /**
   * Optional initial frontend permission snapshot.
   */
  readonly permissions?: MiaixzPermissionSnapshot;
}

/**
 * Creates the stable AuthManager-shaped object exposed by Cookie/BFF SDK instances.
 *
 * The implementation intentionally never creates or stores a token session.
 */
class MiaixzCookieAuthManager extends MiaixzAuthManager {
  readonly #translate: MiaixzI18n["t"];

  /**
   * Creates a disabled token manager for a Cookie/BFF SDK instance.
   *
   * @param translate - Translator used for mode-mismatch errors.
   * @param events - Shared SDK event bus.
   */
  constructor(translate: MiaixzI18n["t"], events: MiaixzEventBus<MiaixzSdkEventMap>) {
    super({ translate, events });
    this.#translate = translate;
  }

  /**
   * Rejects token sessions because Cookie/BFF credentials are owned by the browser and server.
   *
   * @param _session - Rejected Bearer session.
   * @throws MiaixzSdkError Always, because the SDK is using Cookie/BFF authentication.
   */
  override setSession(_session: MiaixzAuthSession): void {
    throw createAuthModeMismatchError(this.#translate);
  }

  /**
   * Rejects access-token reads because HttpOnly Cookie credentials are not script-readable.
   *
   * @returns A rejected promise for structural compatibility with the public manager.
   * @throws MiaixzSdkError Always, because the SDK is using Cookie/BFF authentication.
   */
  override async getAccessToken(): Promise<undefined> {
    throw createAuthModeMismatchError(this.#translate);
  }
}

/**
 * Creates a localized authentication-mode mismatch error without credential details.
 *
 * @param translate - Translator used to resolve the public error message.
 * @returns A safe SDK error describing an unavailable authentication operation.
 */
function createAuthModeMismatchError(translate: MiaixzI18n["t"]): MiaixzSdkError {
  return new MiaixzSdkError(translate("sdk.error.auth.modeMismatch"), {
    code: "AUTH_MODE_MISMATCH",
  });
}

/**
 * Exposes the coordinated Miaixz runtime services used by a frontend application.
 *
 * @public
 */
export interface MiaixzSdk {
  /**
   * Mutable validated SDK configuration store.
   */
  readonly config: MiaixzConfigStore;

  /**
   * Internationalization runtime and project catalog loader.
   */
  readonly i18n: MiaixzI18n;
  /**
   * Resolves after the initial project language files have loaded.
   */
  readonly ready: Promise<void>;

  /**
   * Shared local and cross-window event bus.
   */
  readonly events: MiaixzEventBus<MiaixzSdkEventMap>;

  /**
   * Authentication session manager.
   */
  readonly auth: MiaixzAuthManager;

  /**
   * Runtime-context store and request-header provider.
   */
  readonly context: MiaixzContextStore;

  /**
   * Theme and density appearance manager.
   */
  readonly appearance: MiaixzAppearanceManager;

  /**
   * API client for the primary configured endpoint.
   */
  readonly api: MiaixzApiClient;

  /**
   * High-level file client for the primary configured endpoint.
   */
  readonly files: MiaixzFileClient;

  /**
   * Current immutable frontend permission evaluator.
   */
  readonly permissions: MiaixzPermissionSet;
  /**
   * Replaces the current frontend permission snapshot.
   *
   * @param snapshot - Permission snapshot to validate and activate.
   * @throws MiaixzSdkError When the permission snapshot is invalid.
   */
  setPermissions(snapshot: MiaixzPermissionSnapshot): void;
  /**
   * Creates an authenticated API client for a configured service endpoint.
   *
   * @param service - Configured service name to resolve.
   * @returns An API client inheriting all SDK security and runtime options.
   * @throws MiaixzSdkError When the service endpoint is missing or invalid.
   */
  createServiceClient(service: string): MiaixzApiClient;
  /**
   * Releases all subscriptions and browser resources owned by this SDK instance.
   */
  destroy(): void;
}

/**
 * Composes the Miaixz API, auth, context, config, permissions, files, appearance,
 * events, storage, and internationalization modules into one service SDK.
 *
 * @param options - Deployment configuration and runtime adapters.
 * @returns A service-ready SDK instance. Await `ready` before rendering project translations.
 * @throws MiaixzSdkError When application, configuration, authentication, or runtime options are invalid.
 * @public
 */
export function createMiaixzSdk(options: MiaixzSdkOptions): MiaixzSdk {
  createMiaixzStorageKey({ appId: options.appId }, "context");
  const authMode = options.authMode ?? "cookie";
  const i18n = createMiaixzI18n({
    ...(options.locale === undefined ? {} : { locale: options.locale }),
    ...(options.fallbackLocale === undefined ? {} : { fallbackLocale: options.fallbackLocale }),
    ...(options.locales === undefined ? {} : { locales: options.locales }),
    ...(options.messages === undefined ? {} : { messages: options.messages }),
    ...(options.loadMessages === undefined ? {} : { loadMessages: options.loadMessages }),
    ...(options.onI18nLoadError === undefined ? {} : { onLoadError: options.onI18nLoadError }),
  });
  if (
    authMode === "cookie" &&
    (options.authPersistence !== undefined || options.authRefresh !== undefined)
  ) {
    throw createAuthModeMismatchError(i18n.t);
  }
  if (options.eventBus !== undefined && options.eventChannel === true) {
    throw new MiaixzSdkError(i18n.t("sdk.error.event.channelInvalid"), {
      code: "EVENT_CHANNEL_INVALID",
    });
  }
  const ownsEventBus = options.eventBus === undefined;
  const events =
    options.eventBus ??
    createMiaixzEventBus({
      channelName: options.eventChannel === true ? `miaixz:v1:${options.appId}:events` : false,
    });
  const storage = options.storage ?? getMiaixzBrowserStorage();
  const ready = i18n.initialize(["sdk"]);
  const config = new MiaixzConfigStore(options.config, events, i18n.t);
  const auth: MiaixzAuthManager =
    authMode === "cookie"
      ? new MiaixzCookieAuthManager(i18n.t, events)
      : createMiaixzAuthManager({
          events,
          translate: i18n.t,
          ...(options.authPersistence === undefined
            ? {}
            : { persistence: options.authPersistence }),
          ...(options.authRefresh === undefined ? {} : { refresh: options.authRefresh }),
        });
  const context = createMiaixzContextStore({
    appId: options.appId,
    events,
    translate: i18n.t,
    ...(storage === undefined ? {} : { storage }),
    ...(options.initialContext === undefined ? {} : { initialContext: options.initialContext }),
  });
  if (context.getSnapshot().locale !== i18n.locale) {
    context.patch({ locale: i18n.locale });
  }
  let appearanceTenantId = context.getSnapshot().tenantId;
  const appearance = createMiaixzAppearanceManager({
    appId: options.appId,
    ...(appearanceTenantId === undefined ? {} : { tenantId: appearanceTenantId }),
    events,
    translate: i18n.t,
    ...(storage === undefined ? {} : { storage }),
    ...(config.getSnapshot().appearance === undefined
      ? {}
      : { initialAppearance: config.getSnapshot().appearance }),
  });
  const stopAppearanceScopeSync = context.subscribe((snapshot) => {
    if (snapshot.tenantId === appearanceTenantId) return;
    appearanceTenantId = snapshot.tenantId;
    appearance.setScope(appearanceTenantId);
  });

  const createClient = (
    baseUrl: string,
    environment: MiaixzSdkConfig["environment"],
  ): MiaixzApiClient =>
    createApiClient({
      baseUrl,
      environment,
      credentials: authMode === "cookie" ? "include" : "same-origin",
      ...(authMode === "bearer" ? { authorizationProvider: auth.authorizationProvider } : {}),
      csrf:
        authMode === "cookie"
          ? {
              required: true,
              ...(options.csrfTokenProvider === undefined
                ? {}
                : { tokenProvider: options.csrfTokenProvider }),
            }
          : { required: false },
      contextHeadersProvider: () => {
        const headers = context.headersProvider();
        if (!headers.has(miaixzHeaders.locale)) headers.set(miaixzHeaders.locale, i18n.locale);
        return headers;
      },
      translate: i18n.t,
      ...(options.telemetry === undefined ? {} : { telemetry: options.telemetry }),
      ...(options.fetch === undefined ? {} : { fetch: options.fetch }),
      ...(config.getSnapshot().requestTimeoutMs === undefined
        ? {}
        : { timeoutMs: config.getSnapshot().requestTimeoutMs }),
    });

  let api = createClient(config.getSnapshot().apiBaseUrl, config.getSnapshot().environment);
  let files = createMiaixzFileClient(api, { translate: i18n.t });
  let permissions = createMiaixzPermissionSet(options.permissions ?? { allowed: [] }, i18n.t);

  const stopClientConfigSync = config.subscribe((nextConfig) => {
    api = createClient(nextConfig.apiBaseUrl, nextConfig.environment);
    files = createMiaixzFileClient(api, { translate: i18n.t });
  });

  const stopLocaleBroadcast = i18n.subscribe((snapshot) => {
    if (context.getSnapshot().locale !== snapshot.locale) {
      context.patch({ locale: snapshot.locale });
      events.emit("locale:changed", Object.freeze({ locale: snapshot.locale }));
    }
  });
  const stopLocaleSync = events.on("locale:changed", ({ locale }) => {
    if (locale !== i18n.locale) {
      void i18n.changeLocale(locale).catch(() => undefined);
    }
  });

  const sdk: MiaixzSdk = {
    config,
    i18n,
    ready,
    events,
    auth,
    context,
    appearance,
    get api() {
      return api;
    },
    get files() {
      return files;
    },
    get permissions() {
      return permissions;
    },
    setPermissions(snapshot) {
      permissions = createMiaixzPermissionSet(snapshot, i18n.t);
    },
    createServiceClient(service) {
      return createClient(
        getMiaixzServiceEndpoint(config.getSnapshot(), service, i18n.t),
        config.getSnapshot().environment,
      );
    },
    destroy() {
      stopAppearanceScopeSync();
      stopLocaleBroadcast();
      stopLocaleSync();
      stopClientConfigSync();
      auth.destroy();
      context.destroy();
      appearance.destroy();
      config.destroy();
      if (ownsEventBus) events.close();
    },
  };

  return sdk;
}
