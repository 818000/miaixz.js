#!/bin/bash

#############################################################################
#                                                                           #
# Copyright (c) 2015-2026 miaixz.org and other contributors.                #
#                                                                           #
# Licensed under the Apache License, Version 2.0 (the "License");           #
# you may not use this file except in compliance with the License.          #
# You may obtain a copy of the License at                                   #
#                                                                           #
#      https://www.apache.org/licenses/LICENSE-2.0                          #
#                                                                           #
# Unless required by applicable law or agreed to in writing, software       #
# distributed under the License is distributed on an "AS IS" BASIS,         #
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  #
# See the License for the specific language governing permissions and       #
# limitations under the License.                                            #
#                                                                           #
#############################################################################

# Updates the shared release version in VERSION and every npm manifest.
# Usage: bash .github/scripts/version.sh <MAJOR.MINOR.PATCH[-PRERELEASE]>

set -euo pipefail

root=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)

if [ -x "${root}/.github/scripts/logo.sh" ]; then
    echo
    "${root}/.github/scripts/logo.sh"
    echo
fi

if [ "$#" -ne 1 ] || [ -z "$1" ]; then
    echo "ERROR: Provide exactly one semantic version." >&2
    exit 1
fi

node --input-type=module - "$root" "$1" <<'NODE'
import { readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.argv[2];
const version = process.argv[3];
const { assertReleaseVersion, getWorkspacePeerRange, loadWorkspaceRepository } = await import(
  pathToFileURL(join(root, ".github/scripts/miaixz.mjs"))
);
assertReleaseVersion(version);

const paths = {
  version: join(root, "VERSION"),
  rootPackage: join(root, "package.json"),
};
const repository = loadWorkspaceRepository(root);
const rootPackage = repository.rootManifest;
const currentVersion = readFileSync(paths.version, "utf8").trim();

if (rootPackage.name !== "miaixz.js") {
  throw new Error("Unexpected root package name; refusing to update versions.");
}

rootPackage.version = version;
const workspaceNames = new Set(repository.workspaces.map(({ name }) => name));
const peerRange = getWorkspacePeerRange(version);
for (const { manifest } of repository.workspaces) {
  manifest.version = version;
  for (const dependencyName of Object.keys(manifest.peerDependencies ?? {})) {
    if (!workspaceNames.has(dependencyName)) continue;
    manifest.peerDependencies[dependencyName] = peerRange;
    manifest.devDependencies ??= {};
    manifest.devDependencies[dependencyName] = version;
  }
  for (const field of ["dependencies", "devDependencies", "optionalDependencies"]) {
    for (const dependencyName of Object.keys(manifest[field] ?? {})) {
      if (workspaceNames.has(dependencyName)) manifest[field][dependencyName] = version;
    }
  }
}

const updates = [
  [paths.version, `${version}\n`],
  [paths.rootPackage, `${JSON.stringify(rootPackage, null, 2)}\n`],
  ...repository.workspaces.map(({ manifest, manifestPath }) => [
    manifestPath,
    `${JSON.stringify(manifest, null, 2)}\n`,
  ]),
];

for (const [path, contents] of updates) {
  writeFileSync(`${path}.tmp`, contents);
}
for (const [path] of updates) {
  renameSync(`${path}.tmp`, path);
}

const verifiedRepository = loadWorkspaceRepository(root);
const verifiedRoot = verifiedRepository.rootManifest;
const expectedPeerRange = getWorkspacePeerRange(version);
const verifiedWorkspaceNames = new Set(
  verifiedRepository.workspaces.map(({ name }) => name),
);
const internalVersionsMatch = verifiedRepository.workspaces.every(({ manifest }) => {
  const peersMatch = Object.entries(manifest.peerDependencies ?? {}).every(
    ([name, range]) =>
      !verifiedWorkspaceNames.has(name) ||
      (range === expectedPeerRange && manifest.devDependencies?.[name] === version),
  );
  const otherDependenciesMatch = [
    "dependencies",
    "devDependencies",
    "optionalDependencies",
  ].every((field) =>
    Object.entries(manifest[field] ?? {}).every(
      ([name, range]) => !verifiedWorkspaceNames.has(name) || range === version,
    ),
  );
  return peersMatch && otherDependenciesMatch;
});
const versionsMatch =
  readFileSync(paths.version, "utf8").trim() === version &&
  verifiedRoot.version === version &&
  verifiedRepository.workspaces.every(({ manifest }) => manifest.version === version) &&
  internalVersionsMatch;

if (!versionsMatch) {
  throw new Error("Version verification failed after writing release metadata.");
}

console.log(`Version: ${currentVersion || "<empty>"} -> ${version}`);
console.log(
  `Updated: VERSION, package.json, ${repository.workspaces
    .map(({ directory }) => `${directory}/package.json`)
    .join(", ")}`,
);
console.log(`Internal workspace peer range: ${expectedPeerRange}`);
NODE
