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

import type { MiaixzLocale } from "../i18n/i18n.js";
import type { MiaixzAppearancePayload } from "../types/appearance.js";
import type { MiaixzRuntimeContext } from "../types/context.js";
import type { MiaixzSdkConfig } from "../types/config.js";

/**
 * Validates an untrusted event payload before it crosses a browser-context boundary.
 */
export type MiaixzEventValidator = (payload: unknown) => boolean;

/**
 * Describes the only authentication state that may cross an SDK event channel.
 */
export interface MiaixzAuthStatusEvent {
  /**
   * Reports whether credentials exist without exposing a session or token.
   */
  readonly status: "authenticated" | "anonymous";
}

/**
 * Describes a locale change shared between same-origin application instances.
 */
export interface MiaixzLocaleChangedEvent {
  /**
   * Contains the canonical or otherwise valid BCP 47 locale to activate.
   */
  readonly locale: MiaixzLocale;
}

/**
 * Maps built-in SDK event names to their payload types.
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
 */
export interface MiaixzEventBusOptions {
  /**
   * Selects a validated BroadcastChannel name, or disables cross-tab delivery.
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
 */
export interface MiaixzEventEmitOptions {
  /**
   * Indicates whether a locally dispatched event may also cross the configured channel.
   */
  readonly broadcast?: boolean;
}

/**
 * Extracts string event names from an event map.
 */
export type MiaixzEventName<Events extends object> = Extract<keyof Events, string>;

/**
 * Receives a typed event payload.
 */
export type MiaixzEventListener<T> = (payload: T) => void;

/**
 * Defines the minimal event-bus port required by SDK domain stores.
 *
 * @typeParam Events - Event-name map whose values define payload types.
 * @internal
 */
export interface MiaixzEventBusPort<Events extends object> {
  /**
   * Registers a typed event listener.
   */
  on<Name extends MiaixzEventName<Events>>(
    type: Name,
    listener: MiaixzEventListener<Events[Name]>,
  ): () => void;
  /**
   * Publishes a typed event.
   */
  emit<Name extends MiaixzEventName<Events>>(
    type: Name,
    payload: Events[Name],
    options?: Readonly<MiaixzEventEmitOptions>,
  ): void;
}
