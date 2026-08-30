import { MiaixzSdkError } from "../api/errors.js";
import {
  MIAIXZ_MODULE_PROTOCOL_VERSION,
  parseMiaixzModuleManifest,
  type MiaixzBridgeEnvelope,
  type MiaixzHostAdapter,
  type MiaixzHostBridge,
  type MiaixzModuleManifest,
  type MiaixzNavigationRequest,
  type MiaixzPostMessageChildOptions,
  type MiaixzPostMessageHost,
  type MiaixzPostMessageHostOptions,
} from "../contracts/index.js";
import { isMiaixzModulePermission } from "../contracts/permission.js";
import { translateMiaixzDefaultMessage } from "../i18n/default-translator.js";
import type { MiaixzMessageCatalog } from "../i18n/index.js";
import type { MiaixzRuntimeContext } from "../types/index.js";

type BridgeKind = MiaixzBridgeEnvelope["kind"];
type BridgeErrorCode =
  | "BRIDGE_CAPABILITY_UNAVAILABLE"
  | "BRIDGE_CRYPTO_UNAVAILABLE"
  | "BRIDGE_DISPOSED"
  | "BRIDGE_MESSAGE_INVALID"
  | "BRIDGE_NAVIGATION_STATE_INVALID"
  | "BRIDGE_NOT_READY"
  | "BRIDGE_ORIGIN_INVALID"
  | "BRIDGE_TIMEOUT"
  | "MODULE_HOST_INCOMPATIBLE"
  | "MODULE_MANIFEST_INVALID";

interface PendingRequest {
  /**
   * Method expected on the correlated response.
   */
  readonly method: string;

  /**
   * Resolves the request with a validated response payload.
   */
  readonly resolve: (payload: unknown) => void;

  /**
   * Rejects the request with a local SDK error.
   */
  readonly reject: (error: MiaixzSdkError) => void;

  /**
   * Cancels the request timeout.
   */
  readonly timer: ReturnType<typeof setTimeout>;

  /**
   * Tracks whether a cancel envelope was already sent.
   */
  cancelSent: boolean;
}

interface HostRequestState {
  /**
   * Tracks whether the Child cancelled this request.
   */
  cancelled: boolean;

  /**
   * Requests one cached response replay after an in-flight duplicate.
   */
  replayRequested: boolean;
}

interface CachedIncomingMessage {
  /**
   * Records when this incoming identifier was first accepted.
   */
  readonly timestamp: number;

  /**
   * Stores the completed response for duplicate Request replay.
   */
  response?: MiaixzBridgeEnvelope;

  /**
   * Tracks an in-flight Host request before its response exists.
   */
  request?: HostRequestState;
}

interface SafeRemoteError {
  /**
   * Stable registered SDK error code.
   */
  readonly code: string;

  /**
   * Registered internationalization key for the error.
   */
  readonly messageKey: string;
}

interface SubscriptionResponse {
  /**
   * Secure identifier assigned to one Host subscription.
   */
  readonly subscriptionId: string;
}

interface ChildEventListener {
  /**
   * Module-owned event type expected by the listener.
   */
  readonly type: string;

  /**
   * Delivers a validated subscription payload.
   */
  readonly listener: (payload: unknown) => void;
}

const moduleIdentifierPattern = /^[a-z][a-z0-9-]{1,63}$/;
const semanticVersionPattern =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*))?$/;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const envelopeKeys = new Set([
  "channel",
  "protocolVersion",
  "messageId",
  "moduleId",
  "kind",
  "method",
  "payload",
  "error",
]);
const bridgeKinds = new Set<BridgeKind>(["request", "response", "event", "cancel"]);
const allowedMethods = new Set([
  "bridge.handshake",
  "bridge.dispose",
  "context.get",
  "events.emit",
  "events.message",
  "events.subscribe",
  "events.unsubscribe",
  "i18n.register",
  "navigation.navigate",
  "permissions.has",
]);
const contextKeys = new Set([
  "departmentId",
  "locale",
  "organizationId",
  "spaceId",
  "tenantId",
  "timezone",
  "traceId",
  "userId",
]);
const errorMessageKeys: Readonly<Record<string, string>> = Object.freeze({
  ABORTED: "sdk.error.aborted",
  API_BASE_URL_INVALID: "sdk.error.api.baseUrlInvalid",
  API_CRYPTO_UNAVAILABLE: "sdk.error.api.cryptoUnavailable",
  API_ENVELOPE_INVALID: "sdk.error.api.envelopeInvalid",
  API_ENVELOPE_MODE_INVALID: "sdk.error.api.envelopeModeInvalid",
  API_FETCH_UNAVAILABLE: "sdk.error.api.fetchUnavailable",
  API_REQUEST_ORIGIN_INVALID: "sdk.error.api.requestOriginInvalid",
  API_RESPONSE_INVALID: "sdk.error.api.responseInvalid",
  API_RETRY_INVALID: "sdk.error.api.retryInvalid",
  API_TIMEOUT_INVALID: "sdk.error.api.timeoutInvalid",
  APPEARANCE_COLOR_INVALID: "sdk.error.appearance.colorInvalid",
  APPEARANCE_CONTRAST_INVALID: "sdk.error.appearance.contrastInvalid",
  AUTH_MODE_MISMATCH: "sdk.error.auth.modeMismatch",
  AUTH_PERSISTENCE_ACKNOWLEDGEMENT_REQUIRED: "sdk.error.auth.persistenceAcknowledgementRequired",
  AUTH_REFRESH_FAILED: "sdk.error.auth.refreshFailed",
  AUTH_SESSION_INVALID: "sdk.error.auth.sessionInvalid",
  BRIDGE_CAPABILITY_UNAVAILABLE: "sdk.error.bridge.capabilityUnavailable",
  BRIDGE_CRYPTO_UNAVAILABLE: "sdk.error.bridge.cryptoUnavailable",
  BRIDGE_DISPOSED: "sdk.error.bridge.disposed",
  BRIDGE_MESSAGE_INVALID: "sdk.error.bridge.messageInvalid",
  BRIDGE_NAVIGATION_STATE_INVALID: "sdk.error.bridge.navigationStateInvalid",
  BRIDGE_NOT_READY: "sdk.error.bridge.notReady",
  BRIDGE_ORIGIN_INVALID: "sdk.error.bridge.originInvalid",
  BRIDGE_TIMEOUT: "sdk.error.bridge.timeout",
  MODULE_HOST_INCOMPATIBLE: "sdk.error.module.hostIncompatible",
  MODULE_MANIFEST_INVALID: "sdk.error.module.manifestInvalid",
  CONFIG_FETCH_FAILED: "sdk.error.config.fetchFailed",
  CONFIG_FETCH_UNAVAILABLE: "sdk.error.config.fetchUnavailable",
  CONFIG_INVALID: "sdk.error.config.invalid",
  CONTEXT_INVALID: "sdk.error.context.invalid",
  EVENT_CHANNEL_INVALID: "sdk.error.event.channelInvalid",
  EVENT_CRYPTO_UNAVAILABLE: "sdk.error.event.cryptoUnavailable",
  EVENT_PAYLOAD_NOT_CLONEABLE: "sdk.error.event.payloadNotCloneable",
  EVENT_VALIDATOR_MISSING: "sdk.error.event.validatorMissing",
  FILE_DOWNLOAD_FAILED: "sdk.error.file.downloadFailed",
  I18N_LOAD_FAILED: "sdk.error.i18n.loadFailed",
  I18N_LOCALE_INVALID: "sdk.error.i18n.localeInvalid",
  I18N_MESSAGES_INVALID: "sdk.error.i18n.messagesInvalid",
  I18N_NAMESPACE_INVALID: "sdk.error.i18n.namespaceInvalid",
  NETWORK_ERROR: "sdk.error.network",
  PERMISSIONS_INVALID: "sdk.error.permissions.invalid",
  SERVICE_ENDPOINT_MISSING: "sdk.error.config.serviceMissing",
  STORAGE_MIGRATION_CHAIN_INVALID: "sdk.error.storage.migrationChainInvalid",
  STORAGE_SCOPE_INVALID: "sdk.error.storage.scopeInvalid",
  TIMEOUT: "sdk.error.timeout",
});

