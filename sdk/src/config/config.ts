import { MiaixzSdkError, isMiaixzSdkError } from "../api/errors.js";
import { normalizeMiaixzApiEndpoint } from "../api/endpoint.js";
import { isMiaixzAppearanceSettings } from "../appearance/index.js";
import type { MiaixzEventBus, MiaixzSdkEventMap } from "../events/index.js";
import { miaixzDefaultI18n, type MiaixzTranslator } from "../i18n/index.js";
import type { MiaixzEnvironment, MiaixzFeatureValue, MiaixzSdkConfig } from "../types/index.js";
import { isRecord } from "../utils/object.js";

/**
 * Configures the ordered sources used to load SDK configuration.
 *
 * @public
 */
export interface MiaixzLoadConfigOptions {
  /**
   * Optional in-memory configuration candidate with highest precedence.
   */
  config?: unknown;

  /**
   * Optional URL of a deployment-provided JSON configuration.
   */
  url?: string;

  /**
   * Optional Fetch implementation used to load remote configuration.
   */
  fetch?: typeof fetch;

  /**
   * Optional global variable name containing injected configuration.
   */
  globalKey?: string;

  /**
   * Optional translator used for configuration errors.
   */
  translate?: MiaixzTranslator;
}

/**
 * Validates supported primitive feature-flag values.
 *
 * @param value - Feature value candidate to inspect.
 * @returns Whether the value is a supported feature-flag value.
 */
function isFeatureValue(value: unknown): value is MiaixzFeatureValue {
  return (
    typeof value === "boolean" ||
    typeof value === "string" ||
    (typeof value === "number" && Number.isFinite(value))
  );
}

/**
 * Determines whether a value satisfies the complete SDK configuration contract.
 *
 * @param value - Configuration candidate to inspect.
 * @returns Whether `value` satisfies the complete SDK configuration contract.
 * @public
 */
export function isMiaixzSdkConfig(value: unknown): value is MiaixzSdkConfig {
  if (!isRecord(value)) return false;
  if (typeof value.environment !== "string") return false;
  const environment = value.environment as MiaixzEnvironment;
  if (normalizeMiaixzApiEndpoint(value.apiBaseUrl, environment) === undefined) return false;
  if (
    value.requestTimeoutMs !== undefined &&
    (typeof value.requestTimeoutMs !== "number" ||
      !Number.isFinite(value.requestTimeoutMs) ||
      value.requestTimeoutMs <= 0)
  )
    return false;
  if (value.release !== undefined && typeof value.release !== "string") return false;
  if (
    value.services !== undefined &&
    (!isRecord(value.services) ||
      !Object.values(value.services).every(
        (endpoint) => normalizeMiaixzApiEndpoint(endpoint, environment) !== undefined,
      ))
  )
    return false;
  if (
    value.features !== undefined &&
    (!isRecord(value.features) || !Object.values(value.features).every(isFeatureValue))
  )
    return false;
  if (value.appearance !== undefined && !isMiaixzAppearanceSettings(value.appearance)) return false;
  return true;
}

/**
 * Validates and freezes a configuration object.
 *
 * @param config - Configuration object to validate and freeze.
 * @param translate - Translator used for validation errors.
 * @returns Immutable SDK configuration.
 * @throws MiaixzSdkError when required values are missing or invalid.
 * @public
 */
export function defineMiaixzConfig(
  config: MiaixzSdkConfig,
  translate: MiaixzTranslator = miaixzDefaultI18n.t,
): Readonly<MiaixzSdkConfig> {
  if (!isMiaixzSdkConfig(config)) {
    throw new MiaixzSdkError(translate("sdk.error.config.invalid"), { code: "CONFIG_INVALID" });
  }
  return Object.freeze({
    ...config,
    ...(config.services ? { services: Object.freeze({ ...config.services }) } : {}),
    ...(config.features ? { features: Object.freeze({ ...config.features }) } : {}),
    ...(config.appearance
      ? {
          appearance: Object.freeze({
            ...config.appearance,
            ...(config.appearance.colors
              ? { colors: Object.freeze({ ...config.appearance.colors }) }
              : {}),
          }),
        }
      : {}),
  });
}

/**
 * Reads an optional deployment-injected configuration object from `globalThis`.
 *
 * @param globalKey - Global property name to read.
 * @returns Injected value when the property exists.
 */
function readGlobalConfig(globalKey: string): unknown {
  return (globalThis as unknown as Record<string, unknown>)[globalKey];
}

/**
 * Loads configuration from an object, global variable, or remote JSON file.
 *
 * @param options - Ordered configuration sources and runtime adapters.
 * @returns A validated immutable SDK configuration.
 * @public
 */
