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
 * Verifies the single generated TypeScript projection of the source shards.
 */

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  ICON_CATALOG,
  ICON_NAMES,
  INTERNAL_ICON_BY_NAME,
  INTERNAL_ICON_RECORDS,
} from "../../src/autogen/icons.js";

const assetsRoot = resolve(process.cwd(), "src/assets");
const manifest = JSON.parse(await readFile(resolve(assetsRoot, "icons.json"), "utf8")) as {
  readonly shards: readonly string[];
};
const icons = (
  await Promise.all(
    manifest.shards.map(async (path) => {
      const shard = JSON.parse(await readFile(resolve(assetsRoot, path), "utf8")) as {
        readonly icons: readonly {
          readonly name: string;
          readonly codepoint: number;
          readonly category: string;
          readonly opticalClass: string;
          readonly tier: string;
          readonly rtl: string;
        }[];
      };
      return shard.icons;
    }),
  )
).flat();

describe("generated icon mappings", () => {
  it("projects all source records into one generated module", () => {
    expect(Object.values(ICON_NAMES)).toEqual(icons.map(({ name }) => name));
    expect(ICON_CATALOG).toEqual(
      icons.map(({ name, category, opticalClass, tier, rtl }) => ({
        name,
        category,
        opticalClass,
        tier,
        rtl,
      })),
    );
    expect(INTERNAL_ICON_RECORDS).toEqual(
      icons.map(({ name, codepoint, rtl }) => ({
        name,
        codepoint,
        glyph: String.fromCodePoint(codepoint),
        rtl,
      })),
    );
  });

  it("keeps codepoints internal while retaining complete runtime lookup", () => {
    expect(ICON_CATALOG.every((entry) => !("codepoint" in entry))).toBe(true);
    expect(INTERNAL_ICON_BY_NAME.size).toBe(1781);
    expect(INTERNAL_ICON_BY_NAME.get("search")?.glyph).toBe(
      String.fromCodePoint(icons.find(({ name }) => name === "search")?.codepoint ?? 0),
    );
  });
});
