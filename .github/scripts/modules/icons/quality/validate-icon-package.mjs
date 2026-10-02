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
 * Validates the font-only Miaixz icon package and repository boundary.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, extname, relative, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { readRepositoryVersion } from "../../../miaixz.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const repositoryRoot = resolve(dirname(scriptPath), "../../../../..");
const release = readRepositoryVersion(repositoryRoot);
const packageRoot = resolve(repositoryRoot, "packages/icons");
const allowedScopes = new Set(["all", "catalog", "package", "structure"]);
const namePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

/**
 * Reads one required JSON document.
 *
 * @param {string} path - Absolute JSON path.
 * @returns {any} Parsed value.
 */
function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

/**
 * Collects relevant source files without entering generated output.
 *
 * @param {string} directory - Source directory.
 * @returns {string[]} Absolute file paths.
 */
function collectSourceFiles(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (["coverage", "dist", "node_modules"].includes(entry.name)) return [];
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(path);
    return [".ts", ".tsx"].includes(extname(path)) ? [path] : [];
  });
}

/**
 * Parses the fixed validation command line.
 *
 * @param {string[]} arguments_ - Command-line arguments.
 * @returns {string} Selected scope.
 */
export function parseArguments(arguments_) {
  if (arguments_.length === 0) return "all";
  if (arguments_.length !== 2 || arguments_[0] !== "--scope") {
    throw new Error(
      "validate-icon-package.mjs accepts only --scope all|catalog|package|structure.",
    );
  }
  const scope = arguments_[1];
  if (!allowedScopes.has(scope)) throw new Error(`Invalid icon validation scope: ${scope}`);
  return scope;
}

/**
 * Requires one condition and records a stable diagnostic.
 *
 * @param {unknown} condition - Condition to test.
 * @param {string} message - Failure text.
 * @param {string[]} failures - Mutable diagnostic list.
 */
function assert(condition, message, failures) {
  if (!condition) failures.push(message);
}

/**
 * Validates exact self-owned catalog and codepoint alignment.
 */
function validateCatalog() {
  const assetsRoot = resolve(packageRoot, "src/assets");
  const catalog = readJson(resolve(assetsRoot, "catalog.json"));
  const plan = readJson(resolve(assetsRoot, "release-plan.json"));
  const codepoints = readJson(resolve(assetsRoot, "fonts/codepoints.json"));
  const failures = [];
  const names = catalog.icons?.map((icon) => icon.name) ?? [];

  assert(catalog.release === release, `Catalog release must be ${release}.`, failures);
  assert(names.length === 1024, "Catalog must contain exactly 1024 icons.", failures);
  assert(new Set(names).size === 1024, "Catalog names must be unique.", failures);
  assert(
    JSON.stringify(names) === JSON.stringify(plan.canonicalNames),
    "Catalog names must equal the canonical release plan.",
    failures,
  );
  assert(
    JSON.stringify(names) === JSON.stringify(codepoints.icons?.map((icon) => icon.name)),
    "Catalog names must equal the codepoint ledger.",
    failures,
  );
  for (const [index, icon] of (catalog.icons ?? []).entries()) {
    const label = `catalog.icons[${String(index)}]`;
    assert(namePattern.test(icon.name), `${label}.name is invalid.`, failures);
    assert(icon.source === "miaixz", `${label}.source must be miaixz.`, failures);
    assert(icon.status === "stable", `${label}.status must be stable.`, failures);
    assert(["core", "extended"].includes(icon.tier), `${label}.tier is invalid.`, failures);
    assert(Array.isArray(icon.aliases), `${label}.aliases must be an array.`, failures);
  }

  const usedNames = new Set();
  for (const sourceRoot of ["packages/ui/src", "packages/view/src"]) {
    for (const file of collectSourceFiles(resolve(repositoryRoot, sourceRoot))) {
      const source = readFileSync(file, "utf8");
      for (const match of source.matchAll(/<Icon\b[^>]*\bname=["']([a-z0-9-]+)["']/gsu)) {
        if (match[1] !== undefined) usedNames.add(match[1]);
      }
      for (const match of source.matchAll(/\bicon:\s*["']([a-z0-9-]+)["']/gu)) {
        if (match[1] !== undefined) usedNames.add(match[1]);
      }
    }
  }
  for (const name of usedNames) {
    assert(names.includes(name), `Core package usage is not a canonical icon: ${name}`, failures);
  }
  if (failures.length > 0) throw new Error(failures.sort().join("\n"));
}

/**
 * Validates that the implementation has no Provider, Registry, or SVG extension surface.
 */
function validateStructure() {
  const failures = [];
  for (const path of ["src/autogen", "src/react", "src/runtime", "src/styles"]) {
    assert(
      existsSync(resolve(packageRoot, path)),
      `Required icon path is missing: ${path}`,
      failures,
    );
  }
  for (const path of [
    "providers",
    "packages/icons/src/provider.ts",
    "packages/icons/src/schema",
    "packages/icons/src/runtime/registry.ts",
    "packages/icons/src/autogen/provider.ts",
    "packages/icons/src/autogen/manifest.ts",
  ]) {
    assert(
      !existsSync(resolve(repositoryRoot, path)),
      `Forbidden icon path remains: ${path}`,
      failures,
    );
  }
  const sourceFiles = collectSourceFiles(resolve(packageRoot, "src"));
  for (const file of sourceFiles) {
    const source = readFileSync(file, "utf8");
    assert(
      !/IconProvider|IconRegistry|SvgIconDefinition|fillTransition|crossfade/u.test(source),
      `Removed extension API remains in ${relative(repositoryRoot, file)}.`,
      failures,
    );
  }
  if (failures.length > 0) throw new Error(failures.sort().join("\n"));
}

/**
 * Validates package metadata and the four-workspace repository boundary.
 */
function validatePackage() {
  const rootManifest = readJson(resolve(repositoryRoot, "package.json"));
  const manifest = readJson(resolve(packageRoot, "package.json"));
  const failures = [];
  assert(manifest.name === "@miaixz/icons", "Core package name is invalid.", failures);
  assert(manifest.version === release, `Core package version must be ${release}.`, failures);
  assert(manifest.exports?.["./provider"] === undefined, "Provider export remains.", failures);
  assert(
    JSON.stringify(rootManifest.workspaces) ===
      JSON.stringify(["packages/sdk", "packages/ui", "packages/view", "packages/icons"]),
    "Root workspaces must contain exactly the four core packages.",
    failures,
  );
  if (failures.length > 0) throw new Error(failures.sort().join("\n"));
}

/**
 * Runs one or all font-only icon validation scopes.
 *
 * @param {string[]} [arguments_] - Command-line arguments.
 * @returns {{packageRoot: string, repositoryRoot: string}} Validated roots.
 */
export function run(arguments_ = process.argv.slice(2)) {
  const scope = parseArguments(arguments_);
  const selected = scope === "all" ? ["structure", "catalog", "package"] : [scope];
  for (const current of selected) {
    if (current === "structure") validateStructure();
    else if (current === "catalog") validateCatalog();
    else validatePackage();
  }
  return Object.freeze({ packageRoot, repositoryRoot });
}

if (resolve(process.argv[1] ?? "") === scriptPath) {
  try {
    run();
    process.stdout.write("Font-only icon validation passed.\n");
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
