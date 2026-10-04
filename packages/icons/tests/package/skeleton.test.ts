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
 * Verifies the exact public package boundary.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import * as publicApi from "../../src/index.js";

const repositoryRoot = resolve(process.cwd(), "../..");

describe("icon package skeleton", () => {
  it("exports exactly the frozen runtime values", () => {
    expect(Object.keys(publicApi).sort()).toEqual([
      "ICON_CATALOG",
      "ICON_NAMES",
      "Icon",
      "isIconName",
      "parseIconName",
      "preloadIconFont",
    ]);
    expect(publicApi.ICON_CATALOG).toHaveLength(1781);
    expect(Object.keys(publicApi.ICON_NAMES)).toHaveLength(1781);
  });

  it("contains only the three supported package exports", () => {
    const manifest = JSON.parse(readFileSync(resolve(process.cwd(), "package.json"), "utf8")) as {
      readonly exports: Readonly<Record<string, unknown>>;
    };
    expect(Object.keys(manifest.exports)).toEqual([".", "./styles.css", "./font.woff2"]);
    expect(existsSync(resolve(repositoryRoot, "providers"))).toBe(false);
  });
});
