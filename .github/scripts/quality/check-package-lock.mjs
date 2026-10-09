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
 * Verifies that committed npm locks match workspace and example package metadata.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import {
  loadRepositoryPackageManifests,
  loadWorkspaceRepository,
  repositoryRoot,
} from "../miaixz.mjs";

const root = repositoryRoot;
const { rootManifest } = loadWorkspaceRepository(root);
const packageManifests = loadRepositoryPackageManifests(root);
const failures = [];
const forbiddenLockfiles = new Set(["yarn.lock", "bun.lock", "bun.lockb", "npm-shrinkwrap.json"]);

const rootLockPath = join(root, "package-lock.json");
const examplesManifestPath = join(root, "examples", "package.json");
const examplesLockPath = join(root, "examples", "package-lock.json");
verifyLock(rootLockPath, rootManifest, "root", rootManifest.workspaces);
if (!existsSync(examplesManifestPath)) failures.push("missing examples/package.json");
else {
  const examplesManifest = JSON.parse(readFileSync(examplesManifestPath, "utf8"));
  verifyLock(examplesLockPath, examplesManifest, "examples");
}

for (const file of walk(root)) {
  const path = relative(root, file);
  const name = path.split("/").at(-1);
  if (name !== undefined && forbiddenLockfiles.has(name)) {
    failures.push(`forbidden lockfile: ${path}`);
  }
}

const commandPattern = /\b(?:pnpm|yarn|bun)\s+(?:add|ci|exec|install|run)\b/u;
const scanFiles = [
  ...packageManifests.flatMap(({ manifestPath, rootPath }) => [
    manifestPath,
    join(rootPath, "README.md"),
  ]),
  ...walk(join(root, ".github")).filter((file) => /\.(?:md|ya?ml)$/u.test(file)),
].filter(existsSync);
for (const file of new Set(scanFiles)) {
  const contents = readFileSync(file, "utf8");
  if (commandPattern.test(contents)) failures.push(`non-npm command: ${relative(root, file)}`);
}

const workflowDirectory = join(root, ".github", "workflows");
for (const file of walk(workflowDirectory)) {
  if (!/\.ya?ml$/u.test(file)) continue;
  const path = relative(root, file);
  const contents = readFileSync(file, "utf8");
  if (/\bnpm\s+install\b/u.test(contents)) failures.push(`workflow must use npm ci: ${path}`);
  for (const command of contents.matchAll(/\bnpm\s+(?:--prefix\s+\S+\s+)?ci\b[^\n]*/gu)) {
    if (
      !command[0].includes("--package-lock=true") ||
      !command[0].includes("--ignore-scripts") ||
      !command[0].includes("--legacy-peer-deps")
    ) {
      failures.push(
        `npm ci must explicitly enable the lock and use --ignore-scripts and --legacy-peer-deps: ${path}`,
      );
      break;
    }
  }
}

if (rootManifest.packageManager !== "npm@10.9.3") {
  failures.push("packageManager must be npm@10.9.3");
}

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log("The committed npm lockfiles and reproducible install policy are valid.");
}

/**
 * Verifies one npm v10 lock root against its owning package manifest.
 *
 * @param {string} lockPath Absolute package-lock path.
 * @param {Record<string, unknown>} manifest Owning package manifest.
 * @param {string} label Human-readable graph name.
 * @param {readonly string[] | undefined} workspaces Expected root workspace paths.
 */
function verifyLock(lockPath, manifest, label, workspaces) {
  if (!existsSync(lockPath)) {
    failures.push(`missing ${relative(root, lockPath)}`);
    return;
  }
  let lock;
  try {
    lock = JSON.parse(readFileSync(lockPath, "utf8"));
  } catch {
    failures.push(`invalid JSON: ${relative(root, lockPath)}`);
    return;
  }
  if (lock.lockfileVersion !== 3) failures.push(`${label} lockfileVersion must be 3`);
  const entry = lock.packages?.[""];
  if (entry === undefined || entry.name !== manifest.name || entry.version !== manifest.version) {
    failures.push(`${label} lock root name/version does not match package.json`);
    return;
  }
  for (const field of [
    "dependencies",
    "devDependencies",
    "optionalDependencies",
    "peerDependencies",
  ]) {
    if (JSON.stringify(entry[field] ?? {}) !== JSON.stringify(manifest[field] ?? {})) {
      failures.push(`${label} lock root ${field} does not match package.json`);
    }
  }
  if (JSON.stringify(entry.workspaces ?? []) !== JSON.stringify(workspaces ?? [])) {
    failures.push(`${label} lock workspace list does not match package.json`);
  }
  if (workspaces === undefined) return;
  for (const { manifest: workspaceManifest, rootPath } of packageManifests) {
    const workspacePath = relative(root, rootPath);
    if (!workspaces.includes(workspacePath)) continue;
    const workspaceEntry = lock.packages?.[workspacePath];
    if (
      workspaceEntry === undefined ||
      workspaceEntry.name !== workspaceManifest.name ||
      workspaceEntry.version !== workspaceManifest.version
    ) {
      failures.push(`root lock workspace entry is stale: ${workspacePath}`);
    }
  }
}

/**
 * Recursively lists files while excluding repository metadata and dependency artifacts.
 *
 * @param {string} directory Absolute directory to traverse.
 * @returns {string[]} Absolute file paths below the directory.
 */
function walk(directory) {
  if (!existsSync(directory)) return [];
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if ([".git", "dist", "node_modules"].includes(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(path));
    else files.push(path);
  }
  return files;
}
