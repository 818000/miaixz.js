import { MiaixzSdkError } from "../api/errors.js";
import {
  MIAIXZ_MODULE_PROTOCOL_VERSION,
  type MiaixzDirectHostBridgeOptions,
  type MiaixzHostAdapter,
  type MiaixzHostBridge,
  type MiaixzNavigationRequest,
} from "../contracts/index.js";
import { isMiaixzModulePermission } from "../contracts/permission.js";
import { translateMiaixzDefaultMessage } from "../i18n/default-translator.js";
import type { MiaixzMessageCatalog } from "../i18n/index.js";
import type { MiaixzRuntimeContext } from "../types/index.js";

const moduleIdentifierPattern = /^[a-z][a-z0-9-]{1,63}$/;

/**
 * Creates a localized Direct Bridge error without including caller-owned data.
 *
 * @param code - Stable Bridge error code.
 * @param messageKey - Registered internationalization message key.
 * @returns Localized SDK error.
 */
function createBridgeError(
  code:
    | "BRIDGE_CAPABILITY_UNAVAILABLE"
    | "BRIDGE_DISPOSED"
    | "BRIDGE_MESSAGE_INVALID"
    | "BRIDGE_NAVIGATION_STATE_INVALID",
  messageKey:
    | "sdk.error.bridge.capabilityUnavailable"
    | "sdk.error.bridge.disposed"
    | "sdk.error.bridge.messageInvalid"
    | "sdk.error.bridge.navigationStateInvalid",
): MiaixzSdkError {
  return new MiaixzSdkError(translateMiaixzDefaultMessage(messageKey), { code });
}

/**
 * Determines whether a value is a plain record without a custom prototype.
 *
 * @param value - Runtime value to inspect.
 * @returns Whether the value is a plain record.
 */
function isPlainRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

/**
 * Determines whether a record contains only the supplied keys.
 *
 * @param value - Record whose keys should be inspected.
 * @param allowedKeys - Complete set of allowed keys.
 * @returns Whether every enumerable own key is allowed.
 */
function hasOnlyKeys(
  value: Readonly<Record<string, unknown>>,
  allowedKeys: ReadonlySet<string>,
): boolean {
  return Object.keys(value).every((key) => allowedKeys.has(key));
}

/**
 * Validates one module identifier before creating a bridge.
 *
 * @param moduleId - Module identifier to validate.
 * @returns The unchanged valid identifier.
 * @throws MiaixzSdkError When the identifier violates the module grammar.
 */
function parseModuleId(moduleId: string): string {
  if (!moduleIdentifierPattern.test(moduleId)) {
    throw createBridgeError("BRIDGE_MESSAGE_INVALID", "sdk.error.bridge.messageInvalid");
  }
  return moduleId;
}

/**
 * Validates and defensively copies one same-site navigation request.
 *
 * @param request - Navigation request to validate.
 * @returns Frozen request containing a cloned state value.
 * @throws MiaixzSdkError When the request or state is invalid.
 */
function parseNavigationRequest(
  request: Readonly<MiaixzNavigationRequest>,
): MiaixzNavigationRequest {
  if (
    !isPlainRecord(request) ||
    !hasOnlyKeys(request, new Set(["path", "replace", "state"])) ||
    typeof request.path !== "string" ||
    !request.path.startsWith("/") ||
    request.path.startsWith("//") ||
    request.path.includes("\\") ||
    (request.replace !== undefined && typeof request.replace !== "boolean")
  ) {
    throw createBridgeError("BRIDGE_MESSAGE_INVALID", "sdk.error.bridge.messageInvalid");
  }

  let state: unknown;
  if (request.state !== undefined) {
    try {
      state = structuredClone(request.state);
    } catch {
      throw createBridgeError(
        "BRIDGE_NAVIGATION_STATE_INVALID",
        "sdk.error.bridge.navigationStateInvalid",
      );
    }
  }

  return Object.freeze({
    path: request.path,
    ...(request.replace === undefined ? {} : { replace: request.replace }),
    ...(request.state === undefined ? {} : { state }),
  });
}

