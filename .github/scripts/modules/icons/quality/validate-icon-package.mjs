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
 * Enforces the final icon source boundary and published package allowlist.
 */

import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile, readdir, stat } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { promisify } from "node:util";
import { pathToFileURL } from "node:url";

import { readRepositoryVersion } from "../../../miaixz.mjs";
import {
  assetsRoot,
  loadIconSource,
  packageRoot,
  repositoryRoot,
  unicodeRangeFor,
} from "../source.mjs";

const executeFile = promisify(execFile);
const allowedScopes = new Set(["all", "package", "source", "structure"]);

/**
 * Rejects a failed package invariant.
 *
 * @param {unknown} condition Condition to require.
 * @param {string} message Failure message.
 * @returns {asserts condition} Nothing when the condition is satisfied.
 */
function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

/**
 * Lists every file below a root using normalized relative paths.
 *
 * @param {string} root Absolute directory path.
 * @param {string} [base] Original directory used for relative paths.
 * @returns {Promise<string[]>} Sorted relative file paths.
 */
async function listFiles(root, base = root) {
  const result = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const path = resolve(root, entry.name);
    if (entry.isDirectory()) result.push(...(await listFiles(path, base)));
    else result.push(relative(base, path));
  }
  return result.sort();
}

/**
 * Parses the package-validator scope argument.
 *
 * @param {readonly string[]} arguments_ Command-line arguments.
 * @returns {string} Requested validation scope.
 */
export function parseArguments(arguments_) {
  if (arguments_.length === 0) return "all";
  invariant(
    arguments_.length === 2 && arguments_[0] === "--scope",
    "Expected --scope all|source|structure|package.",
  );
  invariant(allowedScopes.has(arguments_[1]), `Invalid icon validation scope: ${arguments_[1]}.`);
  return arguments_[1];
}

/**
 * Validates the complete canonical source graph.
 *
 * @returns {Promise<void>} Completion promise.
 */
async function validateSource() {
  await loadIconSource();
}

/**
 * Validates the exact source directory boundary.
 *
 * @returns {Promise<void>} Completion promise.
 */
async function validateStructure() {
  const rootEntries = (await readdir(assetsRoot)).sort();
  invariant(
    JSON.stringify(rootEntries) ===
      JSON.stringify(["design.json", "fonts", "icons", "icons.json", "schema.json"]),
    `Unexpected source asset set: ${rootEntries.join(", ")}.`,
  );
  invariant(
    !existsSync(resolve(packageRoot, "src/autogen")),
    "src/autogen is retired; generated icon definitions belong in src/values.",
  );
  const generated = (await readdir(resolve(packageRoot, "src/values"))).sort();
  invariant(
    JSON.stringify(generated) === JSON.stringify(["design.ts", "icons.ts", "metadata.ts"]),
    "src/values must contain exactly design.ts, icons.ts and metadata.ts.",
  );
  invariant(
    !existsSync(resolve(packageRoot, "src/catalog.ts")),
    "Catalog must be exported directly from values/metadata; src/catalog.ts is forbidden.",
  );
  const styles = (await readdir(resolve(packageRoot, "src/styles"))).sort();
  invariant(
    JSON.stringify(styles) === JSON.stringify(["index.css"]),
    "src/styles must contain only index.css.",
  );
}

/**
 * Determines whether a compiled file belongs to the public package contract.
 *
 * @param {string} path Dist-relative file path.
 * @returns {boolean} Whether the file is allowed.
 */
export function allowedDistFile(path) {
  return (
    path === "assets/fonts/miaixz-icons.woff2" ||
    path === "styles.css" ||
    /^values\/(?:metadata|design|icons)\.(?:js|js\.map|d\.ts|d\.ts\.map)$/u.test(path) ||
    /^(?:react\/index|runtime\/(?:index|font)|index)\.(?:js|js\.map|d\.ts|d\.ts\.map)$/u.test(path)
  );
}

/**
 * Determines whether a packed file belongs to the published allowlist.
 *
 * @param {string} path Package-relative file path.
 * @returns {boolean} Whether the file is allowed.
 */
