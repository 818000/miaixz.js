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

import { cpSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { loadWorkspaceRepository } from "../miaixz.mjs";

const requestedOutput = process.argv[2]?.trim();
if (!requestedOutput) throw new Error("Usage: stage-workspace-builds.mjs <output-directory>.");

const outputDirectory = resolve(requestedOutput);
if (existsSync(outputDirectory)) {
  if (!statSync(outputDirectory).isDirectory() || readdirSync(outputDirectory).length > 0) {
    throw new Error(`Build staging directory must be absent or empty: ${outputDirectory}.`);
  }
} else {
  mkdirSync(outputDirectory);
}

const { workspaces } = loadWorkspaceRepository();
for (const { directory, rootPath } of workspaces) {
  const source = join(rootPath, "dist");
  if (!existsSync(source) || !statSync(source).isDirectory()) {
    throw new Error(`Workspace build output is missing: ${directory}/dist.`);
  }
  const destination = join(outputDirectory, directory, "dist");
  mkdirSync(dirname(destination), { recursive: true });
  cpSync(source, destination, { recursive: true });
}

console.log(`Staged build output for ${workspaces.length} workspaces in ${outputDirectory}.`);
