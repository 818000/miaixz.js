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
 * Reads byte streams with cancellation, no-progress deadlines, and hard byte limits.
 */

import type { ResourceBudget } from "../shared/contracts/resource-budget.js";
import { ViewerError, type ViewerErrorStage } from "../shared/errors/viewer-error.js";

/**
 * Configures one bounded stream read.
 */
export interface BoundedStreamOptions {
  readonly field: keyof ResourceBudget;
  readonly maxBytes: number;
  readonly maxNoProgressMilliseconds: number;
  readonly signal: AbortSignal;
  readonly stage?: ViewerErrorStage;
  readonly onChunk?: (length: number, total: number) => void;
}

/**
 * Result of a bounded stream read without a second full-data copy.
 */
export interface BoundedStreamResult {
  readonly chunks: readonly Uint8Array[];
  readonly totalBytes: number;
}

/**
 * Reads a stream until completion or the first security boundary violation.
 *
 * @param stream - Byte stream to consume.
 * @param options - Limits, cancellation, and optional cumulative accounting.
 * @returns Owned chunks and their total length.
 */
export async function readBoundedStream(
  stream: ReadableStream<Uint8Array>,
  options: BoundedStreamOptions,
): Promise<BoundedStreamResult> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  let activeTimer: ReturnType<typeof setTimeout> | undefined;
  let abortReject: ((reason?: unknown) => void) | undefined;
  const abortPromise = new Promise<never>((_resolve, reject) => {
    abortReject = reject;
  });
  const abort = (): void => {
    const reason = options.signal.reason ?? new DOMException("Aborted", "AbortError");
    abortReject?.(reason);
    void reader.cancel(reason).catch(() => undefined);
  };
  options.signal.addEventListener("abort", abort, { once: true });
  try {
    options.signal.throwIfAborted();
    for (;;) {
      const noProgress = new Promise<never>((_resolve, reject) => {
        activeTimer = setTimeout(() => {
          const error = new ViewerError(
            "RESOURCE_LIMIT_EXCEEDED",
            options.stage ?? "parse",
            false,
            [],
            {
              field: "maxNoProgressMilliseconds",
              actual: options.maxNoProgressMilliseconds + 1,
              allowed: options.maxNoProgressMilliseconds,
            },
          );
          reject(error);
          void reader.cancel(error).catch(() => undefined);
        }, options.maxNoProgressMilliseconds);
      });
      const result = await Promise.race([reader.read(), noProgress, abortPromise]);
      if (activeTimer !== undefined) clearTimeout(activeTimer);
      activeTimer = undefined;
      if (result.done) break;
      const chunk = result.value;
      if (chunk.byteLength === 0) continue;
      const next = totalBytes + chunk.byteLength;
      if (!Number.isSafeInteger(next) || next > options.maxBytes) {
        await reader.cancel("resource limit exceeded").catch(() => undefined);
        throw new ViewerError("RESOURCE_LIMIT_EXCEEDED", options.stage ?? "parse", false, [], {
          field: options.field,
          actual: Number.isSafeInteger(next) ? next : Number.MAX_SAFE_INTEGER,
          allowed: options.maxBytes,
        });
      }
      options.onChunk?.(chunk.byteLength, next);
      totalBytes = next;
      chunks.push(chunk);
    }
    return { chunks, totalBytes };
  } catch (error) {
    await reader.cancel(error).catch(() => undefined);
    throw error;
  } finally {
    if (activeTimer !== undefined) clearTimeout(activeTimer);
    options.signal.removeEventListener("abort", abort);
    try {
      reader.releaseLock();
    } catch {
      /**
       * The underlying source may still be completing cancellation.
       */
    }
  }
}
