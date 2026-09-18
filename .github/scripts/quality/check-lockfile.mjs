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

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { loadWorkspaceRepository, repositoryRoot } from "../miaixz.mjs";

const root = repositoryRoot;
const { rootManifest, workspaces } = loadWorkspaceRepository(root);
const failures = [];
const forbiddenLockfiles = new Set([
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  "bun.lock",
  "bun.lockb",
  "npm-shrinkwrap.json",
]);

for (const file of walk(root)) {
  const path = relative(root, file);
  const name = path.split("/").at(-1);
  if (name !== undefined && forbiddenLockfiles.has(name)) {
    failures.push(`forbidden lockfile: ${path}`);
  }
}

const commandPattern = /\b(?:pnpm|yarn|bun)\s+(?:add|ci|exec|install|run)\b/u;
const scanFiles = [
  "package.json",
  "README.md",
  ...workspaces.flatMap(({ directory }) => [`${directory}/package.json`, `${directory}/README.md`]),
  ...walk(join(root, ".github"))
    .map((file) => relative(root, file))
    .filter((file) => /\.(?:md|ya?ml)$/u.test(file)),
];
for (const path of scanFiles) {
  const contents = readFileSync(join(root, path), "utf8");
  if (commandPattern.test(contents)) failures.push(`non-npm command: ${path}`);
}

const workflowDirectory = join(root, ".github", "workflows");
for (const file of walk(workflowDirectory)) {
  if (!/\.ya?ml$/u.test(file)) continue;
  const path = relative(root, file);
  const contents = readFileSync(file, "utf8");
  if (/\bnpm\s+ci\b/u.test(contents)) {
    failures.push(`npm ci requires a forbidden lockfile: ${path}`);
  }
  for (const command of contents.matchAll(/\bnpm\s+install\b[^\n]*/gu)) {
    if (!command[0].includes("--no-package-lock") || !command[0].includes("--legacy-peer-deps")) {
      failures.push(`npm install must use --no-package-lock and --legacy-peer-deps: ${path}`);
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
  console.log("The lockfile-free npm-only command policy is valid.");
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