/**
 * Creates a registered Bridge error without caller-owned diagnostic values.
 *
 * @param code - Stable registered Bridge error code.
 * @returns Localized SDK error.
 */
function bridgeError(code: BridgeErrorCode): MiaixzSdkError {
  return new MiaixzSdkError(translateMiaixzDefaultMessage(errorMessageKeys[code] ?? code), {
    code,
  });
}

/**
 * Determines whether a value is a plain record.
 *
 * @param value - Runtime value to inspect.
 * @returns Whether the value is a record without a custom prototype.
 */
function isPlainRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

/**
 * Determines whether a record contains exactly allowed field names.
 *
 * @param value - Record whose enumerable keys should be checked.
 * @param allowed - Complete allowed key set.
 * @returns Whether every key is allowed.
 */
function hasOnlyKeys(
  value: Readonly<Record<string, unknown>>,
  allowed: ReadonlySet<string>,
): boolean {
  return Object.keys(value).every((key) => allowed.has(key));
}

/**
 * Resolves the current Realm Window required by postMessage Bridge factories.
 *
 * @returns Browser Window capable of registering message listeners.
 * @throws MiaixzSdkError When the current Realm lacks required Window capabilities.
 */
function getRuntimeWindow(): Window {
  const candidate = globalThis.window;
  if (
    candidate === undefined ||
    typeof candidate.addEventListener !== "function" ||
    typeof candidate.removeEventListener !== "function"
  ) {
    throw bridgeError("BRIDGE_CAPABILITY_UNAVAILABLE");
  }
  return candidate;
}

/**
 * Validates a Window used as the single postMessage target.
 *
 * @param targetWindow - Window candidate to validate.
 * @returns Valid target Window.
 * @throws MiaixzSdkError When postMessage is unavailable.
 */
function parseTargetWindow(targetWindow: Window): Window {
  if (targetWindow === null || typeof targetWindow?.postMessage !== "function") {
    throw bridgeError("BRIDGE_CAPABILITY_UNAVAILABLE");
  }
  return targetWindow;
}

/**
 * Validates one exact HTTP or HTTPS origin string.
 *
 * @param value - Origin candidate.
 * @returns Canonical origin identical to the supplied value.
 * @throws MiaixzSdkError When the value is not one exact origin.
 */
function parseTargetOrigin(value: string): string {
  if (typeof value !== "string" || value === "*" || value === "null") {
    throw bridgeError("BRIDGE_ORIGIN_INVALID");
  }
  try {
    const parsed = new URL(value);
    if (
      (parsed.protocol !== "https:" && parsed.protocol !== "http:") ||
      parsed.origin !== value ||
      parsed.username !== "" ||
      parsed.password !== "" ||
      parsed.pathname !== "/" ||
      parsed.search !== "" ||
      parsed.hash !== ""
    ) {
      throw bridgeError("BRIDGE_ORIGIN_INVALID");
    }
    return parsed.origin;
  } catch (error) {
    if (error instanceof MiaixzSdkError) throw error;
    throw bridgeError("BRIDGE_ORIGIN_INVALID");
  }
}

/**
 * Validates one Bridge request timeout.
 *
 * @param timeoutMs - Optional timeout override.
 * @returns Valid timeout, defaulting to ten seconds.
 * @throws MiaixzSdkError When the timeout is outside the frozen range.
 */
function parseTimeout(timeoutMs: number | undefined): number {
  const value = timeoutMs ?? 10_000;
  if (!Number.isInteger(value) || value < 1_000 || value > 60_000) {
    throw bridgeError("BRIDGE_MESSAGE_INVALID");
  }
  return value;
}

/**
 * Produces one secure Bridge message or subscription identifier.
 *
 * @returns Cryptographically secure UUID.
 * @throws MiaixzSdkError When secure UUID generation is unavailable.
 */