/**
 * Validates and freezes one non-wildcard module permission list.
 *
 * @param permissions - Permission list to validate.
 * @returns Frozen defensive permission copy.
 * @throws MiaixzSdkError When any permission is malformed.
 */
function parsePermissions(permissions: readonly string[]): readonly string[] {
  if (!Array.isArray(permissions) || !permissions.every(isMiaixzModulePermission)) {
    throw createBridgeError("BRIDGE_MESSAGE_INVALID", "sdk.error.bridge.messageInvalid");
  }
  return Object.freeze([...permissions]);
}

/**
 * Validates one event name against the module bound to the bridge.
 *
 * @param moduleId - Module identifier owning the bridge.
 * @param type - Event type to validate.
 * @returns The unchanged valid event type.
 * @throws MiaixzSdkError When the event is outside the module namespace.
 */
function parseEventType(moduleId: string, type: string): string {
  if (typeof type !== "string") {
    throw createBridgeError("BRIDGE_MESSAGE_INVALID", "sdk.error.bridge.messageInvalid");
  }
  const separator = type.indexOf(":");
  const owner = type.slice(0, separator);
  const eventName = type.slice(separator + 1);
  if (
    separator < 0 ||
    type.indexOf(":", separator + 1) >= 0 ||
    owner !== moduleId ||
    !moduleIdentifierPattern.test(owner) ||
    !moduleIdentifierPattern.test(eventName)
  ) {
    throw createBridgeError("BRIDGE_MESSAGE_INVALID", "sdk.error.bridge.messageInvalid");
  }
  return type;
}

/**
 * Implements the same-runtime Host Bridge with explicit capability injection.
 */
class MiaixzDirectHostBridge implements MiaixzHostBridge {
  /**
   * Micro-frontend protocol version implemented by the bridge.
   */
  readonly protocolVersion = MIAIXZ_MODULE_PROTOCOL_VERSION;

  readonly #moduleId: string;
  readonly #adapter: MiaixzHostAdapter;
  readonly #subscriptions = new Set<() => Promise<void>>();
  #disposed = false;

  /**
   * Creates one module-scoped Direct Bridge.
   *
   * @param options - Validated module identity and injected host capabilities.
   */
  constructor(options: Readonly<MiaixzDirectHostBridgeOptions>) {
    this.#moduleId = parseModuleId(options.moduleId);
    this.#adapter = options.adapter;
  }

  /**
   * Reads the current non-sensitive host context.
   *
   * @returns Immutable runtime context from the host Adapter.
   */
  getContext(): Promise<Readonly<MiaixzRuntimeContext>> {
    return Promise.resolve().then(() => {
      this.#assertActive();
      return this.#requireCapability("getContext")();
    });
  }

  /**
   * Sends a validated same-site navigation request to the host.
   *
   * @param request - Navigation request to validate and clone.
   * @returns Promise settled after the host handles navigation.
   */
  navigate(request: Readonly<MiaixzNavigationRequest>): Promise<void> {
    return Promise.resolve().then(() => {
      this.#assertActive();
      const parsed = parseNavigationRequest(request);
      return this.#requireCapability("navigate")(parsed);
    });
  }

  /**
   * Checks whether all validated permissions are available.
   *
   * @param permissions - Non-wildcard permissions to evaluate.
   * @returns Whether every requested permission is available.
   */
  hasPermissions(permissions: readonly string[]): Promise<boolean> {
    return Promise.resolve().then(() => {
      this.#assertActive();
      const parsed = parsePermissions(permissions);
      return this.#requireCapability("hasPermissions")(parsed);
    });
  }

  /**
   * Registers messages owned by the module bound to the bridge.
   *
   * @param namespace - Namespace that must equal the module identifier.
   * @param catalog - Project message catalog to register.
   * @returns Promise settled after the host registers the catalog.
   */
  registerMessages(namespace: string, catalog: MiaixzMessageCatalog): Promise<void> {
    return Promise.resolve().then(() => {
      this.#assertActive();
      if (namespace !== this.#moduleId) {
        throw createBridgeError("BRIDGE_MESSAGE_INVALID", "sdk.error.bridge.messageInvalid");
      }
      return this.#requireCapability("registerMessages")(namespace, catalog);
    });
  }