export async function loadMiaixzConfig(
  options: MiaixzLoadConfigOptions = {},
): Promise<Readonly<MiaixzSdkConfig>> {
  const translate = options.translate ?? miaixzDefaultI18n.t;
  let candidate = options.config ?? readGlobalConfig(options.globalKey ?? "__MIAIXZ_CONFIG__");

  if (candidate === undefined && options.url) {
    const fetchImplementation = options.fetch ?? globalThis.fetch;
    if (!fetchImplementation) {
      throw new MiaixzSdkError(translate("sdk.error.config.invalid"), {
        code: "CONFIG_FETCH_UNAVAILABLE",
      });
    }
    try {
      const response = await fetchImplementation(options.url, { credentials: "same-origin" });
      if (!response.ok) {
        throw new MiaixzSdkError(translate("sdk.error.config.invalid"), {
          code: "CONFIG_FETCH_FAILED",
          details: { status: response.status, url: options.url },
        });
      }
      candidate = await response.json();
    } catch (cause) {
      if (isMiaixzSdkError(cause)) throw cause;
      throw new MiaixzSdkError(translate("sdk.error.config.invalid"), {
        code: "CONFIG_FETCH_FAILED",
        cause,
        details: { url: options.url },
      });
    }
  }

  if (!isMiaixzSdkConfig(candidate)) {
    throw new MiaixzSdkError(translate("sdk.error.config.invalid"), {
      code: "CONFIG_INVALID",
      details: candidate,
    });
  }
  return defineMiaixzConfig(candidate, translate);
}

/**
 * Resolves the base URL for an independently deployed frontend service.
 *
 * @param config - SDK configuration containing service endpoints.
 * @param service - Service name to resolve.
 * @param translate - Translator used for missing-service errors.
 * @returns Configured service base URL.
 * @throws MiaixzSdkError when the service name is not configured.
 * @public
 */
export function getMiaixzServiceEndpoint(
  config: Readonly<MiaixzSdkConfig>,
  service: string,
  translate: MiaixzTranslator = miaixzDefaultI18n.t,
): string {
  const endpoint = config.services?.[service];
  if (!endpoint) {
    throw new MiaixzSdkError(translate("sdk.error.config.serviceMissing", { service }), {
      code: "SERVICE_ENDPOINT_MISSING",
      details: { service },
    });
  }
  return endpoint;
}

/**
 * Returns a configured feature value or the caller-supplied fallback.
 *
 * @param config - SDK configuration containing feature flags.
 * @param feature - Feature name to resolve.
 * @param fallback - Value returned when the feature is not configured.
 * @returns Configured feature value or the supplied fallback.
 * @public
 */
export function getMiaixzFeature<T extends MiaixzFeatureValue>(
  config: Readonly<MiaixzSdkConfig>,
  feature: string,
  fallback: T,
): MiaixzFeatureValue | T {
  return config.features?.[feature] ?? fallback;
}

/**
 * Mutable configuration store with local subscriptions and cross-service events.
 *
 * @public
 */
export class MiaixzConfigStore {
  readonly #listeners = new Set<(config: Readonly<MiaixzSdkConfig>) => void>();
  #config: Readonly<MiaixzSdkConfig>;
  readonly #events: MiaixzEventBus<MiaixzSdkEventMap> | undefined;
  readonly #translate: MiaixzTranslator;
  #stopEventListener: (() => void) | undefined;

  /**
   * Creates a configuration store.
   *
   * @param config - Initial validated configuration.
   * @param events - Optional shared event bus.
   * @param translate - Translator used by validation errors.
   */
  constructor(
    config: MiaixzSdkConfig,
    events?: MiaixzEventBus<MiaixzSdkEventMap>,
    translate: MiaixzTranslator = miaixzDefaultI18n.t,
  ) {
    this.#translate = translate;
    this.#config = defineMiaixzConfig(config, this.#translate);
    this.#events = events;
    this.#stopEventListener = events?.on("config:changed", (nextConfig) => {
      if (isMiaixzSdkConfig(nextConfig)) this.#set(nextConfig, false);
    });
  }

  /**
   * Returns the current SDK configuration.
   *
   * @returns The current immutable configuration snapshot.
   */
  getSnapshot(): Readonly<MiaixzSdkConfig> {
    return this.#config;
  }

  /**
   * Validates, stores, publishes, and broadcasts new configuration.
   *
   * @param config - Configuration object to activate.
   */
  set(config: MiaixzSdkConfig): void {
    this.#set(config, true);
  }

  /**
   * Commits configuration and optionally broadcasts it.
   *
   * @param config - Configuration object to commit.
   * @param broadcast - Whether to publish the change through the event bus.
   */
  #set(config: MiaixzSdkConfig, broadcast: boolean): void {
    if (config === this.#config) return;
    this.#config = defineMiaixzConfig(config, this.#translate);
    for (const listener of this.#listeners) listener(this.#config);
    if (broadcast) this.#events?.emit("config:changed", this.#config);
  }

  /**
   * Registers a configuration listener and returns its unsubscribe function.
   *
   * @param listener - Callback invoked with each configuration snapshot.
   * @returns Function that unregisters the listener.
   */
  subscribe(listener: (config: Readonly<MiaixzSdkConfig>) => void): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  /**
   * Releases event subscriptions and local listeners.
   */
  destroy(): void {
    this.#stopEventListener?.();
    this.#listeners.clear();
  }
}
