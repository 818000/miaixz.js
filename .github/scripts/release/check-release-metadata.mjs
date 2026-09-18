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

import { readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { getWorkspacePeerRange, loadWorkspaceRepository } from "../miaixz.mjs";

const requestedVersion = process.argv[2]?.trim();
const repository = loadWorkspaceRepository();
const version = readFileSync(join(repository.root, "VERSION"), "utf8").trim();
if (requestedVersion && requestedVersion !== version) {
  throw new Error(`Requested version '${requestedVersion}' does not match VERSION '${version}'.`);
}

const manifests = [
  ["package.json", repository.rootManifest],
  ...repository.workspaces.map(({ manifest, manifestPath }) => [
    relative(repository.root, manifestPath),
    manifest,
  ]),
];

if (repository.rootManifest.name !== "miaixz.js") {
  throw new Error("The root package must be named 'miaixz.js'.");
}
for (const [path, manifest] of manifests) {
  if (manifest.version !== version) {
    throw new Error(`${path} version '${manifest.version ?? ""}' does not match '${version}'.`);
  }
  if (manifest.miaixzUiContract !== undefined && manifest.miaixzUiContract?.version !== version) {
    throw new Error(
      `${path} miaixzUiContract version '${manifest.miaixzUiContract?.version ?? ""}' does not match '${version}'.`,
    );
  }
}

if (repository.rootManifest.private !== true) {
  throw new Error("The workspace root must be private.");
}

const workspaceNames = new Set(repository.workspaces.map(({ name }) => name));
const expectedPeerRange = getWorkspacePeerRange(version);
for (const { directory, manifest } of repository.workspaces) {
  for (const dependencyName of Object.keys(manifest.peerDependencies ?? {})) {
    if (!workspaceNames.has(dependencyName)) continue;
    if (manifest.peerDependencies[dependencyName] !== expectedPeerRange) {
      throw new Error(
        `${directory} peer range for ${dependencyName} must be '${expectedPeerRange}'.`,
      );
    }
    if (manifest.devDependencies?.[dependencyName] !== version) {
      throw new Error(
        `${directory} development version for ${dependencyName} must be '${version}'.`,
      );
    }
  }
  for (const field of ["dependencies", "devDependencies", "optionalDependencies"]) {
    for (const [dependencyName, dependencyVersion] of Object.entries(manifest[field] ?? {})) {
      if (workspaceNames.has(dependencyName) && dependencyVersion !== version) {
        throw new Error(
          `${directory} ${field} version for ${dependencyName} must be '${version}'.`,
        );
      }
    }
  }
}

for (const { directory, manifest } of repository.publicWorkspaces) {
  const path = `${directory}/package.json`;
  if (
    manifest.private === true ||
    manifest.publishConfig?.access !== "public" ||
    manifest.publishConfig?.registry !== "https://registry.npmjs.org/"
  ) {
    throw new Error(`${path} must be a public package published through the public npm registry.`);
  }
}

console.log(
  `Release metadata is valid for ${version} across ${repository.workspaces.length} workspaces.`,
);
