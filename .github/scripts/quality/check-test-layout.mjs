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
 * Verifies that test directories form a sparse mirror of source directories.
 */

import { existsSync, readdirSync } from "node:fs";
import { relative, resolve } from "node:path";

import { loadWorkspaceRepository, repositoryRoot } from "../miaixz.mjs";

const failures = [];

/**
 * Collects every directory below a root.
 *
 * @param {string} root - Directory to inspect.
 * @returns {string[]} Nested directory paths.
 */
function collectDirectories(root) {
  const directories = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const directory = resolve(root, entry.name);
    directories.push(directory, ...collectDirectories(directory));
  }
  return directories;
}

for (const { rootPath } of loadWorkspaceRepository(repositoryRoot).workspaces) {
  const sourceRoot = resolve(rootPath, "src");
  const testRoot = resolve(rootPath, "tests");
  if (!existsSync(sourceRoot) || !existsSync(testRoot)) continue;
  for (const testDirectory of collectDirectories(testRoot)) {
    const componentPath = relative(testRoot, testDirectory);
    const sourceDirectory = resolve(sourceRoot, componentPath);
    if (!existsSync(sourceDirectory)) {
      failures.push(relative(repositoryRoot, testDirectory).replaceAll("\\", "/"));
    }
  }
}

if (failures.length > 0) {
  throw new Error(
    `Test directories must mirror source components:\n${failures
      .sort()
      .map((path) => `- ${path}`)
      .join("\n")}`,
  );
}

console.log("Test directories mirror source components.");
