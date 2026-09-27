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
 * Inspects the published Miaixz WOFF2 through the TTX CLI.
 */

import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { runFontTool } from "./validate.mjs";

const expectedFonts = Object.freeze(["miaixz-icons.woff2"]);

/**
 * Dumps and validates required OpenType tables for the complete font.
 *
 * @param {string} inputDirectory - Directory containing the WOFF2 file.
 * @returns {Promise<Readonly<Record<string, string>>>} TTX XML by font filename.
 */
export async function inspectFonts(inputDirectory) {
  const temporaryRoot = await mkdtemp(join(tmpdir(), "miaixz-icons-inspect-"));
  const reports = {};
  try {
    for (const filename of expectedFonts) {
      const input = resolve(inputDirectory, filename);
      const output = resolve(temporaryRoot, `${filename}.ttx`);
      await runFontTool("ttx", [
        "-t",
        "cmap",
        "-t",
        "fvar",
        "-t",
        "STAT",
        "-t",
        "name",
        "-t",
        "head",
        "-t",
        "hhea",
        "-t",
        "hmtx",
        "-o",
        output,
        input,
      ]);
      const xml = await readFile(output, "utf8");
      for (const table of ["cmap", "fvar", "STAT", "name", "head", "hhea", "hmtx"]) {
        if (!xml.includes(`<${table}`)) {
          throw new Error(`${filename} is missing the ${table} table.`);
        }
      }
      reports[filename] = xml;
    }
    return Object.freeze(reports);
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
}

const arguments_ = process.argv.slice(2);
if (
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  if (arguments_.length !== 2 || arguments_[0] !== "--input") {
    throw new Error("inspect.mjs requires exactly --input <font-directory>.");
  }
  const reports = await inspectFonts(resolve(arguments_[1]));
  console.log(
    JSON.stringify(
      Object.fromEntries(
        Object.entries(reports).map(([name, xml]) => [name, { xmlBytes: Buffer.byteLength(xml) }]),
      ),
      null,
      2,
    ),
  );
}
