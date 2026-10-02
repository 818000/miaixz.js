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
 * Audits the frozen Miaixz package dependency graph and icon ownership boundary.
 */

import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import { extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { getWorkspacePeerRange, readRepositoryVersion } from "../../../miaixz.mjs";

const repositoryRoot = resolve(fileURLToPath(new URL("../../../../../", import.meta.url)));
const release = readRepositoryVersion(repositoryRoot);
const expectedPeerRange = getWorkspacePeerRange(release);
const corePackages = Object.freeze({
  "@miaixz/sdk": "packages/sdk",
  "@miaixz/icons": "packages/icons",
  "@miaixz/ui": "packages/ui",
  "@miaixz/view": "packages/view",
});
const expectedEdges = new Set([
  "@miaixz/ui->@miaixz/sdk",
  "@miaixz/ui->@miaixz/icons",
  "@miaixz/view->@miaixz/icons",
]);
const failures = [];
const manifests = new Map();

/**
 * Recursively collects source files relevant to import analysis.
 *
 * @param {string} directory - Directory to inspect.
 * @returns {Promise<string[]>} Absolute source file paths.
 */
async function collect(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory() ? collect(path) : [path];
    }),
  );
  return nested.flat().filter((path) => [".css", ".ts", ".tsx"].includes(extname(path)));
}

for (const [name, path] of Object.entries(corePackages)) {
  const manifest = JSON.parse(
    await readFile(resolve(repositoryRoot, path, "package.json"), "utf8"),
  );
  manifests.set(name, manifest);
  if (manifest.version !== release) failures.push(`${name} version does not match ${release}`);
}

const ui = manifests.get("@miaixz/ui");
const view = manifests.get("@miaixz/view");
for (const [manifest, dependency] of [
  [ui, "@miaixz/sdk"],
  [ui, "@miaixz/icons"],
  [view, "@miaixz/icons"],
]) {
  if (manifest.peerDependencies?.[dependency] !== expectedPeerRange) {
    failures.push(`${manifest.name} peer range for ${dependency} is incorrect`);
  }
  if (manifest.devDependencies?.[dependency] !== release) {
    failures.push(`${manifest.name} development version for ${dependency} is incorrect`);
  }
}

const actualEdges = new Set();
for (const [name, path] of Object.entries(corePackages)) {
  const sourceRoot = resolve(repositoryRoot, path, "src");
  for (const file of await collect(sourceRoot)) {
    const source = await readFile(file, "utf8");
    const imports = [
      ...source.matchAll(/(?:from\s*|import\s*\(|@import\s+url\()\s*["'](@miaixz\/[a-z-]+)/gu),
    ].map((match) => match[1]);
    for (const imported of imports) {
      if (imported === name) failures.push(`${relative(repositoryRoot, file)} imports itself`);
      if (Object.hasOwn(corePackages, imported)) actualEdges.add(`${name}->${imported}`);
      const declared = {
        ...manifests.get(name).dependencies,
        ...manifests.get(name).peerDependencies,
      };
      if (imported !== name && declared[imported] === undefined) {
        failures.push(`${relative(repositoryRoot, file)} imports undeclared ${imported}`);
      }
    }
    if (/\.\.?\/.*packages\/|@miaixz\/[^"']+\/(?:src|dist)\//u.test(source)) {
      failures.push(`${relative(repositoryRoot, file)} uses a private cross-package path`);
    }
  }
}

if ([...actualEdges].sort().join("\n") !== [...expectedEdges].sort().join("\n")) {
  failures.push(`internal edges differ: ${[...actualEdges].sort().join(", ")}`);
}

if (existsSync(resolve(repositoryRoot, "providers"))) {
  failures.push("the removed top-level providers directory still exists");
}
const rootManifest = JSON.parse(await readFile(resolve(repositoryRoot, "package.json"), "utf8"));
if (rootManifest.workspaces.some((workspace) => workspace.startsWith("providers/"))) {
  failures.push("root workspaces still include a Provider package");
}

for (const path of [
  "packages/ui/src/icons",
  "packages/ui/src/components/icon",
  "packages/ui/src/styles/components/icon.css",
  "packages/ui/src/styles/foundation/icons.css",
]) {
  if (existsSync(resolve(repositoryRoot, path))) failures.push(`legacy UI path remains: ${path}`);
}
if (ui.exports["./icons"] !== undefined || ui.exports["./icons/styles.css"] !== undefined) {
  failures.push("@miaixz/ui still exports an icon subpath");
}
for (const dependency of [
  "lucide-react",
  "@fortawesome/free-regular-svg-icons",
  "@fortawesome/free-solid-svg-icons",
]) {
  if (ui.dependencies?.[dependency] !== undefined)
    failures.push(`@miaixz/ui still depends on ${dependency}`);
}

if (failures.length > 0) {
  process.stderr.write(`${failures.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Dependency audit passed: ${[...actualEdges].sort().join(", ")}\n`);
}
