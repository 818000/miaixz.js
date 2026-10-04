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
 * Produces local release evidence from the final source graph and package output.
 */

import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { readRepositoryVersion } from "../../../miaixz.mjs";
import {
  EXPECTED_MASTER_DIRECTORIES,
  assetsRoot,
  fontsRoot,
  loadIconSource,
  packageRoot,
  repositoryRoot,
} from "../source.mjs";

const scriptPath = fileURLToPath(import.meta.url);

/**
 * Describes one release file by path, size, and digest.
 *
 * @param {string} path Absolute file path.
 * @returns {Promise<Readonly<{path: string, bytes: number, sha256: string}>>} File description.
 */
async function describe(path) {
  const bytes = await readFile(path);
  return Object.freeze({
    path: relative(repositoryRoot, path),
    bytes: bytes.byteLength,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  });
}

/**
 * Hashes the ordered GLIF set of one UFO master.
 *
 * @param {string} directory UFO master directory.
 * @returns {Promise<Readonly<{directory: string, glyphs: number, sha256: string}>>} Master digest.
 */
async function hashMaster(directory) {
  const glyphRoot = resolve(fontsRoot, directory, "glyphs");
  const files = (await readdir(glyphRoot)).filter((name) => name.endsWith(".glif")).sort();
  const hash = createHash("sha256");
  for (const name of files) hash.update(await readFile(resolve(glyphRoot, name)));
  return Object.freeze({ directory, glyphs: files.length, sha256: hash.digest("hex") });
}

const release = readRepositoryVersion(repositoryRoot);
const source = await loadIconSource({ validateUfo: true });
const fontPath = resolve(packageRoot, "dist/assets/fonts/miaixz-icons.woff2");
const font = await describe(fontPath);
if ((await stat(fontPath)).size > source.design.limits.fontBytes) {
  throw new Error("The icon font exceeds design.json limits.fontBytes.");
}
const sourceFiles = [
  resolve(assetsRoot, "icons.json"),
  resolve(assetsRoot, "design.json"),
  resolve(assetsRoot, "source.schema.json"),
  ...source.shardPaths.map((path) => resolve(assetsRoot, path)),
  resolve(fontsRoot, "miaixz-icons.designspace"),
];
const report = Object.freeze({
  release,
  status: "passed",
  generatedBy: relative(repositoryRoot, scriptPath),
  totals: Object.freeze({
    icons: source.icons.length,
    categories: source.categories.length,
    shards: source.shardPaths.length,
    masters: EXPECTED_MASTER_DIRECTORIES.length,
    sourceGlyphFiles: source.icons.length * EXPECTED_MASTER_DIRECTORIES.length,
  }),
  font,
  sourceFiles: await Promise.all(sourceFiles.map(describe)),
  masters: await Promise.all(EXPECTED_MASTER_DIRECTORIES.map(hashMaster)),
});
const outputPath = resolve(packageRoot, ".artifacts/release-evidence.json");
await mkdir(resolve(packageRoot, ".artifacts"), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`Icon release evidence passed for ${report.totals.icons} icons.\n`);
