import { MiaixzSdkError } from "../api/errors.js";
import { isMiaixzAppearanceSettings } from "../appearance/index.js";
import { isMiaixzSdkConfig } from "../config/index.js";
import { isMiaixzRuntimeContext } from "../context/index.js";
import { miaixzDefaultI18n, type MiaixzLocale } from "../i18n/index.js";
import type {
  MiaixzAppearancePayload,
  MiaixzRuntimeContext,
  MiaixzSdkConfig,
} from "../types/index.js";

/**
 * Validates an untrusted event payload before it crosses a browser-context boundary.
 *
 * @public
 */
export type MiaixzEventValidator = (payload: unknown) => boolean;

/**
 * Describes the only authentication state that may cross an SDK event channel.
 *
 * @public
 */
export interface MiaixzAuthStatusEvent {
  /**
   * Reports whether credentials exist without exposing a session or token.
   */
  readonly status: "authenticated" | "anonymous";
}

/**
 * Describes a locale change shared between same-origin application instances.
 *
 * @public
 */
export interface MiaixzLocaleChangedEvent {
  /**
   * Contains the canonical or otherwise valid BCP 47 locale to activate.
   */
  readonly locale: MiaixzLocale;
}

/**
 * Maps built-in SDK event names to their payload types.
 *
 * @public
 */
export interface MiaixzSdkEventMap {
  /**
   * Contains a non-sensitive authentication invalidation signal.
   */
  readonly "auth:changed": Readonly<MiaixzAuthStatusEvent>;

  /**
   * Contains the runtime-context snapshot after it changes.
   */
  readonly "context:changed": Readonly<MiaixzRuntimeContext>;

  /**
   * Contains the versioned appearance snapshot after it changes.
   */
  readonly "appearance:changed": Readonly<MiaixzAppearancePayload>;

  /**
   * Contains the active locale after it changes.
   */
  readonly "locale:changed": Readonly<MiaixzLocaleChangedEvent>;

  /**
   * Contains the SDK configuration snapshot after it changes.
   */
  readonly "config:changed": Readonly<MiaixzSdkConfig>;
}

/**
 * Configures local and optional same-origin cross-tab event delivery.
 *
 * @public
 */
export interface MiaixzEventBusOptions {
  /**
   * Selects a validated BroadcastChannel name, or disables cross-tab delivery.
   *
   * @defaultValue false
   */
  readonly channelName?: string | false;

  /**
   * Supplies runtime validators for application-defined event names.
   */
  readonly validators?: Readonly<Record<string, MiaixzEventValidator>>;

  /**
   * Creates a BroadcastChannel for tests or compatible custom browser runtimes.
   */
  readonly broadcastChannelFactory?: (name: string) => BroadcastChannel;
}

/**
 * Defines the only envelope accepted over a Miaixz BroadcastChannel.
 *
 * @public
 */
export interface MiaixzEventEnvelope {
  /**
   * Identifies the frozen event-envelope schema.
   */
  readonly version: 1;

  /**
   * Uniquely identifies one broadcast operation for deduplication.
   */
  readonly eventId: string;

  /**
   * Identifies the event-bus instance that originated the message.
   */
  readonly sourceId: string;

  /**
   * Names the typed event represented by the payload.
   */
  readonly type: string;

  /**
   * Contains untrusted data that must pass the registered runtime validator.
   */
  readonly payload: unknown;
}

/**
 * Configures one event publication.
 *
 * @public
 */
export interface MiaixzEventEmitOptions {
  /**
   * Indicates whether a locally dispatched event may also cross the configured channel.
   *
   * @defaultValue true
   */
  readonly broadcast?: boolean;
}

/**
 * Extracts string event names from an event map.
 *
 * @public
 */
export type MiaixzEventName<Events extends object> = Extract<keyof Events, string>;

/**
 * Receives a typed event payload.
 *
 * @public
 */
export type MiaixzEventListener<T> = (payload: T) => void;

const miaixzEventChannelPattern = /^miaixz:v1:[a-z][a-z0-9-]{1,63}:events$/;
const miaixzUuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const miaixzEventEnvelopeKeys = new Set(["version", "eventId", "sourceId", "type", "payload"]);
const miaixzRuntimeContextKeys = new Set([
  "userId",
  "tenantId",
  "organizationId",
  "departmentId",
  "spaceId",
  "locale",
  "timezone",
  "traceId",
]);
const miaixzSdkConfigKeys = new Set([
  "apiBaseUrl",
  "environment",
  "release",
  "services",
  "features",
  "appearance",
  "requestTimeoutMs",
]);
const miaixzSensitiveEventKeys = new Set([
  "authorization",
  "authorizationheader",
  "cookie",
  "cookies",
  "session",
]);
const miaixzEventDeduplicationLimit = 1_000;
const miaixzEventDeduplicationTtlMs = 5 * 60 * 1_000;

