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

/**
 * Defines the domain-neutral event-bus port used by SDK stores.
 */

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
