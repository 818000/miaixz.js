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

import { execFileSync } from "node:child_process";
import { assertReleaseVersion, loadWorkspaceRepository } from "../miaixz.mjs";

const version = process.argv[2]?.trim();
const registry = process.argv[3]?.trim() || "https://registry.npmjs.org/";
if (!version) throw new Error("Usage: check-published-packages.mjs <version> [registry].");
assertReleaseVersion(version);

const { publicWorkspaces } = loadWorkspaceRepository();
for (const { name } of publicWorkspaces) {
  const published = execFileSync(
    "npm",
    ["view", `${name}@${version}`, "version", "--json", "--prefer-online", "--registry", registry],
    { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] },
  )
    .replaceAll(/["\s]/gu, "")
    .trim();
  if (published !== version) {
    throw new Error(`${name}@${version} is not visible on npm.`);
  }
}

console.log(`All ${publicWorkspaces.length} public workspaces are visible at version ${version}.`);
