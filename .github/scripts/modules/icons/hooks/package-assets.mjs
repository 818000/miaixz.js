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
 * Owns only icon-package cleanup and deterministic design-derived resources.
 */
import { readFile, readdir, writeFile, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { packageRoot, loadIconSource, unicodeRangeFor } from "../source.mjs";

/**
 * Produces resource CSS without duplicating source design defaults.
 * Includes space in face selection so the line-box strut uses icon-font metrics, not fallback metrics.
 * This CSS range does not add a space glyph or change the font cmap.
 * @param {any} source Validated JSON projection.
 * @param {string} styles Structural CSS.
 * @returns {string} Complete CSS resource.
 */
export function packageStyles(source, styles) {
  if (/@import\b/u.test(styles)) throw new Error("Icon source CSS must not contain @import.");
  const { font, sizes, axes } = source.design;
  const family = JSON.stringify(font.familyName);
  return (
    "@font-face {\n  font-family: " +
    family +
    ';\n  font-style: normal;\n  font-weight: 400;\n  src: url("./assets/fonts/' +
    font.outputFile +
    '") format("woff2");\n  font-display: block;\n  unicode-range: ' +
    "U+0020, " +
    unicodeRangeFor(source.icons) +
    ";\n}\n\n" +
    ":where(:root, [data-miaixz-theme]) {\n  --miaixz-icon-font-family: " +
    family +
    ";\n" +
    Object.entries(sizes)
      .map(([name, size]) => "  --miaixz-icon-size-" + name + ": " + size.pixels + "px;")
      .join("\n") +
    "\n}\n\n" +
    "@layer miaixz.icons {\n  .miaixz-icon {\n    --miaixz-icon-fill: " +
    axes.fill.default +
    ";\n    --miaixz-icon-opsz: " +
    sizes.inline.opticalSize +
    ";\n    --miaixz-icon-size: " +
    sizes.inline.pixels +
    "px;\n  }\n}\n\n" +
    styles
  );
}

/**
 * Executes one resource mode against the derived package directory.
 * @param {string} mode clean or finalize.
 * @returns {Promise<void>} Completion.
 */
export async function packageAssets(mode) {
  if (mode === "clean") {
    await rm(resolve(packageRoot, "dist"), { recursive: true, force: true });
    return;
  }
  if (mode !== "finalize") throw new Error("Expected clean or finalize.");
  const source = await loadIconSource();
  const fonts = (await readdir(resolve(packageRoot, "dist/assets/fonts"))).sort();
  if (JSON.stringify(fonts) !== JSON.stringify([source.design.font.outputFile]))
    throw new Error("Compiled font resource set mismatch.");
  const styles = await readFile(resolve(packageRoot, "src/styles/index.css"), "utf8");
  await writeFile(resolve(packageRoot, "dist/styles.css"), packageStyles(source, styles));
}
if (
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const args = process.argv.slice(2);
  if (args.length !== 2 || args[0] !== "--mode" || !["clean", "finalize"].includes(args[1]))
    throw new Error("Expected --mode clean|finalize.");
  await packageAssets(args[1]);
}
