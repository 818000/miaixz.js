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

import type { MiaixzSdkError } from "../errors/errors.js";

/**

 * State for one pending Child request.

 */
export interface PendingRequest {
  /**
   * Expected response method.
   */
  readonly method: string;
  /**
   * Resolves the request payload.
   */
  readonly resolve: (payload: unknown) => void;
  /**
   * Rejects the request.
   */
  readonly reject: (error: MiaixzSdkError) => void;
  /**
   * Active timeout handle.
   */
  readonly timer: ReturnType<typeof setTimeout>;
  /**
   * Whether a cancel envelope was sent.
   */
  cancelSent: boolean;
}

/**

 * State for one request being processed by the Host.

 */
export interface HostRequestState {
  /**
   * Whether the Child cancelled the request.
   */
  cancelled: boolean;
  /**
   * Whether an in-flight duplicate requests replay.
   */
  replayRequested: boolean;
}

/**
 * Owns creation, completion, cancellation, timeout, and cleanup of bridge requests.
 */
export class MiaixzPendingRequestRegistry {
  readonly #pending = new Map<string, PendingRequest>();
  readonly #host = new Map<string, HostRequestState>();

  /**
   * Creates a timed Child request.
   *
   * @param messageId - Correlated message identifier.
   * @param method - Expected response method.
   * @param timeoutMs - Timeout threshold.
   * @param onTimeout - Sends best-effort cancellation.
   * @param createTimeoutError - Creates the canonical timeout error.
   * @returns Promise settled by a correlated response or timeout.
   */
  createPending(
    messageId: string,
    method: string,
    timeoutMs: number,
    onTimeout: (pending: PendingRequest) => void,
    createTimeoutError: () => MiaixzSdkError,
  ): Promise<unknown> {
    return new Promise<unknown>((resolve, reject) => {
      const timer = setTimeout(() => {
        const pending = this.#pending.get(messageId);
        if (pending === undefined) return;
        this.#pending.delete(messageId);
        onTimeout(pending);
        reject(createTimeoutError());
      }, timeoutMs);
      this.#pending.set(messageId, { method, resolve, reject, timer, cancelSent: false });
    });
  }

  /**
   * Reads one pending Child request without changing it.
   *
   * @param messageId - Correlated message identifier.
   * @returns Pending state when present.
   */
  getPending(messageId: string): PendingRequest | undefined {
    return this.#pending.get(messageId);
  }

  /**
   * Completes one matching Child request exactly once.
   *
   * @param messageId - Correlated message identifier.
   * @param method - Response method.
   * @param settle - Resolves or rejects the retained promise.
   * @returns Whether a matching request was completed.
   */
  completePending(
    messageId: string,
    method: string,
    settle: (pending: PendingRequest) => void,
  ): boolean {
    const pending = this.#pending.get(messageId);
    if (pending === undefined || pending.method !== method) return false;
    this.#pending.delete(messageId);
    clearTimeout(pending.timer);
    settle(pending);
    return true;
  }

  /**
   * Rejects and removes one Child request.
   *
   * @param messageId - Correlated message identifier.
   * @param error - Deterministic local failure.
   */
  rejectPending(messageId: string, error: MiaixzSdkError): void {
    const pending = this.#pending.get(messageId);
    if (pending === undefined) return;
    this.#pending.delete(messageId);
    clearTimeout(pending.timer);
    pending.reject(error);
  }

  /**
   * Rejects every Child request during disposal.
   *
   * @param error - Deterministic disposal error.
   * @param onCancel - Sends best-effort cancellation per request.
   */
  disposePending(
    error: MiaixzSdkError,
    onCancel: (messageId: string, pending: PendingRequest) => void,
  ): void {
    for (const [messageId, pending] of this.#pending) {
      clearTimeout(pending.timer);
      onCancel(messageId, pending);
      pending.reject(error);
    }
    this.#pending.clear();
  }

  /**
   * Starts tracking one Host request.
   *
   * @param messageId - Correlated message identifier.
   * @returns New mutable Host state.
   */
  createHost(messageId: string): HostRequestState {
    const state: HostRequestState = { cancelled: false, replayRequested: false };
    this.#host.set(messageId, state);
    return state;
  }

  /**
   * Marks a tracked Host request as cancelled.
   *
   * @param messageId - Correlated message identifier.
   */
  cancelHost(messageId: string): void {
    const state = this.#host.get(messageId);
    if (state !== undefined) state.cancelled = true;
  }

  /**
   * Removes and returns one completed Host request.
   *
   * @param messageId - Correlated message identifier.
   * @returns Completed Host state when present.
   */
  completeHost(messageId: string): HostRequestState | undefined {
    const state = this.#host.get(messageId);
    this.#host.delete(messageId);
    return state;
  }

  /**
   * Clears all Host request state during disposal.
   */
  clearHost(): void {
    this.#host.clear();
  }
}
