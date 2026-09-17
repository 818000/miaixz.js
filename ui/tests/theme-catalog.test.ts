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

import { describe, expect, it } from "vitest";

import { createThemeStyles } from "../src/theme/index.js";
import { customThemes, recommendedThemes, traditionalThemes } from "../src/themes/index.js";

const recommendedNames = [
  "glacier",
  "porcelain",
  "tidal",
  "olive",
  "amber",
  "copper",
  "rose",
  "ink",
];
const traditionalNames = [
  "vermilion",
  "imperial-gold",
  "mineral-blue",
  "mineral-green",
  "clear-sky",
  "mountain-dai",
  "rouge",
  "lotus-root",
  "ru-celadon",
  "pine-pollen",
  "autumn-incense",
  "xuan-ink",
];

describe("optional theme catalog", () => {
  it("publishes all 21 themes in one stable catalog", () => {
    expect(recommendedThemes.map((theme) => theme.name)).toEqual(recommendedNames);
    expect(traditionalThemes.map((theme) => theme.name)).toEqual(traditionalNames);
    expect(customThemes.map((theme) => theme.name)).toEqual([
      "deepparser",
      ...recommendedNames,
      ...traditionalNames,
    ]);
    expect(new Set(customThemes.map((theme) => theme.name)).size).toBe(21);
  });

  it("serializes every catalog theme for both color modes", () => {
    const styles = createThemeStyles(customThemes);
    for (const theme of customThemes) {
      expect(styles).toContain(
        `[data-miaixz-theme="${theme.name}"][data-miaixz-color-mode="light"]`,
      );
      expect(styles).toContain(
        `[data-miaixz-theme="${theme.name}"][data-miaixz-color-mode="dark"]`,
      );
    }
  });
});
