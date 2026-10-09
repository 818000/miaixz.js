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
 * Expands browser-native DEFLATE streams without materializing unbounded output.
 */

import type { ResourceBudget } from "../shared/contracts/resource-budget.js";
import { ViewerError } from "../shared/errors/viewer-error.js";
import { readBoundedStream } from "./bounded-stream.js";
import type { ResourceBudgetGuard } from "./resource-budget-guard.js";

const compressionRatioMinimumBytes = 16 * 1024 * 1024;

/**
 * Configures one bounded DEFLATE expansion.
 */
export interface BoundedDecompressionOptions {
  readonly budget: ResourceBudget;
  readonly format: "deflate" | "deflate-raw";
  readonly guard: ResourceBudgetGuard;
  readonly maxOutputBytes: number;
  readonly signal: AbortSignal;
}

/**
 * Decompresses bytes while enforcing actual output and session limits per chunk.
 *
 * @param compressed - Compressed source bytes.
 * @param options - Compression format and security boundaries.
 * @returns Complete bounded uncompressed bytes.
 */
export async function decompressBounded(
  compressed: Uint8Array,
  options: BoundedDecompressionOptions,
): Promise<Uint8Array> {
  try {
    const stream = new Blob([Uint8Array.from(compressed).buffer])
      .stream()
      .pipeThrough(new DecompressionStream(options.format));
    const result = await readBoundedStream(stream, {
      field: "maxArchiveEntryBytes",
      maxBytes: options.maxOutputBytes,
      maxNoProgressMilliseconds: options.budget.maxNoProgressMilliseconds,
      signal: options.signal,
      /**
       * Accounts for expanded bytes and rejects excessive compression ratios.
       *
       * @param length - Expanded bytes in the current chunk.
       * @param total - Total expanded bytes received so far.
       */
      onChunk(length, total) {
        if (
          total > compressionRatioMinimumBytes &&
          (compressed.byteLength === 0 ||
            total / compressed.byteLength > options.budget.maxCompressionRatio)
        ) {
          throw new ViewerError("RESOURCE_LIMIT_EXCEEDED", "parse", false, [], {
            field: "maxCompressionRatio",
            actual:
              compressed.byteLength === 0
                ? Number.MAX_SAFE_INTEGER
                : Math.ceil(total / compressed.byteLength),
            allowed: options.budget.maxCompressionRatio,
          });
        }
        options.guard.consumeExpandedBytes(length);
      },
    });
    const output = new Uint8Array(result.totalBytes);
    let offset = 0;
    for (const chunk of result.chunks) {
      output.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return output;
  } catch (error) {
    if (error instanceof ViewerError || options.signal.aborted) throw error;
    throw new ViewerError("PARSE_FAILED", "parse");
  }
}
