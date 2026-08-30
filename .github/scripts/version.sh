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

node - "$root" "$1" <<'NODE'
const { readFileSync, renameSync, writeFileSync } = require("node:fs");
const { join } = require("node:path");

const root = process.argv[2];
const version = process.argv[3];
const semver = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-(?:0|[1-9]\d*|[0-9A-Za-z-]*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|[0-9A-Za-z-]*[A-Za-z-][0-9A-Za-z-]*))*)?$/;

if (!semver.test(version)) {
  console.error(`ERROR: '${version}' must be a complete semantic version without build metadata.`);
  process.exit(1);
}

const paths = {
  version: join(root, "VERSION"),
  rootPackage: join(root, "package.json"),
  sdkPackage: join(root, "sdk/package.json"),
  uiPackage: join(root, "ui/package.json"),
};
const readPackage = (path) => JSON.parse(readFileSync(path, "utf8"));
const rootPackage = readPackage(paths.rootPackage);
const sdkPackage = readPackage(paths.sdkPackage);
const uiPackage = readPackage(paths.uiPackage);
const currentVersion = readFileSync(paths.version, "utf8").trim();

if (rootPackage.name !== "miaixz.js") {
  throw new Error("Unexpected root package name; refusing to update versions.");
}
if (sdkPackage.name !== "@miaixz/sdk" || uiPackage.name !== "@miaixz/ui") {
  throw new Error("Both @miaixz/sdk and @miaixz/ui manifests are required.");
}

rootPackage.version = version;
sdkPackage.version = version;
uiPackage.version = version;

uiPackage.peerDependencies ??= {};
uiPackage.devDependencies ??= {};
const nextMajor = Number(version.split(".")[0]) + 1;
uiPackage.peerDependencies["@miaixz/sdk"] = `>=${version} <${nextMajor}.0.0`;
uiPackage.devDependencies["@miaixz/sdk"] = version;

const updates = [
  [paths.version, `${version}\n`],
  [paths.rootPackage, `${JSON.stringify(rootPackage, null, 2)}\n`],
  [paths.sdkPackage, `${JSON.stringify(sdkPackage, null, 2)}\n`],
  [paths.uiPackage, `${JSON.stringify(uiPackage, null, 2)}\n`],
];

for (const [path, contents] of updates) {
  writeFileSync(`${path}.tmp`, contents);
}
for (const [path] of updates) {
  renameSync(`${path}.tmp`, path);
}

const verifiedRoot = readPackage(paths.rootPackage);
const verifiedSdk = readPackage(paths.sdkPackage);
const verifiedUi = readPackage(paths.uiPackage);
const expectedPeerRange = `>=${version} <${nextMajor}.0.0`;
const versionsMatch =
  readFileSync(paths.version, "utf8").trim() === version &&
  verifiedRoot.version === version &&
  verifiedSdk.version === version &&
  verifiedUi.version === version &&
  verifiedUi.peerDependencies?.["@miaixz/sdk"] === expectedPeerRange &&
  verifiedUi.devDependencies?.["@miaixz/sdk"] === version;

if (!versionsMatch) {
  throw new Error("Version verification failed after writing release metadata.");
}

console.log(`Version: ${currentVersion || "<empty>"} -> ${version}`);
console.log("Updated: VERSION, package.json, sdk/package.json, ui/package.json");
console.log(`UI SDK peer range: ${expectedPeerRange}`);
NODE
