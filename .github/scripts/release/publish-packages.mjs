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

/**
 * Reads the target version currently published for one workspace package.
 *
 * @param {string} name npm package name.
 * @returns {string | undefined} Published version, or undefined when the version is absent.
 */
function readPublishedVersion(name) {
  try {
    return execFileSync(
      "npm",
      [
        "view",
        `${name}@${version}`,
        "version",
        "--json",
        "--prefer-online",
        "--registry",
        registry,
      ],
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    )
      .replaceAll(/["\s]/gu, "")
      .trim();
  } catch {
    return undefined;
  }
}

const publishedCount = packages.filter(({ name }) => readPublishedVersion(name) === version).length;
if (publishedCount > 0 && publishedCount < packages.length) {
  console.log(
    `::warning::Only ${publishedCount} of ${packages.length} packages currently have version ${version}; publishing the missing packages to restore parity`,
  );
}

const distributionTag = version.includes("-") ? "next" : "latest";
for (const { name, tarball } of packages) {
  if (readPublishedVersion(name) === version) {
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

const maximumAttempts = 18;
const retryDelay = 10_000;
let published = false;
for (let attempt = 1; attempt <= maximumAttempts; attempt += 1) {
  if (packages.every(({ name }) => readPublishedVersion(name) === version)) {
    published = true;
    break;
  }
  if (attempt < maximumAttempts) {
    console.log(`Waiting for npm registry propagation (${attempt}/${maximumAttempts}).`);
    await new Promise((resolveDelay) => setTimeout(resolveDelay, retryDelay));
  }
}
if (!published) {
  throw new Error(
    `npm does not report all packages at version ${version} after ${((maximumAttempts - 1) * retryDelay) / 1_000} seconds.`,
  );
}

console.log(`Published all packages with version ${version} and dist-tag ${distributionTag}.`);
