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
 * Verifies deterministic font lookup and single-font loading.
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  isIconName,
  loadMiaixzIconFont,
  parseIconName,
  preloadMiaixzIconFont,
  readMiaixzIcon,
  resetMiaixzIconFontLoads,
  resolveMiaixzIcon,
} from "../../src/runtime/index.js";

afterEach(() => {
  resetMiaixzIconFontLoads();
  Reflect.deleteProperty(document, "fonts");
});

describe("font icon runtime", () => {
  it("exposes only font-backed names and immutable records", () => {
    expect(isIconName("search")).toBe(true);
    expect(isIconName("zoom-in")).toBe(true);
    expect(isIconName("not-a-real-icon")).toBe(false);
    expect(parseIconName("search")).toBe("search");
    expect(() => parseIconName("not-a-real-icon")).toThrow("Unknown icon name");
    expect(resolveMiaixzIcon("search")).toEqual(
      expect.objectContaining({ glyph: String.fromCodePoint(0xf0034) }),
    );
  });

  it("deduplicates concurrent requests for any glyph in the complete font", async () => {
    const load = vi.fn(async () => [Object.freeze({})] as FontFace[]);
    Object.defineProperty(document, "fonts", { configurable: true, value: { load } });

    await Promise.all([
      ...Array.from({ length: 100 }, () => loadMiaixzIconFont("a")),
      ...Array.from({ length: 100 }, () => loadMiaixzIconFont("b")),
    ]);

    expect(load).toHaveBeenCalledTimes(1);
    await preloadMiaixzIconFont();
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("resolves immediately without the Font Loading API", async () => {
    Reflect.deleteProperty(document, "fonts");
    await expect(loadMiaixzIconFont("a")).resolves.toBeUndefined();
    expect(readMiaixzIcon("help")).toEqual(expect.objectContaining({ name: "help" }));
  });

  it("suspends once and returns a record after the font resolves", async () => {
    const load = vi.fn(async () => [Object.freeze({})] as FontFace[]);
    Object.defineProperty(document, "fonts", { configurable: true, value: { load } });
    let pending: unknown;
    try {
      readMiaixzIcon("help");
    } catch (error: unknown) {
      pending = error;
    }
    expect(pending).toBeInstanceOf(Promise);
    await (pending as Promise<void>);
    expect(readMiaixzIcon("help")).toEqual(expect.objectContaining({ name: "help" }));
  });

  it("turns an empty font result into a controlled failed state", async () => {
    const load = vi.fn(async () => [] as FontFace[]);
    Object.defineProperty(document, "fonts", { configurable: true, value: { load } });
    await expect(loadMiaixzIconFont("b")).rejects.toThrow("Unable to load the icon font");
    expect(readMiaixzIcon("accessibility")).toBeNull();
    await expect(loadMiaixzIconFont("b")).rejects.toThrow("Unable to load the icon font");
  });

  it("retains a rejected browser font error for deterministic retries", async () => {
    const failure = new Error("font fixture failure");
    const load = vi.fn(async () => Promise.reject(failure));
    Object.defineProperty(document, "fonts", { configurable: true, value: { load } });
    await expect(loadMiaixzIconFont("a")).rejects.toBe(failure);
    await expect(loadMiaixzIconFont("a")).rejects.toBe(failure);
    expect(load).toHaveBeenCalledTimes(1);
  });
});
