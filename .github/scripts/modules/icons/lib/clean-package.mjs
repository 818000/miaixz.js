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
 * Removes stale package build output while preserving separately validated icon fonts.
 */

import { existsSync } from "node:fs";
import { readFile, readdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";

const packageRoot = process.cwd();
const manifest = JSON.parse(await readFile(resolve(packageRoot, "package.json"), "utf8"));
const outputRoot = resolve(packageRoot, "dist");

if (manifest.name !== "@miaixz/icons") {
  await rm(outputRoot, { force: true, recursive: true });
} else if (existsSync(outputRoot)) {
  for (const entry of await readdir(outputRoot)) {
    if (entry !== "assets") {
      await rm(resolve(outputRoot, entry), { force: true, recursive: true });
    }
  }
  const assetRoot = resolve(outputRoot, "assets");
  if (existsSync(assetRoot)) {
    for (const entry of await readdir(assetRoot)) {
      if (entry !== "fonts") {
        await rm(resolve(assetRoot, entry), { force: true, recursive: true });
      }
    }
  }
}
