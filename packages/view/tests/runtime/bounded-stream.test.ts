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
 * Verifies bounded stream byte limits, cancellation, and no-progress deadlines.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { readBoundedStream } from "../../src/runtime/bounded-stream.js";

afterEach(() => vi.useRealTimers());

describe("readBoundedStream", () => {
  it("accepts exactly the configured byte boundary", async () => {
    const stream = new ReadableStream<Uint8Array>({
      /**
       * Enqueues the exact-boundary fixture and closes the stream.
       *
       * @param controller - Fixture stream controller.
       */
      start(controller) {
        controller.enqueue(new Uint8Array([1, 2]));
        controller.enqueue(new Uint8Array([3]));
        controller.close();
      },
    });
    const result = await readBoundedStream(stream, {
      field: "maxSourceBytes",
      maxBytes: 3,
      maxNoProgressMilliseconds: 1_000,
      signal: new AbortController().signal,
    });
    expect(result.totalBytes).toBe(3);
    expect(result.chunks).toHaveLength(2);
  });

  it("cancels before retaining a chunk which crosses the byte limit", async () => {
    const cancel = vi.fn();
    const stream = new ReadableStream<Uint8Array>({
      /**
       * Enqueues one allowed chunk followed by one overflowing chunk.
       *
       * @param controller - Fixture stream controller.
       */
      start(controller) {
        controller.enqueue(new Uint8Array([1, 2]));
        controller.enqueue(new Uint8Array([3, 4]));
      },
      cancel,
    });
    await expect(
      readBoundedStream(stream, {
        field: "maxSourceBytes",
        maxBytes: 3,
        maxNoProgressMilliseconds: 1_000,
        signal: new AbortController().signal,
      }),
    ).rejects.toMatchObject({
      code: "RESOURCE_LIMIT_EXCEEDED",
      resourceLimit: { field: "maxSourceBytes", actual: 4, allowed: 3 },
    });
    expect(cancel).toHaveBeenCalled();
  });

  it("cancels a stream which stops making progress", async () => {
    vi.useFakeTimers();
    const cancel = vi.fn();
    const stream = new ReadableStream<Uint8Array>({ cancel });
    const pending = readBoundedStream(stream, {
      field: "maxSourceBytes",
      maxBytes: 3,
      maxNoProgressMilliseconds: 25,
      signal: new AbortController().signal,
    });
    const result = expect(pending).rejects.toMatchObject({
      code: "RESOURCE_LIMIT_EXCEEDED",
      resourceLimit: { field: "maxNoProgressMilliseconds", allowed: 25 },
    });
    await vi.advanceTimersByTimeAsync(25);
    await result;
    expect(cancel).toHaveBeenCalledOnce();
  });
});
