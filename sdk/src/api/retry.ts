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

import {
  MiaixzAbortError,
  MiaixzNetworkError,
  MiaixzSdkError,
  MiaixzTimeoutError,
} from "../errors/errors.js";

/**
 * Provides cancellation state and cleanup for a timed request.
 */
export interface MiaixzAbortContext {
  /**
   * Signal passed to Fetch for combined cancellation and timeout handling.
   */
  signal: AbortSignal;

  /**
   * Reports whether the configured timeout triggered cancellation.
   */
  timedOut: () => boolean;

  /**
   * Removes listeners and clears the timeout.
   */
  dispose: () => void;
}

/**
 * Combines caller cancellation with an SDK timeout and returns cleanup controls.
 *
 * @param signal - Optional cancellation signal supplied by the caller.
 * @param timeoutMs - Timeout threshold in milliseconds.
 * @returns Combined abort context and cleanup controls.
 */
export function createAbortContext(
  signal: AbortSignal | undefined,
  timeoutMs: number,
): MiaixzAbortContext {
  const controller = new AbortController();
  let didTimeout = false;
  const abortFromParent = () => controller.abort(signal?.reason);
  signal?.addEventListener("abort", abortFromParent, { once: true });
  if (signal?.aborted) abortFromParent();
  const timeout = setTimeout(() => {
    didTimeout = true;
    controller.abort();
  }, timeoutMs);
  return {
    signal: controller.signal,
    timedOut: () => didTimeout,
    dispose: () => {
      clearTimeout(timeout);
      signal?.removeEventListener("abort", abortFromParent);
    },
  };
}

/**
 * Calculates Retry-After or bounded exponential backoff in milliseconds.
 *
 * @param attempt - Zero-based retry attempt number.
 * @param response - Optional response containing a Retry-After header.
 * @returns Delay in milliseconds before the next retry.
 */
export function retryDelay(attempt: number, response?: Response): number {
  const retryAfter = response?.headers.get("retry-after");
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
    const timestamp = Date.parse(retryAfter);
    if (Number.isFinite(timestamp)) return Math.max(0, timestamp - Date.now());
  }
  return Math.min(250 * 2 ** attempt, 2_000);
}

/**
 * Waits for a retry delay while remaining cancellable by the caller.
 *
 * @param milliseconds - Delay duration in milliseconds.
 * @param signal - Optional cancellation signal supplied by the caller.
 * @returns Promise that resolves after the delay.
 */
export async function wait(milliseconds: number, signal: AbortSignal | undefined): Promise<void> {
  if (milliseconds <= 0) return;
  if (signal?.aborted) throw new MiaixzAbortError({ cause: signal.reason });
  await new Promise<void>((resolve, reject) => {
    const complete = () => {
      signal?.removeEventListener("abort", abort);
      resolve();
    };
    const timeout = setTimeout(complete, milliseconds);
    const abort = () => {
      clearTimeout(timeout);
      signal?.removeEventListener("abort", abort);
      reject(new MiaixzAbortError({ cause: signal?.reason }));
    };
    signal?.addEventListener("abort", abort, { once: true });
  });
}

/**
 * Converts an unknown attempt failure to the stable public SDK error model.
 *
 * @param error - Failure caught during the request attempt.
 * @param abortContext - Attempt timeout state.
 * @param callerSignal - Optional caller cancellation signal.
 * @param timeoutMs - Attempt timeout threshold.
 * @returns Stable SDK error for both telemetry and the request caller.
 */
export function normalizeAttemptError(
  error: unknown,
  abortContext: MiaixzAbortContext,
  callerSignal: AbortSignal | undefined,
  timeoutMs: number,
): MiaixzSdkError {
  if (error instanceof MiaixzSdkError) return error;
  if (abortContext.timedOut()) return new MiaixzTimeoutError({ timeoutMs, cause: error });
  if (callerSignal?.aborted) return new MiaixzAbortError({ cause: error });
  return new MiaixzNetworkError({ cause: error });
}
