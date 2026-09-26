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
 * Audits every generated glyph across the six interpolation masters.
 */

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { describe, expect, it } from "vitest";

const repositoryRoot = resolve(process.cwd(), "../..");
const generatorUrl = pathToFileURL(
  resolve(repositoryRoot, ".github/scripts/modules/icons/codegen/generate-glyphs.mjs"),
).href;
const validatorUrl = pathToFileURL(
  resolve(repositoryRoot, ".github/scripts/modules/icons/fonts/validate.mjs"),
).href;
const { generateGlyphs } = (await import(generatorUrl)) as {
  generateGlyphs: (check: boolean) => Promise<void>;
};
const {
  EXPECTED_MASTER_DIRECTORIES,
  validateMasterGeometry,
  validateMasterTopology,
  validateNonEmptyMasterGlyphs,
} = (await import(validatorUrl)) as {
  EXPECTED_MASTER_DIRECTORIES: readonly string[];
  validateMasterGeometry: (
    icons: readonly { glyphName: string }[],
    briefs: readonly { name: string; degenerates?: { allowed?: boolean } }[],
  ) => Promise<void>;
  validateMasterTopology: (
    masters: readonly string[],
    icons: readonly { glyphName: string }[],
  ) => Promise<void>;
  validateNonEmptyMasterGlyphs: (
    masters: readonly string[],
    icons: readonly { glyphName: string }[],
  ) => Promise<void>;
};
const fontsRoot = resolve(process.cwd(), "src/assets/fonts");
const assetsRoot = resolve(process.cwd(), "src/assets");
const codepoints = JSON.parse(await readFile(resolve(fontsRoot, "codepoints.json"), "utf8")) as {
  icons: readonly { glyphName: string }[];
};
const briefFile = JSON.parse(await readFile(resolve(assetsRoot, "design-briefs.json"), "utf8")) as {
  briefs: readonly { name: string; degenerates?: { allowed?: boolean } }[];
};

describe("complete generated glyph set", () => {
  it("matches the deterministic Node generator", async () => {
    await expect(generateGlyphs(true)).resolves.toBeUndefined();
  });

  it("contains 6,144 visible canonical master glyphs", async () => {
    expect(codepoints.icons).toHaveLength(1024);
    expect(EXPECTED_MASTER_DIRECTORIES).toHaveLength(6);
    await expect(
      validateNonEmptyMasterGlyphs(EXPECTED_MASTER_DIRECTORIES, codepoints.icons),
    ).resolves.toBeUndefined();
  });

  it("keeps all six-master topology and sampled geometry compatible", async () => {
    await expect(
      validateMasterTopology(EXPECTED_MASTER_DIRECTORIES, codepoints.icons),
    ).resolves.toBeUndefined();
    await expect(
      validateMasterGeometry(codepoints.icons, briefFile.briefs),
    ).resolves.toBeUndefined();
  });
});