/**
 * Determines whether a property name conventionally contains credential material.
 *
 * @param key - Property or map key to normalize.
 * @returns Whether the key names a token, cookie, authorization value, or full session.
 */
function isSensitiveEventKey(key: string): boolean {
  const normalizedKey = key.replace(/[-_]/g, "").toLowerCase();
  return (
    miaixzSensitiveEventKeys.has(normalizedKey) ||
    normalizedKey === "token" ||
    normalizedKey.endsWith("token")
  );
}

/**
 * Determines whether a value is a plain data object without accessors.
 *
 * @param value - Runtime value to inspect.
 * @returns Whether the value contains only enumerable own data properties.
 */
function isPlainEventObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return false;
  if (Object.getOwnPropertySymbols(value).length > 0) return false;
  const descriptors = Object.getOwnPropertyDescriptors(value);
  return Object.values(descriptors).every(
    (descriptor) => descriptor.enumerable === true && "value" in descriptor,
  );
}

/**
 * Determines whether a plain object contains exactly the allowed enumerable keys.
 *
 * @param value - Plain object to inspect.
 * @param allowedKeys - Complete allowed-key set.
 * @returns Whether every key is allowed and the key counts match.
 */
function hasExactEventKeys(
  value: Record<string, unknown>,
  allowedKeys: ReadonlySet<string>,
): boolean {
  const keys = Object.keys(value);
  return keys.length === allowedKeys.size && keys.every((key) => allowedKeys.has(key));
}

/**
 * Determines whether an event payload contains a credential-shaped field.
 *
 * The traversal never invokes accessors and treats unsupported object shapes as unsafe.
 *
 * @param value - Cloned payload to inspect.
 * @param visited - Objects already inspected while following recursive references.
 * @returns Whether the payload contains a token, cookie, authorization, or session field.
 */
function containsSensitiveEventData(value: unknown, visited = new WeakSet<object>()): boolean {
  if (value === null || typeof value !== "object") return false;
  if (visited.has(value)) return false;
  visited.add(value);
  if (Array.isArray(value)) {
    return value.some((entry) => containsSensitiveEventData(entry, visited));
  }
  if (value instanceof Map) {
    for (const [key, entry] of value) {
      if (typeof key === "string" && isSensitiveEventKey(key)) return true;
      if (containsSensitiveEventData(key, visited) || containsSensitiveEventData(entry, visited)) {
        return true;
      }
    }
    return false;
  }
  if (value instanceof Set) {
    for (const entry of value) {
      if (containsSensitiveEventData(entry, visited)) return true;
    }
    return false;
  }
  if (value instanceof ArrayBuffer || ArrayBuffer.isView(value) || value instanceof Date) {
    return false;
  }
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key === "string" && isSensitiveEventKey(key)) return true;
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor === undefined || !("value" in descriptor)) return true;
    if (containsSensitiveEventData(descriptor.value, visited)) return true;
  }
  return false;
}

/**
 * Validates the built-in authentication status payload.
 *
 * @param payload - Untrusted event payload.
 * @returns Whether the payload contains exactly one supported status field.
 */
function isMiaixzAuthStatusEvent(payload: unknown): payload is MiaixzAuthStatusEvent {
  return (
    isPlainEventObject(payload) &&
    hasExactEventKeys(payload, new Set(["status"])) &&
    (payload.status === "authenticated" || payload.status === "anonymous")
  );
}

/**
 * Validates the built-in runtime-context payload.
 *
 * @param payload - Untrusted event payload.
 * @returns Whether the payload contains only supported string-valued Context fields.
 */
function isMiaixzContextEvent(payload: unknown): payload is MiaixzRuntimeContext {
  return (
    isPlainEventObject(payload) &&
    Object.keys(payload).every((key) => miaixzRuntimeContextKeys.has(key)) &&
    isMiaixzRuntimeContext(payload)
  );
}

/**
 * Validates the built-in appearance payload and its nested settings.
 *
 * @param payload - Untrusted event payload.
 * @returns Whether the payload uses schema version two and valid appearance settings.
 */
