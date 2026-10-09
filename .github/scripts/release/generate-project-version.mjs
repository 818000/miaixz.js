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
 * Generates browser-safe release constants exclusively from the repository VERSION.
 */

import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import {
  assertReleaseVersion,
  loadWorkspaceRepository,
  readRepositoryVersion,
  repositoryRoot,
} from "../miaixz.mjs";

/**
 * Renders the derived source modules without introducing another version authority.
 *
 * @param root - Repository containing VERSION and the workspace sources.
 * @param version - Validated release value read from VERSION.
 * @returns Absolute output paths and their deterministic source.
 */
export function renderProjectVersions(
  root = repositoryRoot,
  version = readRepositoryVersion(root),
) {
  assertReleaseVersion(version);
  const header = readFileSync(resolve(root, ".github/scripts/miaixz.org"), "utf8").trim();
  return loadWorkspaceRepository(root).publicWorkspaces.map(({ name, rootPath }) => {
    const sourceDirectory = resolve(rootPath, "src");
    if (!existsSync(sourceDirectory) || !statSync(sourceDirectory).isDirectory()) {
      throw new Error(`${name} must provide an existing src directory for generated versions.`);
    }
    return [
      resolve(sourceDirectory, "version.ts"),
      `${header}

/**
 * Generated from root VERSION; do not edit. Identifies the current project release.
 */
export const VERSION = ${JSON.stringify(version)} as const;
`,
    ];
  });
}

/**
 * Writes derived constants or rejects stale source without writing audit artifacts.
 *
 * @param check - Whether to validate instead of generating.
 * @param root - Repository root.
 */
export function generateProjectVersions(check = false, root = repositoryRoot) {
  for (const [path, expected] of renderProjectVersions(root)) {
    const current = existsSync(path) ? readFileSync(path, "utf8") : undefined;
    if (current === expected) continue;
    if (check) throw new Error(`${path} is stale; regenerate it from VERSION.`);
    writeFileSync(path, expected);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  if (args.length !== 1 || !["--write", "--check"].includes(args[0])) {
    throw new Error("Use --write or --check; the version is always read from VERSION.");
  }
  generateProjectVersions(args[0] === "--check");
}
