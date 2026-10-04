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
 * Verifies canonical lookup and the single-font loading state.
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  isIconName,
  parseIconName,
  preloadIconFont,
  readIcon,
  resetIconFontLoads,
} from "../../src/runtime/index.js";

afterEach(() => {
  resetIconFontLoads();
  Reflect.deleteProperty(document, "fonts");
});

describe("font icon runtime", () => {
  it("validates canonical names without exposing records", () => {
    expect(isIconName("search")).toBe(true);
    expect(isIconName("not-a-real-icon")).toBe(false);
    expect(parseIconName("search")).toBe("search");
    expect(() => parseIconName("not-a-real-icon")).toThrow("Unknown icon name");
  });

  it("deduplicates public font preload requests", async () => {
    const load = vi.fn(async () => [Object.freeze({})] as FontFace[]);
    Object.defineProperty(document, "fonts", { configurable: true, value: { load } });
    await Promise.all(Array.from({ length: 100 }, () => preloadIconFont()));
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("resolves immediately during SSR-like execution", async () => {
    Reflect.deleteProperty(document, "fonts");
    await expect(preloadIconFont()).resolves.toBeUndefined();
    expect(readIcon("help")).toEqual(expect.objectContaining({ name: "help" }));
  });

  it("suspends once and returns the internal record after loading", async () => {
    const load = vi.fn(async () => [Object.freeze({})] as FontFace[]);
    Object.defineProperty(document, "fonts", { configurable: true, value: { load } });
    let pending: unknown;
    try {
      readIcon("help");
    } catch (error: unknown) {
      pending = error;
    }
    expect(pending).toBeInstanceOf(Promise);
    await (pending as Promise<void>);
    expect(readIcon("help")).toEqual(expect.objectContaining({ name: "help" }));
  });

  it("retains a controlled failed state", async () => {
    const load = vi.fn(async () => [] as FontFace[]);
    Object.defineProperty(document, "fonts", { configurable: true, value: { load } });
    await expect(preloadIconFont()).rejects.toThrow("Unable to load the icon font");
    expect(readIcon("accessibility")).toBeNull();
    await expect(preloadIconFont()).rejects.toThrow("Unable to load the icon font");
    expect(load).toHaveBeenCalledTimes(1);
  });
});
