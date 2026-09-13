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
