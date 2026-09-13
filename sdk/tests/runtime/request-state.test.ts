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

import { afterEach, describe, expect, it, vi } from "vitest";

import { MiaixzSdkError } from "../../src/errors/errors.js";
import { MiaixzBridgeMessageCache } from "../../src/runtime/message-cache.js";
import { MiaixzPendingRequestRegistry } from "../../src/runtime/pending-requests.js";
import { createEnvelope } from "../../src/runtime/post-message-protocol.js";

afterEach(() => vi.useRealTimers());

describe("Bridge request state owners", () => {
  it("owns pending resolution, rejection, timeout, and disposal exactly once", async () => {
    vi.useFakeTimers();
    const registry = new MiaixzPendingRequestRegistry();
    const timeout = vi.fn();
    const first = registry.createPending(
      "one",
      "context.get",
      1_000,
      timeout,
      () => new MiaixzSdkError({ code: "BRIDGE_TIMEOUT" }),
    );
    expect(registry.getPending("one")?.method).toBe("context.get");
    expect(registry.completePending("one", "wrong", vi.fn())).toBe(false);
    expect(
      registry.completePending("one", "context.get", (pending) => pending.resolve("done")),
    ).toBe(true);
    await expect(first).resolves.toBe("done");
    expect(registry.completePending("one", "context.get", vi.fn())).toBe(false);

    const rejected = registry.createPending(
      "two",
      "context.get",
      1_000,
      timeout,
      () => new MiaixzSdkError({ code: "BRIDGE_TIMEOUT" }),
    );
    registry.rejectPending("missing", new MiaixzSdkError({ code: "BRIDGE_DISPOSED" }));
    registry.rejectPending("two", new MiaixzSdkError({ code: "BRIDGE_DISPOSED" }));
    await expect(rejected).rejects.toMatchObject({ code: "BRIDGE_DISPOSED" });

    const expired = registry.createPending(
      "three",
      "context.get",
      1_000,
      timeout,
      () => new MiaixzSdkError({ code: "BRIDGE_TIMEOUT" }),
    );
    const expiredResult = expect(expired).rejects.toMatchObject({ code: "BRIDGE_TIMEOUT" });
    await vi.advanceTimersByTimeAsync(1_000);
    await expiredResult;
    expect(timeout).toHaveBeenCalledOnce();

    const disposed = registry.createPending(
      "four",
      "context.get",
      1_000,
      timeout,
      () => new MiaixzSdkError({ code: "BRIDGE_TIMEOUT" }),
    );
    const cancel = vi.fn();
    registry.disposePending(new MiaixzSdkError({ code: "BRIDGE_DISPOSED" }), cancel);
    await expect(disposed).rejects.toMatchObject({ code: "BRIDGE_DISPOSED" });
    expect(cancel).toHaveBeenCalledOnce();
    registry.disposePending(new MiaixzSdkError({ code: "BRIDGE_DISPOSED" }), cancel);
  });

  it("owns Host cancellation and completion state", () => {
    const registry = new MiaixzPendingRequestRegistry();
    const state = registry.createHost("one");
    expect(state).toEqual({ cancelled: false, replayRequested: false });
    registry.cancelHost("missing");
    registry.cancelHost("one");
    expect(registry.completeHost("one")).toEqual({ cancelled: true, replayRequested: false });
    expect(registry.completeHost("one")).toBeUndefined();
    registry.createHost("two");
    registry.clearHost();
    expect(registry.completeHost("two")).toBeUndefined();
  });

  it("deduplicates accepted messages and retains replay state within fixed bounds", () => {
    const cache = new MiaixzBridgeMessageCache();
    cache.accept("old", 0);
    cache.accept("current", 5 * 60 * 1_000);
    expect(cache.hasAccepted("current")).toBe(true);
    expect(cache.read("missing")).toBeUndefined();
    const request = { cancelled: false, replayRequested: false };
    cache.recordRequest("missing", request);
    cache.recordRequest("current", request);
    const response = createEnvelope(
      "module-one",
      "response",
      "context.get",
      "123e4567-e89b-42d3-a456-426614174000",
      {},
    );
    cache.recordResponse("missing", response);
    cache.recordResponse("current", response);
    expect(cache.read("current")).toMatchObject({ request, response });
    cache.compact(5 * 60 * 1_000 + 1);
    expect(cache.hasAccepted("old")).toBe(false);

    for (let index = 0; index < 1_010; index += 1) cache.accept(`id-${index}`, 5 * 60 * 1_000 + 1);
    cache.compact(5 * 60 * 1_000 + 1);
    expect(cache.size).toBe(1_000);
    expect(cache.hasAccepted("current")).toBe(false);
  });
});
