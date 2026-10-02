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
 * Verifies the machine-owned FontBakery exception policy and font metadata.
 */

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { describe, expect, it } from "vitest";

const repositoryRoot = resolve(process.cwd(), "../..");
const release = (await readFile(resolve(repositoryRoot, "VERSION"), "utf8")).trim();
const fontVersionCore = release.split("-")[0]!;
const [fontVersionMajor, fontVersionMinorPart, fontVersionPatch] = fontVersionCore
  .split(".")
  .map(Number);
const fontVersionMinor = fontVersionMinorPart! * 100 + fontVersionPatch!;
const openTypeVersion = `Version ${fontVersionMajor}.${String(fontVersionMinor).padStart(3, "0")}`;
const validatorUrl = pathToFileURL(
  resolve(repositoryRoot, ".github/scripts/modules/icons/fonts/validate-icon-font.mjs"),
).href;
const { EXPECTED_MASTER_DIRECTORIES, FONTBAKERY_EXCLUSIONS } = (await import(validatorUrl)) as {
  EXPECTED_MASTER_DIRECTORIES: readonly string[];
  FONTBAKERY_EXCLUSIONS: readonly {
    id: string;
    reason: string;
    throughVersion: string;
  }[];
};
const fontsRoot = resolve(process.cwd(), "src/assets/fonts");

describe("FontBakery icon-font policy", () => {
  it("uses an exact release-scoped exclusion set with recorded reasons", () => {
    expect(FONTBAKERY_EXCLUSIONS.map(({ id }) => id)).toEqual([
      "opentype/fvar/regular_coords_correct",
      "opentype/varfont/valid_default_instance_nameids",
      "opentype/monospace",
      "opentype/post_table_version",
      "opentype/unitsperem",
      "cmap/format_12",
      "gpos_kerning_info",
      "mandatory_avar_table",
      "smart_dropout",
      "whitespace_glyphs",
    ]);
    expect(new Set(FONTBAKERY_EXCLUSIONS.map(({ id }) => id)).size).toBe(
      FONTBAKERY_EXCLUSIONS.length,
    );
    for (const exclusion of FONTBAKERY_EXCLUSIONS) {
      expect(exclusion.throughVersion).toBe(release);
      expect(exclusion.reason.length).toBeGreaterThan(24);
    }
  });

  it("declares fixed-pitch symbol metadata and an OpenType-compatible version", async () => {
    for (const directory of EXPECTED_MASTER_DIRECTORIES) {
      const source = await readFile(resolve(fontsRoot, directory, "fontinfo.plist"), "utf8");
      expect(source).toContain("<key>postscriptIsFixedPitch</key>\n  <true/>");
      expect(source).toContain("<key>openTypeOS2Panose</key>");
      expect(source).toContain(`<string>${openTypeVersion}</string>`);
      expect(source).toContain(`;${release}</string>`);
    }
  });

  it("defines every FILL and optical-size STAT axis value", async () => {
    const source = await readFile(resolve(fontsRoot, "miaixz-icons.designspace"), "utf8");
    for (const label of [
      '<label uservalue="0" name="Outline" elidable="true">',
      '<label uservalue="1" name="Filled">',
      '<label uservalue="12" name="Compact">',
      '<label uservalue="24" name="Standard" elidable="true">',
      '<label uservalue="40" name="Display">',
    ]) {
      expect(source).toContain(label);
    }
  });
});
