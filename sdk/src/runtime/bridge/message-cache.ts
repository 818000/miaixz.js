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

import type { MiaixzBridgeEnvelope } from "../contracts/post-message.js";
import type { HostRequestState } from "./pending-requests.js";

/**

 * Cached state for one accepted incoming message.

 */
export interface CachedIncomingMessage {
  /**
   * Time at which the identifier was accepted.
   */
  readonly timestamp: number;
  /**
   * Completed response available for replay.
   */
  response?: MiaixzBridgeEnvelope;
  /**
   * In-flight Host request state.
   */
  request?: HostRequestState;
}

/**
 * Removes expired and excess incoming identifiers.
 *
 * @param cache - Incoming message cache.
 * @param now - Current epoch time.
 */
function compactCache(cache: Map<string, CachedIncomingMessage>, now = Date.now()): void {
  const maximumAgeMs = 5 * 60 * 1_000;
  const maximumEntries = 1_000;
  for (const [messageId, entry] of cache) {
    if (now - entry.timestamp > maximumAgeMs) cache.delete(messageId);
  }
  while (cache.size > maximumEntries) {
    const oldest = cache.keys().next().value;
    if (oldest === undefined) break;
    cache.delete(oldest);
  }
}

/**

 * Owns incoming message deduplication and bounded retention.

 */
export class MiaixzBridgeMessageCache extends Map<string, CachedIncomingMessage> {
  /**
   * Compacts expired and excess entries.
   *
   * @param now - Current epoch time.
   */
  compact(now = Date.now()): void {
    compactCache(this, now);
  }

  /**
   * Records one newly accepted identifier.
   *
   * @param messageId - Accepted message identifier.
   * @param now - Acceptance time.
   */
  accept(messageId: string, now = Date.now()): void {
    this.set(messageId, { timestamp: now });
  }

  /**
   * Reports whether an identifier was already accepted.
   *
   * @param messageId - Incoming message identifier.
   * @returns Whether retained state exists.
   */
  hasAccepted(messageId: string): boolean {
    return this.has(messageId);
  }

  /**
   * Reads retained incoming state.
   *
   * @param messageId - Incoming message identifier.
   * @returns Retained state when present.
   */
  read(messageId: string): CachedIncomingMessage | undefined {
    return this.get(messageId);
  }

  /**
   * Associates an accepted identifier with an in-flight Host request.
   *
   * @param messageId - Incoming request identifier.
   * @param request - Mutable Host request state.
   */
  recordRequest(messageId: string, request: HostRequestState): void {
    const entry = this.get(messageId);
    if (entry !== undefined) entry.request = request;
  }

  /**
   * Associates an accepted identifier with its completed response.
   *
   * @param messageId - Incoming request identifier.
   * @param response - Completed response available for replay.
   */
  recordResponse(messageId: string, response: MiaixzBridgeEnvelope): void {
    const entry = this.get(messageId);
    if (entry !== undefined) entry.response = response;
  }
}