  /**
   * Emits one event owned by the module bound to the bridge.
   *
   * @typeParam T - Event payload type.
   * @param type - Module-scoped event name.
   * @param payload - Event payload delivered to the host.
   * @returns Promise settled after event delivery.
   */
  emit<T = unknown>(type: string, payload: T): Promise<void> {
    return Promise.resolve().then(() => {
      this.#assertActive();
      const parsedType = parseEventType(this.#moduleId, type);
      return this.#requireCapability("emit")<T>(parsedType, payload);
    });
  }

  /**
   * Subscribes to one event owned by the module bound to the bridge.
   *
   * @typeParam T - Event payload type.
   * @param type - Module-scoped event name.
   * @param listener - Event listener invoked by the host.
   * @returns Idempotent asynchronous unsubscribe function.
   */
  subscribe<T = unknown>(
    type: string,
    listener: (payload: T) => void,
  ): Promise<() => Promise<void>> {
    return Promise.resolve().then(async () => {
      this.#assertActive();
      const parsedType = parseEventType(this.#moduleId, type);
      if (typeof listener !== "function") {
        throw createBridgeError("BRIDGE_MESSAGE_INVALID", "sdk.error.bridge.messageInvalid");
      }
      const unsubscribe = await this.#requireCapability("subscribe")<T>(parsedType, listener);
      if (typeof unsubscribe !== "function") {
        throw createBridgeError("BRIDGE_MESSAGE_INVALID", "sdk.error.bridge.messageInvalid");
      }

      let cancelled = false;
      const cancel = async (): Promise<void> => {
        if (cancelled) return;
        cancelled = true;
        this.#subscriptions.delete(cancel);
        await Promise.resolve().then(unsubscribe);
      };

      if (this.#disposed) {
        try {
          await cancel();
        } catch {
          // Cleanup failures cannot replace the deterministic disposed result.
        }
        throw createBridgeError("BRIDGE_DISPOSED", "sdk.error.bridge.disposed");
      }
      this.#subscriptions.add(cancel);
      return cancel;
    });
  }

  /**
   * Releases tracked subscriptions and prevents further Adapter calls.
   */
  dispose(): void {
    if (this.#disposed) return;
    this.#disposed = true;
    const subscriptions = [...this.#subscriptions];
    this.#subscriptions.clear();
    for (const unsubscribe of subscriptions) {
      void unsubscribe().catch(() => undefined);
    }
  }

  /**
   * Rejects calls made after the bridge has been released.
   *
   * @throws MiaixzSdkError When the bridge has already been disposed.
   */
  #assertActive(): void {
    if (this.#disposed) {
      throw createBridgeError("BRIDGE_DISPOSED", "sdk.error.bridge.disposed");
    }
  }

  /**
   * Returns one injected Adapter capability.
   *
   * @typeParam Name - Adapter capability name.
   * @param name - Capability to resolve.
   * @returns Injected Adapter capability.
   * @throws MiaixzSdkError When the host omitted the requested capability.
   */
  #requireCapability<Name extends keyof MiaixzHostAdapter>(
    name: Name,
  ): NonNullable<MiaixzHostAdapter[Name]> {
    const capability = this.#adapter[name];
    if (capability === undefined) {
      throw createBridgeError(
        "BRIDGE_CAPABILITY_UNAVAILABLE",
        "sdk.error.bridge.capabilityUnavailable",
      );
    }
    return capability as NonNullable<MiaixzHostAdapter[Name]>;
  }
}

/**
 * Creates a module-scoped same-runtime Host Bridge.
 *
 * @param options - Module identity and explicitly injected host capabilities.
 * @returns Host Bridge that delegates validated calls to the Adapter.
 * @throws MiaixzSdkError When the module identifier is invalid.
 * @public
 */
export function createMiaixzDirectHostBridge(
  options: Readonly<MiaixzDirectHostBridgeOptions>,
): MiaixzHostBridge {
  return new MiaixzDirectHostBridge(options);
}