function allowedPackedFile(path) {
  return (
    ["LICENSE", "NOTICE", "README.md", "SBOM.spdx.json", "package.json"].includes(path) ||
    (path.startsWith("dist/") && allowedDistFile(path.slice("dist/".length)))
  );
}

/**
 * Validates compiled output and the dry-run package contents.
 *
 * @returns {Promise<void>} Completion promise.
 */
async function validatePackage() {
  const release = readRepositoryVersion(repositoryRoot);
  const manifest = JSON.parse(await readFile(resolve(packageRoot, "package.json"), "utf8"));
  invariant(manifest.name === "@miaixz/icons", "Unexpected icon package name.");
  invariant(manifest.version === release, `Icon package version must be ${release}.`);
  invariant(
    JSON.stringify(Object.keys(manifest.exports)) ===
      JSON.stringify([".", "./catalog", "./styles.css", "./font.woff2"]),
    "Icon package exports must contain exactly root, catalog, styles.css, and font.woff2.",
  );
  for (const [key, filename] of [
    [".", "index"],
    ["./catalog", "values/metadata"],
  ]) {
    invariant(
      JSON.stringify(manifest.exports[key]) ===
        JSON.stringify({ types: `./dist/${filename}.d.ts`, import: `./dist/${filename}.js` }),
      `${key} export is invalid.`,
    );
  }
  invariant(
    manifest.exports["./styles.css"] === "./dist/styles.css",
    "styles.css export is invalid.",
  );
  invariant(
    manifest.exports["./font.woff2"] === "./dist/assets/fonts/miaixz-icons.woff2",
    "font.woff2 export is invalid.",
  );
  const distRoot = resolve(packageRoot, "dist");
  invariant(existsSync(distRoot), "Icon dist directory is missing.");
  const distFiles = await listFiles(distRoot);
  for (const path of distFiles) invariant(allowedDistFile(path), `Unexpected dist file: ${path}.`);
  for (const required of [
    "index.js",
    "index.d.ts",
    ...["icons", "metadata", "design"].flatMap((name) => [
      `values/${name}.js`,
      `values/${name}.d.ts`,
    ]),
    "styles.css",
    "assets/fonts/miaixz-icons.woff2",
  ]) {
    invariant(distFiles.includes(required), `Required dist file is missing: ${required}.`);
  }
  const source = await loadIconSource();
  invariant(
    (await stat(resolve(distRoot, "values/icons.js"))).size <= source.design.limits.runtimeBytes,
    "Icon mapping exceeds its raw byte limit.",
  );
  invariant(
    (await stat(resolve(distRoot, "assets/fonts/miaixz-icons.woff2"))).size <=
      source.design.limits.fontBytes,
    "Published icon font exceeds its byte limit.",
  );
  const css = await readFile(resolve(distRoot, "styles.css"), "utf8");
  invariant(!/@import\b/u.test(css), "Published styles.css contains @import.");
  invariant(
    css.includes('url("./assets/fonts/miaixz-icons.woff2")'),
    "Published font URL is invalid.",
  );
  invariant(
    css.includes(`unicode-range: ${unicodeRangeFor(source.icons)};`),
    "Published Unicode range is invalid.",
  );
  const { stdout } = await executeFile("npm", ["pack", "--dry-run", "--json"], {
    cwd: packageRoot,
    maxBuffer: 10 * 1024 * 1024,
  });
  const pack = JSON.parse(stdout)[0];
  for (const { path } of pack.files)
    invariant(allowedPackedFile(path), `Unexpected packed file: ${path}.`);
}

/**
 * Runs one or all icon-package validations.
 *
 * @param {readonly string[]} [arguments_] Command-line arguments.
 * @returns {Promise<Readonly<{packageRoot: string, repositoryRoot: string}>>} Validated roots.
 */
export async function run(arguments_ = process.argv.slice(2)) {
  const scope = parseArguments(arguments_);
  if (scope === "all" || scope === "source") await validateSource();
  if (scope === "all" || scope === "structure") await validateStructure();
  if (scope === "all" || scope === "package") await validatePackage();
  return Object.freeze({ packageRoot, repositoryRoot });
}

if (
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  await run();
  process.stdout.write("Icon package validation passed.\n");
}