function createMessageId(): string {
  if (typeof globalThis.crypto?.randomUUID !== "function") {
    throw bridgeError("BRIDGE_CRYPTO_UNAVAILABLE");
  }
  return globalThis.crypto.randomUUID();
}

/**
 * Validates the fixed Bridge envelope without interpreting method payloads.
 *
 * @param value - Incoming message data.
 * @returns Frozen typed envelope, or undefined for invalid data.
 */
function parseEnvelope(value: unknown): MiaixzBridgeEnvelope | undefined {
  if (
    !isPlainRecord(value) ||
    !hasOnlyKeys(value, envelopeKeys) ||
    value.channel !== "miaixz.bridge" ||
    value.protocolVersion !== MIAIXZ_MODULE_PROTOCOL_VERSION ||
    typeof value.messageId !== "string" ||
    !uuidPattern.test(value.messageId) ||
    typeof value.moduleId !== "string" ||
    !moduleIdentifierPattern.test(value.moduleId) ||
    typeof value.kind !== "string" ||
    !bridgeKinds.has(value.kind as BridgeKind) ||
    typeof value.method !== "string" ||
    !allowedMethods.has(value.method)
  ) {
    return undefined;
  }
  if (value.error !== undefined) {
    if (
      value.kind !== "response" ||
      !isPlainRecord(value.error) ||
      !hasOnlyKeys(value.error, new Set(["code", "messageKey", "details"])) ||
      typeof value.error.code !== "string" ||
      typeof value.error.messageKey !== "string"
    ) {
      return undefined;
    }
    if (value.payload !== undefined || value.error.details !== undefined) return undefined;
  }
  return Object.freeze({ ...value }) as unknown as MiaixzBridgeEnvelope;
}

/**
 * Creates one immutable outgoing Bridge envelope.
 *
 * @param moduleId - Module owning the connection.
 * @param kind - Message state-machine branch.
 * @param method - Allow-listed Bridge method.
 * @param messageId - Existing request identifier or a new event identifier.
 * @param payload - Optional method payload.
 * @param error - Optional safe remote error.
 * @returns Frozen Bridge envelope.
 */
function createEnvelope(
  moduleId: string,
  kind: BridgeKind,
  method: string,
  messageId: string,
  payload?: unknown,
  error?: MiaixzBridgeEnvelope["error"],
): MiaixzBridgeEnvelope {
  return Object.freeze({
    channel: "miaixz.bridge",
    protocolVersion: MIAIXZ_MODULE_PROTOCOL_VERSION,
    messageId,
    moduleId,
    kind,
    method,
    ...(payload === undefined ? {} : { payload }),
    ...(error === undefined ? {} : { error }),
  });
}

/**
 * Maps an Adapter failure to the only safe cross-origin error fields.
 *
 * @param error - Local Adapter failure.
 * @returns Frozen registered error code and message key.
 */
function serializeError(error: unknown): Readonly<SafeRemoteError> {
  const candidate = error instanceof MiaixzSdkError ? error.code : undefined;
  const code =
    candidate !== undefined && candidate in errorMessageKeys ? candidate : "BRIDGE_MESSAGE_INVALID";
  return Object.freeze({
    code,
    messageKey: errorMessageKeys[code] ?? "sdk.error.bridge.messageInvalid",
  });
}

/**
 * Reconstructs a safe local SDK error from one remote response.
 *
 * @param error - Remote error fields.
 * @returns Localized SDK error without remote cause or stack.
 */
function deserializeError(error: NonNullable<MiaixzBridgeEnvelope["error"]>): MiaixzSdkError {
  const code = error.code;
  const messageKey = errorMessageKeys[code];
  if (messageKey === undefined || error.messageKey !== messageKey) {
    return bridgeError("BRIDGE_MESSAGE_INVALID");
  }
  return new MiaixzSdkError(translateMiaixzDefaultMessage(messageKey), { code });
}

/**
 * Removes expired identifiers and enforces the frozen cache capacity.
 *
 * @param cache - Incoming message cache to compact.
 * @param now - Current epoch time.
 */
function compactCache(cache: Map<string, CachedIncomingMessage>, now = Date.now()): void {
  for (const [messageId, entry] of cache) {
    if (now - entry.timestamp > 300_000) cache.delete(messageId);
  }
  while (cache.size > 1_000) {
    const oldest = cache.keys().next().value as string | undefined;
    if (oldest === undefined) break;
    cache.delete(oldest);
  }
}

/**
 * Validates and clones a same-site navigation request.
 *
 * @param value - Request payload to validate.
 * @returns Frozen navigation request.
 * @throws MiaixzSdkError When the request or state is invalid.
 */
function parseNavigation(value: unknown): MiaixzNavigationRequest {
  if (
    !isPlainRecord(value) ||
    !hasOnlyKeys(value, new Set(["path", "replace", "state"])) ||
    typeof value.path !== "string" ||
    !value.path.startsWith("/") ||
    value.path.startsWith("//") ||
    value.path.includes("\\") ||
    (value.replace !== undefined && typeof value.replace !== "boolean")
  ) {
    throw bridgeError("BRIDGE_MESSAGE_INVALID");
  }
  let state: unknown;
  if (value.state !== undefined) {
    try {
      state = structuredClone(value.state);
    } catch {
      throw bridgeError("BRIDGE_NAVIGATION_STATE_INVALID");
    }
  }
  return Object.freeze({
    path: value.path,
    ...(value.replace === undefined ? {} : { replace: value.replace }),
    ...(value.state === undefined ? {} : { state }),
  });
}

/**
 * Validates one permission list sent through the Bridge.
 *
 * @param value - Permission payload field.
 * @returns Frozen permission copy.
 * @throws MiaixzSdkError When a permission is malformed.
 */
function parsePermissions(value: unknown): readonly string[] {
  if (!Array.isArray(value) || !value.every(isMiaixzModulePermission)) {
    throw bridgeError("BRIDGE_MESSAGE_INVALID");
  }
  return Object.freeze([...value]);
}

