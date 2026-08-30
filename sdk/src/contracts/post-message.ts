import type { MiaixzHostAdapter, MiaixzHostBridge } from "./host-context.js";
import type { MiaixzModuleManifest } from "./module-manifest.js";

/**
 * Describes one validated cross-origin Bridge message.
 *
 * @public
 */
export interface MiaixzBridgeEnvelope {
  /**
   * Identifies the Miaixz Bridge transport.
   */
  readonly channel: "miaixz.bridge";

  /**
   * Identifies the Bridge protocol version.
   */
  readonly protocolVersion: "1.0.0";

  /**
   * Correlates requests, responses, events, and cancellation messages.
   */
  readonly messageId: string;

  /**
   * Identifies the module owning the connection.
   */
  readonly moduleId: string;

  /**
   * Selects the message state-machine branch.
   */
  readonly kind: "request" | "response" | "event" | "cancel";

  /**
   * Identifies the allow-listed Bridge operation.
   */
  readonly method: string;

  /**
   * Contains the validated method payload when present.
   */
  readonly payload?: unknown;

  /**
   * Contains a safe remote SDK error when the request failed.
   */
  readonly error?: Readonly<{
    /**
     * Stable SDK error code.
     */
    code: string;

    /**
     * Registered internationalization message key.
     */
    messageKey: string;

    /**
     * Optional already-redacted diagnostic details.
     */
    details?: unknown;
  }>;
}

/**
 * Configures the Host side of one iframe postMessage Bridge.
 *
 * @public
 */
export interface MiaixzPostMessageHostOptions {
  /**
   * Supplies the validated iframe module manifest.
   */
  readonly manifest: Readonly<MiaixzModuleManifest>;

  /**
   * Supplies the exact iframe content Window receiving Host messages.
   */
  readonly targetWindow: Window;

  /**
   * Supplies the single allowed iframe origin.
   */
  readonly targetOrigin: string;

  /**
   * Supplies the Host capabilities exposed to the iframe.
   */
  readonly adapter: MiaixzHostAdapter;

  /**
   * Overrides the ten-second request and handshake timeout.
   */
  readonly timeoutMs?: number;
}

/**
 * Represents the lifecycle of one Host-side postMessage connection.
 *
 * @public
 */
export interface MiaixzPostMessageHost {
  /**
   * Resolves after an accepted handshake or rejects on startup failure.
   */
  readonly ready: Promise<void>;

  /**
   * Releases the Host listener, subscriptions, and pending work.
   */
  dispose(): void;
}

/**
 * Configures the Child side of one iframe postMessage Bridge.
 *
 * @public
 */
export interface MiaixzPostMessageChildOptions {
  /**
   * Identifies the iframe module opening the connection.
   */
  readonly moduleId: string;

  /**
   * Identifies the complete semantic version of the iframe module.
   */
  readonly moduleVersion: string;

  /**
   * Supplies the exact parent Window receiving Child messages.
   */
  readonly targetWindow: Window;

  /**
   * Supplies the single allowed parent origin.
   */
  readonly targetOrigin: string;

  /**
   * Overrides the ten-second request and handshake timeout.
   */
  readonly timeoutMs?: number;
}
