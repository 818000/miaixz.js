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

import { assertReleaseVersion, loadWorkspaceRepository } from "../miaixz.mjs";
import { readPackageVisibility } from "./npm-registry.mjs";

const version = process.argv[2]?.trim();
const registry = process.argv[3]?.trim() || "https://registry.npmjs.org/";
if (!version) throw new Error("Usage: check-published-packages.mjs <version> [registry].");
assertReleaseVersion(version);

const { publicWorkspaces } = loadWorkspaceRepository();
const visibility = await readPackageVisibility(publicWorkspaces, version, registry);
const missingPackages = publicWorkspaces
  .filter(({ name }) => !visibility.get(name))
  .map(({ name }) => `${name}@${version}`);
if (missingPackages.length > 0) {
  throw new Error(`Packages are not visible on npm: ${missingPackages.join(", ")}.`);
}

console.log(`All ${publicWorkspaces.length} public workspaces are visible at version ${version}.`);