/**
 * Validates and freezes a non-sensitive runtime Context payload.
 *
 * @param value - Context payload to validate.
 * @returns Frozen Context containing only registered string fields.
 * @throws MiaixzSdkError When the Context contains unknown or non-string fields.
 */
function parseRuntimeContext(value: unknown): Readonly<MiaixzRuntimeContext> {
  if (
    !isPlainRecord(value) ||
    !hasOnlyKeys(value, contextKeys) ||
    Object.values(value).some((entry) => entry !== undefined && typeof entry !== "string")
  ) {
    throw bridgeError("BRIDGE_MESSAGE_INVALID");
  }
  return Object.freeze(
    Object.fromEntries(Object.entries(value).filter((entry) => entry[1] !== undefined)),
  ) as Readonly<MiaixzRuntimeContext>;
}

/**
 * Validates and defensively freezes a project message catalog.
 *
 * @param namespace - Module namespace that must own every message key.
 * @param value - Catalog payload to validate.
 * @returns Frozen locale and message map.
 * @throws MiaixzSdkError When a locale or message collection is invalid.
 */
function parseMessageCatalog(namespace: string, value: unknown): MiaixzMessageCatalog {
  if (!isPlainRecord(value)) throw bridgeError("BRIDGE_MESSAGE_INVALID");
  const catalog: Record<string, Readonly<Record<string, string>>> = {};
  for (const [locale, messages] of Object.entries(value)) {
    try {
      if (Intl.getCanonicalLocales(locale)[0] !== locale) throw new Error("non-canonical locale");
    } catch {
      throw bridgeError("BRIDGE_MESSAGE_INVALID");
    }
    if (
      !isPlainRecord(messages) ||
      Object.entries(messages).some(
        ([key, message]) => !key.startsWith(`${namespace}.`) || typeof message !== "string",
      )
    ) {
      throw bridgeError("BRIDGE_MESSAGE_INVALID");
    }
    catalog[locale] = Object.freeze({ ...messages }) as Readonly<Record<string, string>>;
  }
  return Object.freeze(catalog);
}

/**
 * Validates one module-owned Bridge event name.
 *
 * @param moduleId - Module owning the connection.
 * @param value - Event type candidate.
 * @returns Valid module event type.
 * @throws MiaixzSdkError When the event is malformed or belongs to another module.
 */
function parseEventType(moduleId: string, value: unknown): string {
  if (typeof value !== "string") throw bridgeError("BRIDGE_MESSAGE_INVALID");
  const separator = value.indexOf(":");
  if (
    separator < 0 ||
    value.indexOf(":", separator + 1) >= 0 ||
    value.slice(0, separator) !== moduleId ||
    !moduleIdentifierPattern.test(value.slice(separator + 1))
  ) {
    throw bridgeError("BRIDGE_MESSAGE_INVALID");
  }
  return value;
}

/**
 * Determines the sorted capabilities actually present on one Host Adapter.
 *
 * @param adapter - Host Adapter to inspect.
 * @returns Sorted capability names.
 */
function getCapabilities(adapter: MiaixzHostAdapter): readonly string[] {
  const capabilities = [
    ["context", adapter.getContext],
    ["events", adapter.emit && adapter.subscribe],
    ["i18n", adapter.registerMessages],
    ["navigation", adapter.navigate],
    ["permissions", adapter.hasPermissions],
  ] as const;
  return Object.freeze(
    capabilities
      .filter((entry) => typeof entry[1] === "function")
      .map((entry) => entry[0])
      .sort(),
  );
}

/**
 * Implements the Host half of a postMessage Bridge.
 */
class PostMessageHost implements MiaixzPostMessageHost {
  readonly ready: Promise<void>;
  readonly #runtimeWindow: Window;
  readonly #targetWindow: Window;
  readonly #targetOrigin: string;
  readonly #manifest: Readonly<MiaixzModuleManifest>;
  readonly #adapter: MiaixzHostAdapter;
  readonly #capabilities: readonly string[];
  readonly #incoming = new Map<string, CachedIncomingMessage>();
  readonly #subscriptions = new Map<string, () => Promise<void>>();
  readonly #requests = new Map<string, HostRequestState>();
  readonly #resolveReady: () => void;
  readonly #rejectReady: (error: MiaixzSdkError) => void;
  readonly #readyTimer: ReturnType<typeof setTimeout> | undefined;
  #readyState: "pending" | "resolved" | "rejected" = "pending";
  #disposed = false;

  /**
   * Creates and starts one Host-side handshake listener.
   *
   * @param options - Validated Host construction options.
   */
  constructor(options: MiaixzPostMessageHostOptions) {
    this.#runtimeWindow = getRuntimeWindow();
    this.#targetWindow = parseTargetWindow(options.targetWindow);
    this.#targetOrigin = parseTargetOrigin(options.targetOrigin);
    this.#manifest = parseMiaixzModuleManifest(options.manifest);
    if (this.#manifest.kind !== "iframe") throw bridgeError("BRIDGE_ORIGIN_INVALID");
    let entryOrigin: string;
    try {
      entryOrigin = new URL(this.#manifest.entry).origin;
    } catch {
      throw bridgeError("BRIDGE_ORIGIN_INVALID");
    }
    if (entryOrigin !== this.#targetOrigin) throw bridgeError("BRIDGE_ORIGIN_INVALID");
    if (!isPlainRecord(options.adapter)) throw bridgeError("BRIDGE_MESSAGE_INVALID");
    this.#adapter = options.adapter;
    this.#capabilities = getCapabilities(this.#adapter);
    const timeoutMs = parseTimeout(options.timeoutMs);
    let resolveReady!: () => void;
    let rejectReady!: (error: MiaixzSdkError) => void;
    this.ready = new Promise<void>((resolve, reject) => {
      resolveReady = resolve;
      rejectReady = reject;
    });
    this.#resolveReady = resolveReady;
    this.#rejectReady = rejectReady;
    if (
      this.#manifest.requiredCapabilities.some(
        (capability) => !this.#capabilities.includes(capability),
      )
    ) {
      this.#readyTimer = undefined;
      this.#rejectStartup(bridgeError("BRIDGE_CAPABILITY_UNAVAILABLE"));
      return;
    }
    this.#runtimeWindow.addEventListener("message", this.#onMessage);
    this.#readyTimer = setTimeout(() => {
      this.#rejectStartup(bridgeError("BRIDGE_TIMEOUT"));
      this.dispose();
    }, timeoutMs);
  }

