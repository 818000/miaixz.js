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
 * Enforces two-part or three-part kebab-case names for repository automation files.
 */

import { readdirSync } from "node:fs";
import { relative, resolve } from "node:path";

import { repositoryRoot } from "../miaixz.mjs";

const targetDirectories = ["modules", "package", "quality", "release"];
const recognizedSuffixes = [".lock.txt", ".d.mts", ".mjs", ".json", ".txt"];
const namePattern = /^[a-z0-9]+(?:-[a-z0-9]+){1,2}$/u;
const failures = [];

/**
 * Returns the semantic filename without its recognized type suffix.
 *
 * @param {string} filename - Filename to normalize.
 * @returns {string | undefined} Semantic filename, when the file type is recognized.
 */
function removeTypeSuffix(filename) {
  const suffix = recognizedSuffixes.find((candidate) => filename.endsWith(candidate));
  return suffix === undefined ? undefined : filename.slice(0, -suffix.length);
}

/**
 * Recursively checks automation filenames below one directory.
 *
 * @param {string} directory - Absolute directory to inspect.
 * @returns {void}
 */
function inspectDirectory(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      inspectDirectory(path);
      continue;
    }
    if (!entry.isFile()) continue;
    const semanticName = removeTypeSuffix(entry.name);
    if (semanticName === undefined || !namePattern.test(semanticName)) {
      failures.push(relative(repositoryRoot, path));
    }
  }
}

for (const directory of targetDirectories) {
  inspectDirectory(resolve(repositoryRoot, ".github/scripts", directory));
}

if (failures.length > 0) {
  throw new Error(
    `Automation filenames must use two or three kebab-case parts:\n${failures
      .sort()
      .map((path) => `- ${path}`)
      .join("\n")}`,
  );
}

console.log("Automation filenames use two or three kebab-case parts.");
