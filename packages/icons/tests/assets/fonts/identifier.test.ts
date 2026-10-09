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
 * Verifies deterministic canonical-name identifier generation.
 */

import { describe, expect, it } from "vitest";
import { ICON_NAMES } from "../../../src/values/icons.js";
import { isIconName, parseIconName } from "../../../src/runtime/index.js";

describe("canonical icon identifiers", () => {
  it("uses exactly the mapping own keys as valid names", () => {
    const names = Object.keys(ICON_NAMES);
    expect(names.length).toBeGreaterThan(0);
    expect(names.every((name) => /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u.test(name))).toBe(true);
    for (const name of names) {
      expect(Object.hasOwn(ICON_NAMES, name)).toBe(true);
      expect(isIconName(name)).toBe(true);
      expect(parseIconName(name)).toBe(name);
    }
  });
  it.each([
    "not-a-real-icon",
    "",
    "SEARCH",
    "toString",
    "constructor",
    "__proto__",
    "hasOwnProperty",
  ])("rejects unknown or prototype name %s", (name) => {
    expect(isIconName(name)).toBe(false);
    expect(() => parseIconName(name)).toThrow(TypeError);
  });
});