  /**
   * Releases the Host connection and all tracked subscriptions.
   */
  dispose(): void {
    if (this.#disposed) return;
    this.#disposed = true;
    if (this.#readyTimer !== undefined) clearTimeout(this.#readyTimer);
    this.#runtimeWindow.removeEventListener("message", this.#onMessage);
    if (this.#readyState === "pending") this.#rejectStartup(bridgeError("BRIDGE_DISPOSED"));
    for (const unsubscribe of this.#subscriptions.values()) {
      void unsubscribe().catch(() => undefined);
    }
    this.#subscriptions.clear();
    this.#requests.clear();
    this.#incoming.clear();
  }

  /**
   * Handles one Window message after exact source and origin filtering.
   *
   * @param event - Browser message event.
   */
  readonly #onMessage = (event: MessageEvent): void => {
    if (
      this.#disposed ||
      event.source !== this.#targetWindow ||
      event.origin !== this.#targetOrigin
    )
      return;
    const envelope = parseEnvelope(event.data);
    if (envelope === undefined || envelope.moduleId !== this.#manifest.id) return;
    compactCache(this.#incoming);
    if (envelope.kind === "cancel") {
      const request = this.#requests.get(envelope.messageId);
      if (request !== undefined) request.cancelled = true;
      return;
    }
    const duplicate = this.#incoming.get(envelope.messageId);
    if (duplicate !== undefined) {
      if (envelope.kind === "request") {
        if (duplicate.response !== undefined) this.#post(duplicate.response);
        else if (duplicate.request !== undefined) duplicate.request.replayRequested = true;
      }
      return;
    }
    this.#incoming.set(envelope.messageId, { timestamp: Date.now() });
    if (envelope.kind !== "request") return;
    if (!this.#isReady() && envelope.method !== "bridge.handshake") {
      this.#respondWithError(envelope, bridgeError("BRIDGE_NOT_READY"));
      return;
    }
    const requestState: HostRequestState = { cancelled: false, replayRequested: false };
    this.#requests.set(envelope.messageId, requestState);
    const cached = this.#incoming.get(envelope.messageId);
    if (cached !== undefined) cached.request = requestState;
    void this.#handleRequest(envelope).then(
      (payload) => this.#completeRequest(envelope, payload),
      (error: unknown) => this.#completeRequest(envelope, undefined, error),
    );
  };

  /**
   * Reports whether the handshake has completed successfully.
   *
   * @returns Whether the Host accepts non-handshake requests.
   */
  #isReady(): boolean {
    return this.#readyState === "resolved";
  }

  /**
   * Handles one validated request method.
   *
   * @param envelope - Valid request envelope.
   * @returns Method response payload.
   */
  async #handleRequest(envelope: MiaixzBridgeEnvelope): Promise<unknown> {
    switch (envelope.method) {
      case "bridge.handshake":
        return this.#handleHandshake(envelope.payload);
      case "context.get":
        if (envelope.payload !== undefined) throw bridgeError("BRIDGE_MESSAGE_INVALID");
        return parseRuntimeContext(await this.#requireCapability("getContext")());
      case "navigation.navigate":
        await this.#requireCapability("navigate")(parseNavigation(envelope.payload));
        return undefined;
      case "permissions.has": {
        if (
          !isPlainRecord(envelope.payload) ||
          !hasOnlyKeys(envelope.payload, new Set(["permissions"]))
        )
          throw bridgeError("BRIDGE_MESSAGE_INVALID");
        const allowed = await this.#requireCapability("hasPermissions")(
          parsePermissions(envelope.payload.permissions),
        );
        return Object.freeze({ allowed });
      }
      case "i18n.register": {
        if (
          !isPlainRecord(envelope.payload) ||
          !hasOnlyKeys(envelope.payload, new Set(["namespace", "catalog"])) ||
          envelope.payload.namespace !== this.#manifest.id
        )
          throw bridgeError("BRIDGE_MESSAGE_INVALID");
        await this.#requireCapability("registerMessages")(
          envelope.payload.namespace,
          parseMessageCatalog(envelope.payload.namespace, envelope.payload.catalog),
        );
        return undefined;
      }
      case "events.emit": {
        if (
          !isPlainRecord(envelope.payload) ||
          !hasOnlyKeys(envelope.payload, new Set(["type", "payload"]))
        )
          throw bridgeError("BRIDGE_MESSAGE_INVALID");
        await this.#requireCapability("emit")(
          parseEventType(this.#manifest.id, envelope.payload.type),
          envelope.payload.payload,
        );
        return undefined;
      }
      case "events.subscribe":
        return this.#subscribe(envelope.payload);
      case "events.unsubscribe":
        await this.#unsubscribe(envelope.payload);
        return undefined;
      case "bridge.dispose":
        if (envelope.payload !== undefined) throw bridgeError("BRIDGE_MESSAGE_INVALID");
        return undefined;
      default:
        throw bridgeError("BRIDGE_MESSAGE_INVALID");
    }
  }

