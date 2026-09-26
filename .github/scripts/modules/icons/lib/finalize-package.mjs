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
 * Finalizes icon and provider package build outputs without mutating source inputs.
 */

import { cp, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";

/**
 * Copies the non-TypeScript outputs required by one built package.
 *
 * @returns Promise completed after build assets are copied.
 */
async function finalizePackage() {
  const packageRoot = process.cwd();
  const manifest = JSON.parse(await readFile(resolve(packageRoot, "package.json"), "utf8"));
  if (manifest.name === "@miaixz/icons") {
    const fonts = (await readdir(resolve(packageRoot, "dist/assets/fonts"))).sort();
    const expectedFonts = ["miaixz-icons-extended.woff2", "miaixz-icons.woff2"];
    if (JSON.stringify(fonts) !== JSON.stringify(expectedFonts)) {
      throw new Error(
        `@miaixz/icons requires exactly ${expectedFonts.join(", ")} before package build.`,
      );
    }
    await cp(resolve(packageRoot, "src/styles"), resolve(packageRoot, "dist/styles"), {
      recursive: true,
    });
  }
  const reportPath = resolve(packageRoot, "src/generation-report.json");
  try {
    const report = await readFile(reportPath, "utf8");
    await mkdir(resolve(packageRoot, "dist"), { recursive: true });
    await writeFile(resolve(packageRoot, "dist/generation-report.json"), report);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

await finalizePackage();