function isMiaixzAppearanceEvent(payload: unknown): payload is MiaixzAppearancePayload {
  return (
    isPlainEventObject(payload) &&
    hasExactEventKeys(payload, new Set(["schemaVersion", "value"])) &&
    payload.schemaVersion === 2 &&
    isMiaixzAppearanceSettings(payload.value)
  );
}

/**
 * Validates the built-in locale-change payload.
 *
 * @param payload - Untrusted event payload.
 * @returns Whether the payload contains exactly one valid BCP 47 locale.
 */
function isMiaixzLocaleEvent(payload: unknown): payload is MiaixzLocaleChangedEvent {
  if (
    !isPlainEventObject(payload) ||
    !hasExactEventKeys(payload, new Set(["locale"])) ||
    typeof payload.locale !== "string"
  ) {
    return false;
  }
  try {
    return Intl.getCanonicalLocales(payload.locale).length === 1;
  } catch {
    return false;
  }
}

/**
 * Validates the built-in SDK configuration payload.
 *
 * @param payload - Untrusted event payload.
 * @returns Whether the payload contains only supported configuration fields and values.
 */
function isMiaixzConfigEvent(payload: unknown): payload is MiaixzSdkConfig {
  return (
    isPlainEventObject(payload) &&
    Object.keys(payload).every((key) => miaixzSdkConfigKeys.has(key)) &&
    isMiaixzSdkConfig(payload)
  );
}

const miaixzBuiltinEventValidators: Readonly<Record<string, MiaixzEventValidator>> = Object.freeze({
  "auth:changed": isMiaixzAuthStatusEvent,
  "context:changed": isMiaixzContextEvent,
  "appearance:changed": isMiaixzAppearanceEvent,
  "locale:changed": isMiaixzLocaleEvent,
  "config:changed": isMiaixzConfigEvent,
});

/**
 * Creates a localized event error without including rejected payload data.
 *
 * @param code - Stable event error code.
 * @param messageKey - Registered internationalization message key.
 * @returns Localized SDK event error.
 */
function createMiaixzEventError(
  code:
    | "EVENT_CHANNEL_INVALID"
    | "EVENT_VALIDATOR_MISSING"
    | "EVENT_PAYLOAD_NOT_CLONEABLE"
    | "EVENT_CRYPTO_UNAVAILABLE",
  messageKey:
    | "sdk.error.event.channelInvalid"
    | "sdk.error.event.validatorMissing"
    | "sdk.error.event.payloadNotCloneable"
    | "sdk.error.event.cryptoUnavailable",
): MiaixzSdkError {
  return new MiaixzSdkError(miaixzDefaultI18n.t(messageKey), { code });
}

/**
 * Creates a secure UUID for event sources and messages.
 *
 * @returns A cryptographically secure UUID.
 * @throws MiaixzSdkError When the runtime cannot generate secure UUIDs.
 */
function createMiaixzEventId(): string {
  if (typeof globalThis.crypto?.randomUUID !== "function") {
    throw createMiaixzEventError("EVENT_CRYPTO_UNAVAILABLE", "sdk.error.event.cryptoUnavailable");
  }
  return globalThis.crypto.randomUUID();
}

/**
 * Validates an untrusted BroadcastChannel envelope without executing accessors.
 *
 * @param value - Broadcast message data to inspect.
 * @returns Whether the value is a complete version-one event envelope.
 */
function isMiaixzEventEnvelope(value: unknown): value is MiaixzEventEnvelope {
  return (
    isPlainEventObject(value) &&
    hasExactEventKeys(value, miaixzEventEnvelopeKeys) &&
    value.version === 1 &&
    typeof value.eventId === "string" &&
    miaixzUuidPattern.test(value.eventId) &&
    typeof value.sourceId === "string" &&
    miaixzUuidPattern.test(value.sourceId) &&
    typeof value.type === "string" &&
    value.type.length > 0
  );
}

/**
 * Produces a structured-cloned event payload before external delivery.
 *
 * @param payload - Payload to clone.
 * @returns Detached payload clone safe to place in an event envelope.
 * @throws MiaixzSdkError When structured cloning is unavailable or fails.
 */
function cloneMiaixzEventPayload(payload: unknown): unknown {
  if (typeof globalThis.structuredClone !== "function") {
    throw createMiaixzEventError(
      "EVENT_PAYLOAD_NOT_CLONEABLE",
      "sdk.error.event.payloadNotCloneable",
    );
  }
  try {
    return globalThis.structuredClone(payload);
  } catch {
    throw createMiaixzEventError(
      "EVENT_PAYLOAD_NOT_CLONEABLE",
      "sdk.error.event.payloadNotCloneable",
    );
  }
}