  /**
   * Validates and accepts the only allowed handshake payload.
   *
   * @param payload - Handshake request payload.
   * @returns Accepted handshake response payload.
   */
  #handleHandshake(payload: unknown): Readonly<Record<string, unknown>> {
    if (
      this.#readyState !== "pending" ||
      !isPlainRecord(payload) ||
      !hasOnlyKeys(payload, new Set(["moduleId", "moduleVersion", "protocolVersion"])) ||
      payload.moduleId !== this.#manifest.id ||
      payload.moduleVersion !== this.#manifest.version ||
      payload.protocolVersion !== MIAIXZ_MODULE_PROTOCOL_VERSION
    ) {
      throw bridgeError("BRIDGE_MESSAGE_INVALID");
    }
    return Object.freeze({
      accepted: true,
      protocolVersion: MIAIXZ_MODULE_PROTOCOL_VERSION,
      capabilities: this.#capabilities,
    });
  }

  /**
   * Registers one Host event subscription and returns its secure identifier.
   *
   * @param payload - Subscribe request payload.
   * @returns Subscription response payload.
   */
  async #subscribe(payload: unknown): Promise<Readonly<SubscriptionResponse>> {
    if (!isPlainRecord(payload) || !hasOnlyKeys(payload, new Set(["type"])))
      throw bridgeError("BRIDGE_MESSAGE_INVALID");
    const type = parseEventType(this.#manifest.id, payload.type);
    const subscriptionId = createMessageId();
    let cancelled = false;
    const rawUnsubscribe = await this.#requireCapability("subscribe")(type, (eventPayload) => {
      if (cancelled || this.#disposed) return;
      this.#post(
        createEnvelope(this.#manifest.id, "event", "events.message", createMessageId(), {
          subscriptionId,
          type,
          payload: eventPayload,
        }),
      );
    });
    if (typeof rawUnsubscribe !== "function") throw bridgeError("BRIDGE_MESSAGE_INVALID");
    const unsubscribe = async (): Promise<void> => {
      if (cancelled) return;
      cancelled = true;
      this.#subscriptions.delete(subscriptionId);
      await Promise.resolve().then(rawUnsubscribe);
    };
    this.#subscriptions.set(subscriptionId, unsubscribe);
    return Object.freeze({ subscriptionId });
  }

  /**
   * Removes one previously registered Host event subscription.
   *
   * @param payload - Unsubscribe request payload.
   */
  async #unsubscribe(payload: unknown): Promise<void> {
    if (
      !isPlainRecord(payload) ||
      !hasOnlyKeys(payload, new Set(["subscriptionId"])) ||
      typeof payload.subscriptionId !== "string" ||
      !uuidPattern.test(payload.subscriptionId)
    )
      throw bridgeError("BRIDGE_MESSAGE_INVALID");
    await this.#subscriptions.get(payload.subscriptionId)?.();
  }

  /**
   * Completes one Host request, caches its response, and performs final disposal when requested.
   *
   * @param request - Completed request envelope.
   * @param payload - Successful response payload.
   * @param error - Optional request failure.
   */
  #completeRequest(request: MiaixzBridgeEnvelope, payload?: unknown, error?: unknown): void {
    const state = this.#requests.get(request.messageId);
    this.#requests.delete(request.messageId);
    if (state?.cancelled === true || this.#disposed) return;
    const response = createEnvelope(
      this.#manifest.id,
      "response",
      request.method,
      request.messageId,
      payload,
      error === undefined ? undefined : serializeError(error),
    );
    const cached = this.#incoming.get(request.messageId);
    if (cached !== undefined) cached.response = response;
    this.#post(response);
    if (state?.replayRequested === true) this.#post(response);
    if (request.method === "bridge.handshake") {
      if (error === undefined) this.#resolveStartup();
      else {
        this.#rejectStartup(
          error instanceof MiaixzSdkError ? error : bridgeError("BRIDGE_MESSAGE_INVALID"),
        );
        this.dispose();
      }
    }
    if (request.method === "bridge.dispose" && error === undefined) this.dispose();
  }

  /**
   * Sends one immediate error response for a valid request.
   *
   * @param request - Request being rejected.
   * @param error - Registered SDK error.
   */
  #respondWithError(request: MiaixzBridgeEnvelope, error: MiaixzSdkError): void {
    this.#post(
      createEnvelope(
        this.#manifest.id,
        "response",
        request.method,
        request.messageId,
        undefined,
        serializeError(error),
      ),
    );
  }

  /**
   * Posts one envelope to the single validated target.
   *
   * @param envelope - Envelope to send.
   */
  #post(envelope: MiaixzBridgeEnvelope): void {
    this.#targetWindow.postMessage(envelope, this.#targetOrigin);
  }

  /**
   * Resolves the Host startup Promise exactly once.
   */
  #resolveStartup(): void {
    if (this.#readyState !== "pending") return;
    this.#readyState = "resolved";
    if (this.#readyTimer !== undefined) clearTimeout(this.#readyTimer);
    this.#resolveReady();
  }

  /**
   * Rejects the Host startup Promise exactly once.
   *
   * @param error - Deterministic startup failure.
   */
  #rejectStartup(error: MiaixzSdkError): void {
    if (this.#readyState !== "pending") return;
    this.#readyState = "rejected";
    if (this.#readyTimer !== undefined) clearTimeout(this.#readyTimer);
    this.#rejectReady(error);
  }

  /**
   * Returns one injected Adapter capability or throws the frozen missing-capability error.
   *
   * @typeParam Name - Adapter capability name.
   * @param name - Capability to resolve.
   * @returns Injected Adapter function.
   */
  #requireCapability<Name extends keyof MiaixzHostAdapter>(
    name: Name,
  ): NonNullable<MiaixzHostAdapter[Name]> {
    const capability = this.#adapter[name];
    if (capability === undefined) throw bridgeError("BRIDGE_CAPABILITY_UNAVAILABLE");
    return capability as NonNullable<MiaixzHostAdapter[Name]>;
  }
}

/**
 * Implements the Child half of a postMessage Host Bridge.
 */
class PostMessageChildBridge implements MiaixzHostBridge {
  /**
   * Micro-frontend protocol version implemented by the bridge.
   */
  readonly protocolVersion = MIAIXZ_MODULE_PROTOCOL_VERSION;

