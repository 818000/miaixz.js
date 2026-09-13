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

const root = process.cwd();
const failures = [];
const forbiddenLockfiles = new Set([
  "pnpm-lock.yaml",
  "yarn.lock",
  "bun.lock",
  "bun.lockb",
  "npm-shrinkwrap.json",
]);

if (!existsSync(join(root, "package-lock.json"))) {
  failures.push("root package-lock.json is missing");
}

for (const file of walk(root)) {
  const path = relative(root, file);
  const name = path.split("/").at(-1);
  if (name === "package-lock.json" && path !== "package-lock.json") {
    failures.push(`secondary package lock: ${path}`);
  }
  if (name !== undefined && forbiddenLockfiles.has(name)) {
    failures.push(`forbidden lockfile: ${path}`);
  }
}

const commandPattern = /\b(?:pnpm|yarn|bun)\s+(?:add|ci|exec|install|run)\b/u;
const scanFiles = [
  "package.json",
  "sdk/package.json",
  "ui/package.json",
  "README.md",
  "sdk/README.md",
  "ui/README.md",
  ...walk(join(root, ".github"))
    .map((file) => relative(root, file))
    .filter((file) => /\.(?:md|ya?ml)$/u.test(file)),
];
for (const path of scanFiles) {
  const contents = readFileSync(join(root, path), "utf8");
  if (commandPattern.test(contents)) failures.push(`non-npm command: ${path}`);
}

const manifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
if (manifest.packageManager !== "npm@10.9.3") {
  failures.push("packageManager must be npm@10.9.3");
}

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log("The root npm lockfile and npm-only command policy are valid.");
}

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
