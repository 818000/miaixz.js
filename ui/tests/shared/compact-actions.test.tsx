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

import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("compact row actions", () => {
  it("tracks the shared mobile breakpoint and removes its listener", async () => {
    let listener: (() => void) | undefined;
    const removeEventListener = vi.fn();
    const query = {
      matches: false,
      addEventListener: (_type: string, next: () => void) => {
        listener = next;
      },
      removeEventListener,
    };
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => query),
    );
    const { useMiaixzCompactActions } =
      await import("../../src/shared/responsive/compact-actions.js");
    const hook = renderHook(() => useMiaixzCompactActions());
    const secondHook = renderHook(() => useMiaixzCompactActions());

    expect(hook.result.current).toBe(false);
    act(() => {
      query.matches = true;
      listener?.();
    });
    expect(hook.result.current).toBe(true);
    expect(secondHook.result.current).toBe(true);

    hook.unmount();
    expect(removeEventListener).not.toHaveBeenCalled();
    secondHook.unmount();
    expect(removeEventListener).toHaveBeenCalledTimes(1);
  });
});