  readonly #runtimeWindow: Window;
  readonly #targetWindow: Window;
  readonly #targetOrigin: string;
  readonly #moduleId: string;
  readonly #moduleVersion: string;
  readonly #timeoutMs: number;
  readonly #pending = new Map<string, PendingRequest>();
  readonly #incoming = new Map<string, CachedIncomingMessage>();
  readonly #listeners = new Map<string, ChildEventListener>();
  #disposed = false;

  /**
   * Creates one Child Bridge before its handshake starts.
   *
   * @param options - Validated Child connection options.
   */
  constructor(options: MiaixzPostMessageChildOptions) {
    this.#runtimeWindow = getRuntimeWindow();
    this.#targetWindow = parseTargetWindow(options.targetWindow);
    this.#targetOrigin = parseTargetOrigin(options.targetOrigin);
    if (!moduleIdentifierPattern.test(options.moduleId))
      throw bridgeError("BRIDGE_MESSAGE_INVALID");
    if (!semanticVersionPattern.test(options.moduleVersion))
      throw bridgeError("BRIDGE_MESSAGE_INVALID");
    this.#moduleId = options.moduleId;
    this.#moduleVersion = options.moduleVersion;
    this.#timeoutMs = parseTimeout(options.timeoutMs);
    this.#runtimeWindow.addEventListener("message", this.#onMessage);
  }

