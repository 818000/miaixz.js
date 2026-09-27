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
 * Verifies the examples application structure without creating test artifacts.
 */

import { access, readFile, readdir } from "node:fs/promises";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const examplesRoot = resolve(scriptDirectory, "..");
const sourceRoot = join(examplesRoot, "src");
const requiredDirectories = ["app", "module", "shared"];
const requiredPackages = ["@miaixz/icons", "@miaixz/sdk", "@miaixz/ui", "@miaixz/view"];
const forbiddenDirectories = new Set(["test-results", "tests"]);
const ignoredDirectories = new Set(["dist", "node_modules"]);
const sourceExtensions = new Set([".js", ".jsx", ".ts", ".tsx"]);

const packageMetadata = JSON.parse(await readFile(join(examplesRoot, "package.json"), "utf8"));
if (packageMetadata.private !== true || packageMetadata.version !== "0.6.5") {
  throw new Error("The examples package must remain private at version 0.6.5.");
}

for (const directory of requiredDirectories) {
  await access(join(examplesRoot, "src", directory));
}
for (const requiredPackage of requiredPackages) {
  if (typeof packageMetadata.dependencies?.[requiredPackage] !== "string") {
    throw new Error(`The examples package must depend on ${requiredPackage}.`);
  }
}
await access(join(examplesRoot, "index.html"));
await access(join(sourceRoot, "app", "main.tsx"));

const rootEntries = await readdir(examplesRoot);
for (const forbidden of ["tests", "test-results", "package-lock.json", "tsconfig.tsbuildinfo"]) {
  if (rootEntries.includes(forbidden)) {
    throw new Error(`Examples cannot contain ${forbidden}.`);
  }
}

const sourceFiles = [];
await inspectTree(examplesRoot);
for (const sourceFile of sourceFiles) {
  await verifyDependencyBoundary(sourceFile);
}

console.log("Verified the examples structure.");

/**
 * Inspects the source tree for obsolete static files and generated artifacts.
 *
 * @param {string} directory - Directory to inspect recursively.
 * @returns {Promise<void>} Promise settled after every entry is verified.
 */
async function inspectTree(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (ignoredDirectories.has(entry.name)) continue;
      if (forbiddenDirectories.has(entry.name)) {
        throw new Error(`Examples cannot contain ${relative(examplesRoot, entryPath)}.`);
      }
      await inspectTree(entryPath);
      continue;
    }
    if (entry.name.endsWith(".html") && entryPath !== join(examplesRoot, "index.html")) {
      throw new Error(
        `Examples cannot contain nested HTML file ${relative(examplesRoot, entryPath)}.`,
      );
    }
    if (entry.name.endsWith(".tsbuildinfo")) {
      throw new Error(`Examples cannot contain build cache ${relative(examplesRoot, entryPath)}.`);
    }
    if (entryPath.startsWith(`${sourceRoot}${sep}`) && sourceExtensions.has(extname(entry.name))) {
      sourceFiles.push(entryPath);
    }
  }
}

/**
 * Verifies the one-way dependency rules for one example source file.
 *
 * @param {string} sourceFile - Absolute source file path.
 * @returns {Promise<void>} Promise settled after the file boundary is verified.
 */
async function verifyDependencyBoundary(sourceFile) {
  const source = await readFile(sourceFile, "utf8");
  const sourcePath = relative(sourceRoot, sourceFile);
  const segments = sourcePath.split(sep);
  const layer = segments[0];
  const moduleName = layer === "module" ? segments[1] : undefined;
  if (layer !== "app" && /(?:from\s+|import\s*)["']@\/app(?:\/|["'])/.test(source)) {
    throw new Error(`${sourcePath} cannot import the app layer.`);
  }
  if (layer === "shared" && /(?:from\s+|import\s*)["']@\/module(?:\/|["'])/.test(source)) {
    throw new Error(`${sourcePath} cannot import a feature module.`);
  }
  if (moduleName !== undefined) {
    for (const match of source.matchAll(/(?:from\s+|import\s*)["']@\/module\/([^/"']+)/g)) {
      if (match[1] !== moduleName) {
        throw new Error(`${sourcePath} cannot import module ${match[1]}.`);
      }
    }
  }
}
