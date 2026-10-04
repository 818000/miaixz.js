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

import { ICON_NAMES } from "../../src/autogen/icons.js";

describe("generated icon identifiers", () => {
  it("uses unique SCREAMING_SNAKE_CASE keys", () => {
    const keys = Object.keys(ICON_NAMES);
    expect(keys).toHaveLength(1781);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys.every((key) => /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*$/u.test(key))).toBe(true);
  });

  it("uses canonical kebab-case values without aliases", () => {
    const names = Object.values(ICON_NAMES);
    expect(new Set(names).size).toBe(names.length);
    expect(names.every((name) => /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u.test(name))).toBe(true);
  });
});