  /**
   * Performs the fixed Child-initiated handshake.
   *
   * @returns Connected Child Bridge.
   */
  async connect(): Promise<MiaixzHostBridge> {
    const payload = await this.#request("bridge.handshake", {
      moduleId: this.#moduleId,
      moduleVersion: this.#moduleVersion,
      protocolVersion: MIAIXZ_MODULE_PROTOCOL_VERSION,
    });
    if (
      !isPlainRecord(payload) ||
      !hasOnlyKeys(payload, new Set(["accepted", "protocolVersion", "capabilities"])) ||
      payload.accepted !== true ||
      payload.protocolVersion !== MIAIXZ_MODULE_PROTOCOL_VERSION ||
      !Array.isArray(payload.capabilities) ||
      !payload.capabilities.every((value) => typeof value === "string")
    ) {
      this.dispose();
      throw bridgeError("BRIDGE_MESSAGE_INVALID");
    }
    return this;
  }

  /**
   * Reads the current non-sensitive Host context.
   *
   * @returns Runtime context returned by the Host.
   */
  async getContext(): Promise<Readonly<MiaixzRuntimeContext>> {
    const payload = await this.#request("context.get");
    return parseRuntimeContext(payload);
  }

  /**
   * Requests validated same-site Host navigation.
   *
   * @param request - Navigation request to validate and send.
   */
  async navigate(request: Readonly<MiaixzNavigationRequest>): Promise<void> {
    const payload = await this.#request("navigation.navigate", parseNavigation(request));
    if (payload !== undefined) throw bridgeError("BRIDGE_MESSAGE_INVALID");
  }

  /**
   * Checks whether all requested permissions are available.
   *
   * @param permissions - Non-wildcard permission list.
   * @returns Whether the Host allows every permission.
   */
  async hasPermissions(permissions: readonly string[]): Promise<boolean> {
    const payload = await this.#request("permissions.has", {
      permissions: parsePermissions(permissions),
    });
    if (
      !isPlainRecord(payload) ||
      !hasOnlyKeys(payload, new Set(["allowed"])) ||
      typeof payload.allowed !== "boolean"
    )
      throw bridgeError("BRIDGE_MESSAGE_INVALID");
    return payload.allowed;
  }

  /**
   * Registers one module-owned internationalization catalog.
   *
   * @param namespace - Namespace that must equal the module identifier.
   * @param catalog - Localized project messages.
   */
  async registerMessages(namespace: string, catalog: MiaixzMessageCatalog): Promise<void> {
    this.#assertActive();
    if (namespace !== this.#moduleId) throw bridgeError("BRIDGE_MESSAGE_INVALID");
    const payload = await this.#request("i18n.register", {
      namespace,
      catalog: parseMessageCatalog(namespace, catalog),
    });
    if (payload !== undefined) throw bridgeError("BRIDGE_MESSAGE_INVALID");
  }

  /**
   * Emits one module-scoped event through the Host.
   *
   * @typeParam T - Event payload type.
   * @param type - Module-owned event type.
   * @param payload - Event payload.
   */
  async emit<T = unknown>(type: string, payload: T): Promise<void> {
    const response = await this.#request("events.emit", {
      type: parseEventType(this.#moduleId, type),
      payload,
    });
    if (response !== undefined) throw bridgeError("BRIDGE_MESSAGE_INVALID");
  }

  /**
   * Subscribes to one module-scoped Host event.
   *
   * @typeParam T - Event payload type.
   * @param type - Module-owned event type.
   * @param listener - Event listener.
   * @returns Idempotent asynchronous unsubscribe function.
   */
  async subscribe<T = unknown>(
    type: string,
    listener: (payload: T) => void,
  ): Promise<() => Promise<void>> {
    this.#assertActive();
    const parsedType = parseEventType(this.#moduleId, type);
    if (typeof listener !== "function") throw bridgeError("BRIDGE_MESSAGE_INVALID");
    const payload = await this.#request("events.subscribe", { type: parsedType });
    if (
      !isPlainRecord(payload) ||
      !hasOnlyKeys(payload, new Set(["subscriptionId"])) ||
      typeof payload.subscriptionId !== "string" ||
      !uuidPattern.test(payload.subscriptionId)
    )
      throw bridgeError("BRIDGE_MESSAGE_INVALID");
    const subscriptionId = payload.subscriptionId;
    this.#listeners.set(subscriptionId, {
      type: parsedType,
      listener: (eventPayload) => listener(eventPayload as T),
    });
    let cancelled = false;
    return async () => {
      if (cancelled) return;
      cancelled = true;
      this.#listeners.delete(subscriptionId);
      if (this.#disposed) return;
      const response = await this.#request("events.unsubscribe", { subscriptionId });
      if (response !== undefined) throw bridgeError("BRIDGE_MESSAGE_INVALID");
    };
  }

  /**
   * Notifies the Host and immediately releases local requests and listeners.
   */
  dispose(): void {
    if (this.#disposed) return;
    try {
      this.#post(createEnvelope(this.#moduleId, "request", "bridge.dispose", createMessageId()));
    } catch {
      // Best-effort remote disposal cannot delay deterministic local cleanup.
    }
    this.#disposed = true;
    for (const [pendingId, pending] of this.#pending) {
      clearTimeout(pending.timer);
      this.#sendCancel(pendingId, pending);
      pending.reject(bridgeError("BRIDGE_DISPOSED"));
    }
    this.#pending.clear();
    this.#listeners.clear();
    this.#incoming.clear();
    this.#runtimeWindow.removeEventListener("message", this.#onMessage);
  }

  /**
   * Handles one exact-source Child response or event.
   *
   * @param event - Browser message event.
   */
  readonly #onMessage = (event: MessageEvent): void => {
    if (
      this.#disposed ||
      event.source !== this.#targetWindow ||
      event.origin !== this.#targetOrigin
    )
      return;
    const envelope = parseEnvelope(event.data);
    if (envelope === undefined || envelope.moduleId !== this.#moduleId) return;
    compactCache(this.#incoming);
    if (envelope.kind === "event") {
      if (this.#incoming.has(envelope.messageId)) return;
      this.#incoming.set(envelope.messageId, { timestamp: Date.now() });
      this.#handleEvent(envelope);
      return;
    }
    if (envelope.kind !== "response") return;
    const pending = this.#pending.get(envelope.messageId);
    if (pending === undefined || pending.method !== envelope.method) return;
    if (this.#incoming.has(envelope.messageId)) return;
    this.#incoming.set(envelope.messageId, { timestamp: Date.now() });
    this.#pending.delete(envelope.messageId);
    clearTimeout(pending.timer);
    if (envelope.error !== undefined) pending.reject(deserializeError(envelope.error));
    else pending.resolve(envelope.payload);
  };

  /**
   * Delivers one validated Host subscription event.
   *
   * @param envelope - Event envelope to validate.
   */
  #handleEvent(envelope: MiaixzBridgeEnvelope): void {
    if (
      envelope.method !== "events.message" ||
      !isPlainRecord(envelope.payload) ||
      !hasOnlyKeys(envelope.payload, new Set(["subscriptionId", "type", "payload"])) ||
      typeof envelope.payload.subscriptionId !== "string" ||
      typeof envelope.payload.type !== "string"
    )
      return;
    const registered = this.#listeners.get(envelope.payload.subscriptionId);
    if (registered === undefined || registered.type !== envelope.payload.type) return;
    try {
      registered.listener(envelope.payload.payload);
    } catch {
      // Consumer listener failures cannot corrupt the Bridge transport state.
    }
  }

  /**
   * Sends one correlated request and applies timeout cancellation.
   *
   * @param method - Allow-listed request method.
   * @param payload - Optional request payload.
   * @returns Promise resolving to the raw response payload.
   */
  #request(method: string, payload?: unknown): Promise<unknown> {
    this.#assertActive();
    const messageId = createMessageId();
    return new Promise<unknown>((resolve, reject) => {
      const timer = setTimeout(() => {
        const pending = this.#pending.get(messageId);
        if (pending === undefined) return;
        this.#pending.delete(messageId);
        this.#sendCancel(messageId, pending);
        reject(bridgeError("BRIDGE_TIMEOUT"));
      }, this.#timeoutMs);
      const pending: PendingRequest = {
        method,
        resolve,
        reject,
        timer,
        cancelSent: false,
      };
      this.#pending.set(messageId, pending);
      try {
        this.#post(createEnvelope(this.#moduleId, "request", method, messageId, payload));
      } catch {
        clearTimeout(timer);
        this.#pending.delete(messageId);
        reject(bridgeError("BRIDGE_MESSAGE_INVALID"));
      }
    });
  }

  /**
   * Sends at most one cancellation envelope for a pending request.
   *
   * @param messageId - Request identifier to cancel.
   * @param pending - Pending request state.
   */
  #sendCancel(messageId: string, pending: PendingRequest): void {
    if (pending.cancelSent) return;
    pending.cancelSent = true;
    try {
      this.#post(createEnvelope(this.#moduleId, "cancel", pending.method, messageId));
    } catch {
      // Cancellation is best-effort after the local result is already deterministic.
    }
  }

  /**
   * Posts one envelope to the single validated Host origin.
   *
   * @param envelope - Envelope to send.
   */
  #post(envelope: MiaixzBridgeEnvelope): void {
    this.#targetWindow.postMessage(envelope, this.#targetOrigin);
  }

  /**
   * Rejects calls made after the Child Bridge has been released.
   *
   * @throws MiaixzSdkError When the Bridge is disposed.
   */
  #assertActive(): void {
    if (this.#disposed) throw bridgeError("BRIDGE_DISPOSED");
  }
}

/**
 * Creates the Host side of a validated iframe postMessage Bridge.
 *
 * @param options - Manifest, target, origin, Adapter, and timeout configuration.
 * @returns Host lifecycle whose ready Promise tracks the handshake.
 * @throws MiaixzSdkError When construction parameters or browser capabilities are invalid.
 * @public
 */
export function createMiaixzPostMessageHost(
  options: MiaixzPostMessageHostOptions,
): MiaixzPostMessageHost {
  return new PostMessageHost(options);
}

/**
 * Creates and handshakes the Child side of an iframe postMessage Bridge.
 *
 * @param options - Module identity, target, origin, and timeout configuration.
 * @returns Promise resolving to the connected Host Bridge.
 * @throws MiaixzSdkError When construction, handshake, or browser capabilities are invalid.
 * @public
 */
export function createMiaixzPostMessageChildBridge(
  options: MiaixzPostMessageChildOptions,
): Promise<MiaixzHostBridge> {
  const bridge = new PostMessageChildBridge(options);
  return bridge.connect().catch((error: unknown) => {
    bridge.dispose();
    throw error;
  });
}
