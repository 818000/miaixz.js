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
 * Verifies the mandatory .notdef and the canonical empty-glyph build gate.
 */

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { describe, expect, it } from "vitest";

const repositoryRoot = resolve(process.cwd(), "../..");
const moduleUrl = pathToFileURL(
  resolve(repositoryRoot, ".github/scripts/modules/icons/fonts/validate-icon-font.mjs"),
).href;
const { EXPECTED_MASTER_DIRECTORIES, validateNonEmptyGlyphSource } = (await import(moduleUrl)) as {
  EXPECTED_MASTER_DIRECTORIES: readonly string[];
  validateNonEmptyGlyphSource: (xml: string, glyphName: string) => void;
};
const fontsRoot = resolve(process.cwd(), "src/assets/fonts");

describe("UFO glyph source gate", () => {
  it("contains the same visible .notdef in all six masters", async () => {
    const sources = await Promise.all(
      EXPECTED_MASTER_DIRECTORIES.map((directory) =>
        readFile(resolve(fontsRoot, directory, "glyphs/_notdef.glif"), "utf8"),
      ),
    );

    expect(new Set(sources).size).toBe(1);
    for (const source of sources) {
      expect(() => validateNonEmptyGlyphSource(source, ".notdef")).not.toThrow();
    }
  });

  it("rejects a canonical GLIF without contours or components", () => {
    const empty = `<?xml version="1.0" encoding="UTF-8"?>
<glyph name="miaixz.add" format="2">
  <advance width="960"/>
  <unicode hex="0F0000"/>
</glyph>`;

    expect(() => validateNonEmptyGlyphSource(empty, "miaixz.add")).toThrow(
      /miaixz\.add has no renderable outline/u,
    );
  });
});
