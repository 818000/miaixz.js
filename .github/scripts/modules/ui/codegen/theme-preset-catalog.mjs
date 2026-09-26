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

import { readdir, readFile, stat } from "node:fs/promises";
import { basename, dirname, relative, resolve, sep } from "node:path";

const themeIdPattern = /^[a-z][a-z0-9-]{0,63}$/;
const groupPattern = /^[a-z][a-z0-9-]{0,63}$/;

/**
 * Discovers and validates every self-contained preset directory.
 *
 * @param {string} presetDirectory Absolute preset root.
 * @param {string} repositoryRoot Absolute repository root for diagnostics.
 * @returns {Promise<object[]>} Ordered preset records derived only from directories on disk.
 */
export async function discoverThemePresets(presetDirectory, repositoryRoot) {
  const manifests = await findManifests(presetDirectory);
  const records = [];
  for (const manifestPath of manifests) {
    const metadata = JSON.parse(await readFile(manifestPath, "utf8"));
    validateMetadata(metadata, manifestPath, repositoryRoot);
    const themeDirectory = dirname(manifestPath);
    if (basename(themeDirectory) !== metadata.name) {
      throw new Error(`${relative(repositoryRoot, manifestPath)} name must match its directory`);
    }
    const sourceEntry = resolve(themeDirectory, "index.ts");
    if (!(await isFile(sourceEntry))) {
      throw new Error(`${relative(repositoryRoot, sourceEntry)} is required`);
    }
    records.push({
      metadata,
      relativeDirectory: relative(presetDirectory, themeDirectory).split(sep).join("/"),
      sourceEntry,
    });
  }
  records.sort((left, right) => left.metadata.order - right.metadata.order);
  assertUnique(records, "name");
  assertUnique(records, "order");
  return records;
}

/**
 * Recursively discovers preset metadata files.
 *
 * @param {string} directory Directory to inspect.
 * @returns {Promise<string[]>} Absolute metadata paths.
 */
async function findManifests(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const entryPath = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await findManifests(entryPath)));
    else if (entry.isFile() && entry.name === "preset.json") files.push(entryPath);
  }
  return files;
}

/**
 * Reports whether a path identifies a regular file.
 *
 * @param {string} path Candidate path.
 * @returns {Promise<boolean>} Whether the path is a file.
 */
async function isFile(path) {
  return stat(path)
    .then((value) => value.isFile())
    .catch(() => false);
}

/**
 * Validates one strict preset metadata record.
 *
 * @param {object} value Parsed metadata.
 * @param {string} path Metadata source path.
 * @param {string} repositoryRoot Absolute repository root for diagnostics.
 * @returns {void}
 */
function validateMetadata(value, path, repositoryRoot) {
  const keys = Object.keys(value).sort().join(",");
  if (
    value === null ||
    typeof value !== "object" ||
    keys !== "builtin,group,label,name,order" ||
    typeof value.name !== "string" ||
    !themeIdPattern.test(value.name) ||
    typeof value.label !== "string" ||
    value.label.length === 0 ||
    typeof value.group !== "string" ||
    !groupPattern.test(value.group) ||
    !Number.isSafeInteger(value.order) ||
    value.order < 0 ||
    typeof value.builtin !== "boolean"
  ) {
    throw new Error(`${relative(repositoryRoot, path)} has invalid preset metadata`);
  }
}

/**
 * Requires one metadata field to be unique across all presets.
 *
 * @param {object[]} records Discovered preset records.
 * @param {string} field Metadata field to compare.
 * @returns {void}
 */
function assertUnique(records, field) {
  const values = records.map((record) => record.metadata[field]);
  if (new Set(values).size !== values.length) {
    throw new Error(`Preset ${field} values must be unique`);
  }
}
