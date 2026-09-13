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
import { getSdkPeerRange } from "../version.mjs";

const requestedVersion = process.argv[2]?.trim();
const version = readFileSync("VERSION", "utf8").trim();
if (requestedVersion && requestedVersion !== version) {
  throw new Error(`Requested version '${requestedVersion}' does not match VERSION '${version}'.`);
}

const manifests = [
  ["package.json", JSON.parse(readFileSync("package.json", "utf8")), "miaixz.js"],
  ["sdk/package.json", JSON.parse(readFileSync("sdk/package.json", "utf8")), "@miaixz/sdk"],
  ["ui/package.json", JSON.parse(readFileSync("ui/package.json", "utf8")), "@miaixz/ui"],
];

for (const [path, manifest, expectedName] of manifests) {
  if (manifest.name !== expectedName) {
    throw new Error(`${path} must be named '${expectedName}'.`);
  }
  if (manifest.version !== version) {
    throw new Error(`${path} version '${manifest.version ?? ""}' does not match '${version}'.`);
  }
}

const [, root] = manifests[0];
const [, sdk] = manifests[1];
const [, ui] = manifests[2];
if (
  root.private !== true ||
  !root.workspaces?.includes("sdk") ||
  !root.workspaces?.includes("ui")
) {
  throw new Error("The private workspace root must contain sdk and ui.");
}
if (ui.peerDependencies?.["@miaixz/sdk"] !== getSdkPeerRange(version)) {
  throw new Error(`ui @miaixz/sdk peer range must be '${getSdkPeerRange(version)}'.`);
}
if (ui.devDependencies?.["@miaixz/sdk"] !== version) {
  throw new Error(`ui @miaixz/sdk development version must be '${version}'.`);
}
for (const [path, manifest] of [
  ["sdk/package.json", sdk],
  ["ui/package.json", ui],
]) {
  if (
    manifest.private === true ||
    manifest.publishConfig?.access !== "public" ||
    manifest.publishConfig?.registry !== "https://registry.npmjs.org/"
  ) {
    throw new Error(`${path} must be a public package published through the public npm registry.`);
  }
}

console.log(`Release metadata is valid for ${version}.`);
