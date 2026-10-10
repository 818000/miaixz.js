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
 * Checks current source/font quality directly without historical baselines or file records.
 */
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { packageRoot } from "../../../../../.github/scripts/modules/icons/source.mjs";
import {
  validateRefinedFont,
  sourceSha256,
} from "../../../../../.github/scripts/modules/icons/fonts/validate-icon-font.mjs";
import { renderCatalog } from "./render-catalog.helper.mjs";

/**
 * Computes a current font digest only in memory.
 * @returns {Promise<string>} Actual released font digest.
 */
async function currentFontHash() {
  return createHash("sha256")
    .update(await readFile(resolve(packageRoot, "dist/assets/fonts/miaixz-icons.woff2")))
    .digest("hex");
}

/**
 * Runs exact current geometry and raster checks and rejects an input change during execution.
 * @returns {Promise<object>} Actual check result; no completion or ownership claim is inferred.
 */
export async function compareVisuals() {
  const before = { source: await sourceSha256(), font: await currentFontHash() };
  const geometry = await validateRefinedFont();
  if (geometry.status !== "passed")
    throw new Error("Current geometry check failed; visual checking did not run.");
  const visual = await renderCatalog({
    fontDir: resolve(packageRoot, "dist/assets/fonts"),
    geometry,
  });
  const after = { source: await sourceSha256(), font: await currentFontHash() };
  if (JSON.stringify(before) !== JSON.stringify(after))
    throw new Error("Current source/font changed during quality checking; rerun the checks.");
  if (visual.status !== "passed") throw new Error("Current visual quality check failed.");
  console.log(
    "Current geometry and visual checks passed. No baseline, report or screenshot files written.",
  );
  return { status: "passed", geometry, visual };
}

/**
 * Rejects retired record and baseline-writing modes.
 * @param {string[]} args Exact CLI arguments.
 * @returns {{mode:string}} Read-only check mode.
 */
export function parseArguments(args) {
  if (args.length !== 2 || args[0] !== "--mode" || args[1] !== "validate")
    throw new Error("Expected --mode validate; baseline and record writes are disabled.");
  return { mode: "validate" };
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  parseArguments(process.argv.slice(2));
  await compareVisuals();
}
