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
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, resolve } from "node:path";
import {
  assertReleaseVersion,
  loadWorkspaceRepository,
  sortWorkspacesByDependencies,
} from "../miaixz.mjs";
import { readPackageVisibility } from "./npm-registry.mjs";

const [version, requestedDirectory, requestedRegistry] = process.argv.slice(2);
if (!version || !requestedDirectory) {
  throw new Error("Usage: publish-packages.mjs <version> <package-directory> [registry].");
}
assertReleaseVersion(version);
const packageDirectory = resolve(requestedDirectory);
const registry = requestedRegistry?.trim() || "https://registry.npmjs.org/";
const packageIndex = JSON.parse(
  readFileSync(resolve(packageDirectory, "workspace-packages.json"), "utf8"),
);
if (!Array.isArray(packageIndex.packages)) {
  throw new Error("workspace-packages.json must contain a packages array.");
}

const { publicWorkspaces } = loadWorkspaceRepository();
const orderedWorkspaces = sortWorkspacesByDependencies(publicWorkspaces);
const entriesByName = new Map(packageIndex.packages.map((entry) => [entry.name, entry]));
const expectedNames = new Set(orderedWorkspaces.map(({ name }) => name));
if (
  entriesByName.size !== orderedWorkspaces.length ||
  packageIndex.packages.some((entry) => !expectedNames.has(entry.name))
) {
  throw new Error("Validated package index does not match the public workspace set.");
}

const packages = orderedWorkspaces.map((workspace) => {
  const entry = entriesByName.get(workspace.name);
  if (
    entry?.directory !== workspace.directory ||
    entry.version !== version ||
    typeof entry.tarball !== "string" ||
    basename(entry.tarball) !== entry.tarball
  ) {
    throw new Error(`Invalid validated package entry for ${workspace.name}.`);
  }
  const tarball = resolve(packageDirectory, entry.tarball);
  if (!existsSync(tarball)) throw new Error(`Validated tarball is missing: ${tarball}.`);
  return { name: workspace.name, tarball };
});
const indexedTarballs = new Set(packages.map(({ tarball }) => basename(tarball)));
const actualTarballs = readdirSync(packageDirectory).filter((file) => file.endsWith(".tgz"));
if (
  actualTarballs.length !== indexedTarballs.size ||
  actualTarballs.some((file) => !indexedTarballs.has(file))
) {
  throw new Error("Package directory tarballs do not match workspace-packages.json.");
}

const initialVisibility = await readPackageVisibility(packages, version, registry);
const publishedCount = packages.filter(({ name }) => initialVisibility.get(name)).length;
if (publishedCount > 0 && publishedCount < packages.length) {
  console.log(
    `::warning::Only ${publishedCount} of ${packages.length} packages currently have version ${version}; publishing the missing packages to restore parity`,
  );
}

const distributionTag = version.includes("-") ? "next" : "latest";
for (const { name, tarball } of packages) {
  if (initialVisibility.get(name)) {
    console.log(`${name}@${version} is already present on npm.`);
    continue;
  }
  console.log(`::group::Publish ${name}@${version}`);
  execFileSync(
    "npm",
    [
      "publish",
      tarball,
      "--access",
      "public",
      "--tag",
      distributionTag,
      "--provenance",
      "--registry",
      registry,
    ],
    { stdio: "inherit" },
  );
  console.log("::endgroup::");
}

const propagationTimeout = 15 * 60_000;
const retryDelay = 15_000;
const propagationStartedAt = Date.now();
let attempt = 0;
while (true) {
  attempt += 1;
  let visibility;
  try {
    visibility = await readPackageVisibility(packages, version, registry);
  } catch (error) {
    const elapsedSeconds = Math.round((Date.now() - propagationStartedAt) / 1_000);
    if (Date.now() - propagationStartedAt >= propagationTimeout) throw error;
    console.log(
      `::warning::npm registry visibility check ${attempt} failed after ${elapsedSeconds} seconds: ${error instanceof Error ? error.message : String(error)}`,
    );
    await new Promise((resolveDelay) => setTimeout(resolveDelay, retryDelay));
    continue;
  }
  const missingPackages = packages
    .filter(({ name }) => !visibility.get(name))
    .map(({ name }) => `${name}@${version}`);
  if (missingPackages.length === 0) break;
  const elapsed = Date.now() - propagationStartedAt;
  if (elapsed >= propagationTimeout) {
    throw new Error(
      `npm registry did not expose ${missingPackages.join(", ")} within ${Math.round(propagationTimeout / 60_000)} minutes.`,
    );
  }
  console.log(
    `Waiting for npm registry propagation (${Math.round(elapsed / 1_000)}s elapsed); missing: ${missingPackages.join(", ")}.`,
  );
  await new Promise((resolveDelay) =>
    setTimeout(resolveDelay, Math.min(retryDelay, propagationTimeout - elapsed)),
  );
}

console.log(`Published all packages with version ${version} and dist-tag ${distributionTag}.`);
