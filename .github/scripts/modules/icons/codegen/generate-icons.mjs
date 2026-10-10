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
 * Generates three deterministic projections exclusively from canonical JSON.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { format, resolveConfig } from "prettier";
import { loadIconSource, packageRoot } from "../source.mjs";
const header =
  '/*\n ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~\n ~                                                                           ~\n ~ Copyright (c) 2015-2026 miaixz.org and other contributors.                ~\n ~                                                                           ~\n ~ Licensed under the Apache License, Version 2.0 (the "License");           ~\n ~ you may not use this file except in compliance with the License.          ~\n ~ You may obtain a copy of the License at                                   ~\n ~                                                                           ~\n ~      https://www.apache.org/licenses/LICENSE-2.0                          ~\n ~                                                                           ~\n ~ Unless required by applicable law or agreed to in writing, software       ~\n ~ distributed under the License is distributed on an "AS IS" BASIS,         ~\n ~ WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  ~\n ~ See the License for the specific language governing permissions and       ~\n ~ limitations under the License.                                            ~\n ~                                                                           ~\n ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~\n*/';
/**
 * Serializes one generated literal deterministically.
 * @param {unknown} value JSON-serializable design or directory value.
 * @returns {string} JSON literal text with two-space indentation.
 */
const literal = (value) => JSON.stringify(value, null, 2);

/**
 * Produces all three modules without reading or writing generated files.
 * @param {{assetsRoot?:string}} options Strict JSON source root.
 * @returns {Promise<Record<string,string>>} Filename to canonical TypeScript content.
 */
export async function generateIcons(options = {}) {
  const source = await loadIconSource(options);
  const icons =
    "/**\n * Immutable name-to-codepoint and RTL tuples.\n */\nexport const ICON_NAMES = Object.freeze({\n" +
    source.icons
      .map(
        (i) =>
          JSON.stringify(i.name) +
          ": Object.freeze([" +
          i.codepoint +
          ", " +
          (i.rtl === "mirror" ? 1 : 0) +
          "] as const),",
      )
      .join("\n") +
    "\n} as const);\n/**\n * Canonical icon name, derived from the keys of the generated mapping.\n */\nexport type IconName = keyof typeof ICON_NAMES;\n";
  const metadata =
    '/**\n * Defines the public icon directory names and categories.\n */\nimport type { IconName } from "./icons.js";\n' +
    "/**\n * Category identifiers declared by the canonical icon manifest.\n */\nexport type IconCategory = " +
    source.categories.map(literal).join(" | ") +
    ";\n" +
    "/**\n * Public catalog projection containing only an icon's canonical name and category.\n */\nexport interface IconCatalogEntry {\n /**\n * Canonical name accepted by the Icon component.\n */\n readonly name: IconName;\n /**\n * Manifest category used for browsing and filtering.\n */\n readonly category: IconCategory;\n}\n" +
    "const entries: readonly IconCatalogEntry[] = " +
    "[\n" +
    source.icons
      .map(({ name, category }) => literal({ name, category }) + " as IconCatalogEntry")
      .join(",\n") +
    "\n];\n" +
    "/**\n * Immutable public icon directory.\n */\nexport const ICON_CATALOG: readonly Readonly<IconCatalogEntry>[] = Object.freeze(entries.map((entry) => Object.freeze(entry)));\n";
  const axes = Object.fromEntries(
    Object.values(source.design.axes).map(({ tag, minimum, default: defaultValue, maximum }) => [
      tag,
      { minimum, default: defaultValue, maximum },
    ]),
  );
  /**
   * Serializes a two-level design object with frozen entries and literal keys.
   * @param {object} value Axis bounds or semantic size records from design.json.
   * @returns {string} TypeScript expression freezing the object and each entry.
   */
  const freezeObject = (value) =>
    "Object.freeze({" +
    Object.entries(value)
      .map(([key, v]) => JSON.stringify(key) + ": Object.freeze(" + literal(v) + ")")
      .join(",") +
    "} as const)";
  const design =
    "/**\n * Shared font family.\n */\nexport const FONT_FAMILY = " +
    literal(source.design.font.familyName) +
    ";\n" +
    "/**\n * Shared variable-font axis bounds.\n */\nexport const ICON_AXES = " +
    freezeObject(axes) +
    ";\n" +
    "/**\n * Shared semantic size tokens.\n */\nexport const ICON_SIZES = " +
    freezeObject(source.design.sizes) +
    ";\n" +
    "/**\n * Semantic size token derived from the generated size records.\n */\nexport type IconSize = keyof typeof ICON_SIZES;\n";
  const output = {};
  for (const [filename, text] of Object.entries({
    "icons.ts": icons,
    "metadata.ts": metadata,
    "design.ts": design,
  })) {
    const filepath = resolve(packageRoot, "src/values", filename);
    const config = { ...(await resolveConfig(filepath)), filepath };
    output[filename] = await format(await format(header + "\n\n" + text, config), config);
  }
  return output;
}

/**
 * Writes or compares the same computed module bytes.
 * @param {{mode:"write"|"check",assetsRoot?:string,outputRoot?:string}} options Mode and optional isolated roots.
 * @returns {Promise<void>} Completion.
 */
export async function processGeneratedIcons({
  mode,
  assetsRoot,
  outputRoot = resolve(packageRoot, "src/values"),
}) {
  if (!["write", "check"].includes(mode)) throw new Error("Expected write or check mode.");
  const generated = await generateIcons(assetsRoot === undefined ? {} : { assetsRoot });
  if (mode === "write") await mkdir(outputRoot, { recursive: true });
  for (const [filename, text] of Object.entries(generated)) {
    const path = resolve(outputRoot, filename);
    if (mode === "write") await writeFile(path, text);
    else if ((await readFile(path, "utf8")) !== text)
      throw new Error(filename + " is stale; run icons:generate.");
  }
}
if (
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const args = process.argv.slice(2);
  if (args.length !== 1 || !["--write", "--check"].includes(args[0]))
    throw new Error("Expected exactly --write or --check.");
  await processGeneratedIcons({ mode: args[0].slice(2) });
}