/**
 * Applies a registered payload validator and the credential-exposure guard safely.
 *
 * @param validator - Event-specific runtime validator.
 * @param payload - Cloned or externally received payload.
 * @returns Whether the payload is valid and free of credential-shaped fields.
 */
function isValidMiaixzEventPayload(validator: MiaixzEventValidator, payload: unknown): boolean {
  try {
    return !containsSensitiveEventData(payload) && validator(payload);
  } catch {
    return false;
  }
}

/**
 * Typed local and optional same-origin cross-tab event bus.
 *
 * @typeParam Events - Event-name map whose values define payload types.
 * @public
 */
export class MiaixzEventBus<Events extends object = MiaixzSdkEventMap> {
  readonly #listeners = new Map<string, Set<MiaixzEventListener<unknown>>>();
  readonly #validators: Readonly<Record<string, MiaixzEventValidator>>;
  readonly #channel: BroadcastChannel | undefined;
  readonly #sourceId: string | undefined;
  readonly #receivedEventIds = new Map<string, number>();
  readonly #messageListener: ((event: MessageEvent<unknown>) => void) | undefined;
  #closed = false;

  /**
   * Creates a local-first event bus and an optional validated BroadcastChannel.
   *
   * @param options - Channel factory and application-defined runtime validators.
   * @throws MiaixzSdkError When an explicit channel name or secure UUID capability is invalid.
   */
  constructor(options: MiaixzEventBusOptions = {}) {
    this.#validators = Object.freeze({
      ...options.validators,
      ...miaixzBuiltinEventValidators,
    });
    const channelName = options.channelName ?? false;
    if (channelName === false) {
      this.#channel = undefined;
      this.#sourceId = undefined;
      this.#messageListener = undefined;
      return;
    }
    if (!miaixzEventChannelPattern.test(channelName)) {
      throw createMiaixzEventError("EVENT_CHANNEL_INVALID", "sdk.error.event.channelInvalid");
    }
    const hasChannelFactory = typeof options.broadcastChannelFactory === "function";
    const hasNativeChannel = typeof globalThis.BroadcastChannel === "function";
    if (!hasChannelFactory && !hasNativeChannel) {
      this.#channel = undefined;
      this.#sourceId = undefined;
      this.#messageListener = undefined;
      return;
    }
    const sourceId = createMiaixzEventId();
    const channel = hasChannelFactory
      ? options.broadcastChannelFactory?.(channelName)
      : new globalThis.BroadcastChannel(channelName);
    if (channel === undefined) {
      this.#channel = undefined;
      this.#sourceId = undefined;
      this.#messageListener = undefined;
      return;
    }
    this.#channel = channel;
    this.#sourceId = sourceId;
    this.#messageListener = (event: MessageEvent<unknown>): void => {
      this.#receive(event.data);
    };
    this.#channel.addEventListener("message", this.#messageListener);
  }

  /**
   * Registers a typed listener and returns its unsubscribe function.
   *
   * @param type - Event name to observe.
   * @param listener - Callback invoked with the typed event payload.
   * @returns Function that unregisters the listener, or a no-op after closure.
   */
  on<Name extends MiaixzEventName<Events>>(
    type: Name,
    listener: MiaixzEventListener<Events[Name]>,
  ): () => void {
    if (this.#closed) return (): void => undefined;
    const listeners = this.#listeners.get(type) ?? new Set<MiaixzEventListener<unknown>>();
    listeners.add(listener as MiaixzEventListener<unknown>);
    this.#listeners.set(type, listeners);
    return (): void => {
      listeners.delete(listener as MiaixzEventListener<unknown>);
      if (listeners.size === 0) this.#listeners.delete(type);
    };
  }

  /**
   * Registers a typed listener that is removed after its first event.
   *
   * @param type - Event name to observe once.
   * @param listener - Callback invoked with the typed event payload.
   * @returns Function that unregisters the listener before delivery.
   */
  once<Name extends MiaixzEventName<Events>>(
    type: Name,
    listener: MiaixzEventListener<Events[Name]>,
  ): () => void {
    if (this.#closed) return (): void => undefined;
    const unsubscribe = this.on(type, (payload) => {
      unsubscribe();
      listener(payload);
    });
    return unsubscribe;
  }

  /**
   * Publishes an event synchronously to local listeners before optional cross-tab delivery.
   *
   * @param type - Event name to publish.
   * @param payload - Typed event payload.
   * @param options - Optional cross-tab publication behavior.
   * @throws MiaixzSdkError When the bus is closed, a required validator is missing, cloning fails, or secure UUIDs are unavailable.
   */
  emit<Name extends MiaixzEventName<Events>>(
    type: Name,
    payload: Events[Name],
    options: Readonly<MiaixzEventEmitOptions> = {},
  ): void {
    if (this.#closed) {
      throw createMiaixzEventError("EVENT_CHANNEL_INVALID", "sdk.error.event.channelInvalid");
    }
    this.#dispatch(type, payload);
    if (
      options.broadcast === false ||
      this.#channel === undefined ||
      this.#sourceId === undefined
    ) {
      return;
    }
    const validator = Object.hasOwn(this.#validators, type) ? this.#validators[type] : undefined;
    if (validator === undefined) {
      if (options.broadcast === true) {
        throw createMiaixzEventError("EVENT_VALIDATOR_MISSING", "sdk.error.event.validatorMissing");
      }
      return;
    }
    const clonedPayload = cloneMiaixzEventPayload(payload);
    if (!isValidMiaixzEventPayload(validator, clonedPayload)) return;
    this.#channel.postMessage({
      version: 1,
      eventId: createMiaixzEventId(),
      sourceId: this.#sourceId,
      type,
      payload: clonedPayload,
    } satisfies MiaixzEventEnvelope);
  }

  /**
   * Removes listeners for one event type or all event types.
   *
   * @param type - Optional event name whose listeners should be removed.
   */
  clear(type?: MiaixzEventName<Events>): void {
    if (type === undefined) this.#listeners.clear();
    else this.#listeners.delete(type);
  }

  /**
   * Removes listeners and deduplication state, then closes the underlying channel once.
   */
  close(): void {
    if (this.#closed) return;
    this.#closed = true;
    this.clear();
    this.#receivedEventIds.clear();
    if (this.#channel && this.#messageListener) {
      this.#channel.removeEventListener("message", this.#messageListener);
    }
    this.#channel?.close();
  }

  /**
   * Delivers one event to current local listeners in registration order.
   *
   * @param type - Event name to dispatch.
   * @param payload - Event payload to deliver.
   */
  #dispatch(type: string, payload: unknown): void {
    for (const listener of this.#listeners.get(type) ?? []) {
      try {
        listener(payload);
      } catch {
        // One event observer cannot prevent delivery to later observers.
      }
    }
  }

  /**
   * Validates, deduplicates, and dispatches one untrusted channel message.
   *
   * @param value - Message data delivered by BroadcastChannel.
   */
  #receive(value: unknown): void {
    if (this.#closed || !isMiaixzEventEnvelope(value) || value.sourceId === this.#sourceId) return;
    this.#pruneReceivedEventIds(Date.now());
    if (this.#receivedEventIds.has(value.eventId)) return;
    const validator = Object.hasOwn(this.#validators, value.type)
      ? this.#validators[value.type]
      : undefined;
    if (validator === undefined) return;
    if (!isValidMiaixzEventPayload(validator, value.payload)) return;
    this.#receivedEventIds.set(value.eventId, Date.now());
    while (this.#receivedEventIds.size > miaixzEventDeduplicationLimit) {
      const oldest = this.#receivedEventIds.keys().next().value as string | undefined;
      if (oldest === undefined) break;
      this.#receivedEventIds.delete(oldest);
    }
    this.#dispatch(value.type, value.payload);
  }

  /**
   * Removes received event identifiers whose fixed five-minute TTL has elapsed.
   *
   * @param now - Current Unix time in milliseconds.
   */
  #pruneReceivedEventIds(now: number): void {
    for (const [eventId, receivedAt] of this.#receivedEventIds) {
      if (now - receivedAt < miaixzEventDeduplicationTtlMs) continue;
      this.#receivedEventIds.delete(eventId);
    }
  }
}

/**
 * Creates a typed local-first event bus with optional same-origin cross-tab delivery.
 *
 * @typeParam Events - Event-name map whose values define payload types.
 * @param options - Optional channel and runtime-validator configuration.
 * @returns Configured typed event bus.
 * @public
 */
export function createMiaixzEventBus<Events extends object = MiaixzSdkEventMap>(
  options?: MiaixzEventBusOptions,
): MiaixzEventBus<Events> {
  return new MiaixzEventBus<Events>(options);
}
