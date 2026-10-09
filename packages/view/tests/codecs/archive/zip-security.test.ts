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
 * Verifies ZIP path safety and central/local metadata agreement.
 */

import { describe, expect, it } from "vitest";
import { ZipArchive } from "../../../src/codecs/archive/zip-codec.js";
import { defaultResourceBudget } from "../../../src/runtime/resource-budget.js";
import { storedZip } from "./stored-zip.helper.js";

describe("ZipArchive security boundaries", () => {
  it("rejects absolute, traversal, backslash, and drive-qualified paths", () => {
    for (const path of ["/root.txt", "../escape.txt", "a\\b.txt", "C:drive.txt"]) {
      expect(() => new ZipArchive(storedZip({ [path]: "x" }), defaultResourceBudget)).toThrowError(
        expect.objectContaining({ code: "PARSE_FAILED" }),
      );
    }
  });

  it("rejects a local filename which disagrees with the central directory", async () => {
    const bytes = storedZip({ "safe.txt": "content" });
    bytes[30] = "x".charCodeAt(0);
    const archive = new ZipArchive(bytes, defaultResourceBudget);
    await expect(archive.read("safe.txt")).rejects.toMatchObject({ code: "PARSE_FAILED" });
  });

  it("rejects trailing bytes and multi-disk metadata", () => {
    const trailing = storedZip({ "safe.txt": "content" });
    const extended = new Uint8Array(trailing.length + 1);
    extended.set(trailing);
    expect(() => new ZipArchive(extended, defaultResourceBudget)).toThrowError(
      expect.objectContaining({ code: "PARSE_FAILED" }),
    );

    const multiDisk = storedZip({ "safe.txt": "content" });
    const end = multiDisk.length - 22;
    multiDisk[end + 4] = 1;
    expect(() => new ZipArchive(multiDisk, defaultResourceBudget)).toThrowError(
      expect.objectContaining({ code: "PARSE_FAILED" }),
    );
  });

  it("rejects stored entries with inconsistent compressed sizes before copying", async () => {
    const bytes = storedZip({ "safe.txt": "content" });
    const end = bytes.length - 22;
    const directory =
      (bytes[end + 16] ?? 0) |
      ((bytes[end + 17] ?? 0) << 8) |
      ((bytes[end + 18] ?? 0) << 16) |
      ((bytes[end + 19] ?? 0) << 24);
    bytes[directory + 20] = 6;
    const archive = new ZipArchive(bytes, defaultResourceBudget);
    await expect(archive.read("safe.txt")).rejects.toMatchObject({ code: "PARSE_FAILED" });
  });

  it("enforces declared entry and total expansion limits while indexing", () => {
    expect(
      () =>
        new ZipArchive(storedZip({ "large.txt": "1234" }), {
          ...defaultResourceBudget,
          maxArchiveEntryBytes: 3,
        }),
    ).toThrowError(
      expect.objectContaining({
        code: "RESOURCE_LIMIT_EXCEEDED",
        resourceLimit: { field: "maxArchiveEntryBytes", actual: 4, allowed: 3 },
      }),
    );
  });
});
