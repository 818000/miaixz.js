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
 * Proves generated TypeScript is an exact projection of the frozen JSON data.
 */

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { ICON_CODEPOINTS, ICON_GLYPH_BY_NAME } from "../../src/autogen/codepoints.js";
import { ICON_CATALOG, ICON_NAME_LIST } from "../../src/autogen/catalog.js";

const assetsRoot = resolve(process.cwd(), "src/assets");
const ledger = JSON.parse(await readFile(resolve(assetsRoot, "fonts/codepoints.json"), "utf8")) as {
  icons: readonly {
    name: string;
    codepoint: number;
    glyphName: string;
    tier: "core" | "extended";
  }[];
};
const catalog = JSON.parse(await readFile(resolve(assetsRoot, "catalog.json"), "utf8")) as {
  icons: readonly { name: string; rtl: "none" | "mirror"; tier: "core" | "extended" }[];
};
const releasePlan = JSON.parse(
  await readFile(resolve(assetsRoot, "release-plan.json"), "utf8"),
) as {
  coreNames: readonly string[];
  extendedNames: readonly string[];
};

describe("generated TypeScript mappings", () => {
  it("matches all 1024 JSON ledger and catalog rows exactly", () => {
    const rtlByName = new Map(catalog.icons.map((icon) => [icon.name, icon.rtl]));
    const expected = ledger.icons.map((icon) => ({
      ...icon,
      rtl: rtlByName.get(icon.name),
    }));

    expect(ICON_CODEPOINTS).toHaveLength(1024);
    expect(ICON_CATALOG).toHaveLength(1024);
    expect(ICON_NAME_LIST).toHaveLength(1024);
    expect(ICON_NAME_LIST).toEqual(ICON_CODEPOINTS.map(({ name }) => name));
    expect(ICON_CODEPOINTS).toEqual(expected);
    for (const icon of ICON_CODEPOINTS) {
      expect(ICON_GLYPH_BY_NAME.get(icon.name)).toBe(String.fromCodePoint(icon.codepoint));
      expect(catalog.icons.find(({ name }) => name === icon.name)?.tier).toBe(icon.tier);
    }
  });

  it("matches the frozen 64/960 catalog priority partition", () => {
    expect(ICON_CODEPOINTS.filter(({ tier }) => tier === "core").map(({ name }) => name)).toEqual(
      releasePlan.coreNames,
    );
    expect(
      ICON_CODEPOINTS.filter(({ tier }) => tier === "extended").map(({ name }) => name),
    ).toEqual(releasePlan.extendedNames);
  });
});
