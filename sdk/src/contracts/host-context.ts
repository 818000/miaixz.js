import type { MiaixzMessageCatalog } from "../i18n/index.js";
import type { MiaixzRuntimeContext } from "../types/index.js";

/**
 * Describes a navigation request issued by a remote module through its host bridge.
 *
 * @public
 */
export interface MiaixzNavigationRequest {
  /**
   * Same-site absolute path requested by the module.
   */
  readonly path: string;

  /**
   * Whether the host should replace the active history entry.
   */
  readonly replace?: boolean;

  /**
   * Optional structured-clone-compatible navigation state.
   */
  readonly state?: unknown;
}

/**
 * Defines the capabilities a host exposes to an integrated or iframe module.
 *
 * This task freezes the public shape only; runtime implementations are supplied by Host Bridge
 * tasks and never expose authentication credentials.
 *
 * @public
 */
export interface MiaixzHostBridge {
  /**
   * Micro-frontend protocol version implemented by the bridge.
   */
  readonly protocolVersion: "1.0.0";

  /**
   * Reads the current non-sensitive host runtime context.
   *
   * @returns Immutable runtime context from the host.
   */
  getContext(): Promise<Readonly<MiaixzRuntimeContext>>;

  /**
   * Requests same-site navigation from the host.
   *
   * @param request - Validated navigation request.
   * @returns Promise resolved after the host handles navigation.
   */
  navigate(request: Readonly<MiaixzNavigationRequest>): Promise<void>;

  /**
   * Checks whether all requested permissions are available.
   *
   * @param permissions - Permission names to evaluate.
   * @returns Whether every requested permission is available.
   */
  hasPermissions(permissions: readonly string[]): Promise<boolean>;

  /**
   * Registers a module-owned internationalization catalog with the host.
   *
   * @param namespace - Module message namespace.
   * @param catalog - Localized messages owned by the module.
   * @returns Promise resolved after registration.
   */
  registerMessages(namespace: string, catalog: MiaixzMessageCatalog): Promise<void>;

  /**
   * Emits one module-scoped event through the host.
   *
   * @typeParam T - Event payload type.
   * @param type - Module-scoped event name.
   * @param payload - Structured-clone-compatible event payload.
   * @returns Promise resolved after event delivery.
   */
  emit<T = unknown>(type: string, payload: T): Promise<void>;

  /**
   * Subscribes to one module-scoped host event.
   *
   * @typeParam T - Event payload type.
   * @param type - Module-scoped event name.
   * @param listener - Callback that receives event payloads.
   * @returns Asynchronous unsubscribe function.
   */
  subscribe<T = unknown>(
    type: string,
    listener: (payload: T) => void,
  ): Promise<() => Promise<void>>;

  /**
   * Releases resources and pending work owned by the bridge.
   */
  dispose(): void;
}

/**
 * Supplies the optional capabilities exposed by one Miaixz host.
 *
 * @public
 */
export interface MiaixzHostAdapter {
  /**
   * Reads the current non-sensitive host runtime context when available.
   */
  readonly getContext?: MiaixzHostBridge["getContext"];

  /**
   * Handles validated same-site navigation requests when available.
   */
  readonly navigate?: MiaixzHostBridge["navigate"];

  /**
   * Evaluates validated module permissions when available.
   */
  readonly hasPermissions?: MiaixzHostBridge["hasPermissions"];

  /**
   * Registers module-owned internationalization resources when available.
   */
  readonly registerMessages?: MiaixzHostBridge["registerMessages"];

  /**
   * Emits module-scoped events when available.
   */
  readonly emit?: MiaixzHostBridge["emit"];

  /**
   * Subscribes to module-scoped events when available.
   */
  readonly subscribe?: MiaixzHostBridge["subscribe"];
}

/**
 * Configures a same-runtime bridge for one identified module.
 *
 * @public
 */
export interface MiaixzDirectHostBridgeOptions {
  /**
   * Identifies the module allowed to use the bridge.
   */
  readonly moduleId: string;

  /**
   * Supplies the host capabilities exposed to the module.
   */
  readonly adapter: MiaixzHostAdapter;
}
