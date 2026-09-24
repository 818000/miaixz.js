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
 * Generates the viewer's lazy format registry from format-owned descriptions.
 */

import { access, readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";

import { format as formatSource, resolveConfig } from "prettier";

import { repositoryRoot } from "../miaixz.mjs";

const formatsRoot = resolve(repositoryRoot, "view/src/formats");
const outputPath = resolve(repositoryRoot, "view/src/autogen/format-registry.ts");
const checkOnly = process.argv.includes("--check");

/**
 * Reports whether a value is a non-array object.
 *
 * @param value - Unknown value being validated.
 * @returns True when the value is an object record.
 */
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Validates and normalizes one format-owned description.
 *
 * @param directoryName - Canonical format directory name.
 * @param value - Parsed format description.
 * @returns Validated format description.
 */
function validateDescriptor(directoryName, value) {
  if (!isRecord(value)) throw new Error(`${directoryName}/format.json must contain an object`);
  const stringFields = ["id", "label", "category", "implementation", "entry"];
  for (const field of stringFields) {
    if (typeof value[field] !== "string" || value[field] === "") {
      throw new Error(`${directoryName}/format.json has an invalid ${field}`);
    }
  }
  if (value.schemaVersion !== 1) {
    throw new Error(`${directoryName}/format.json must use schemaVersion 1`);
  }
  if (value.id !== directoryName) {
    throw new Error(`${directoryName}/format.json id must match its directory name`);
  }
  if (value.entry !== "./driver.ts") {
    throw new Error(`${directoryName}/format.json entry must be ./driver.ts`);
  }
  if (value.family !== undefined && (typeof value.family !== "string" || value.family === "")) {
    throw new Error(`${directoryName}/format.json has an invalid family`);
  }
  if (value.implementation !== "ready" && value.implementation !== "recognized") {
    throw new Error(`${directoryName}/format.json has an invalid implementation state`);
  }
  for (const field of ["extensions", "mimeTypes"]) {
    if (
      !Array.isArray(value[field]) ||
      value[field].length === 0 ||
      value[field].some((item) => typeof item !== "string" || item === "")
    ) {
      throw new Error(`${directoryName}/format.json has an invalid ${field} list`);
    }
  }
  const extensions = value.extensions.map((extension) => extension.toLowerCase());
  if (extensions.some((extension) => extension.startsWith("."))) {
    throw new Error(`${directoryName}/format.json extensions must omit the leading period`);
  }
  return { ...value, extensions };
}

/**
 * Renders validated descriptions as a deterministic TypeScript registry.
 *
 * @param descriptors - Sorted validated format descriptions.
 * @returns Complete generated TypeScript source.
 */
function renderRegistry(descriptors) {
  const descriptorSource = JSON.stringify(descriptors, null, 2)
    .replaceAll(/^/gmu, "  ")
    .trimStart();
  const extensions = descriptors.flatMap((descriptor) =>
    descriptor.extensions.map((extension) => [extension, descriptor.id]),
  );
  const extensionSource = extensions
    .map(([extension, id]) => `  [${JSON.stringify(extension)}, ${JSON.stringify(id)}],`)
    .join("\n");
  const loaderSource = descriptors
    .map(
      (descriptor) =>
        `  [
    ${JSON.stringify(descriptor.id)},
    /**
     * Loads the ${descriptor.id} format driver.
     *
     * @returns Loaded ${descriptor.id} format driver.
     */
    async () => (await import("../formats/${descriptor.id}/driver.js")).formatDriver,
  ],`,
    )
    .join("\n");
  return `/*
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
 * Provides the generated, read-only format descriptors and lazy loaders.
 */

import type { ViewerDriver } from "../shared/contracts/driver.js";
import type { FormatDescriptor, FormatDriverId } from "../shared/contracts/format.js";

/**
 * Loads one independently installable format driver.
 */
export type FormatLoader = () => Promise<ViewerDriver>;

/**
 * Describes every format module present at generation time.
 */
export const formatDescriptors = ${descriptorSource} as const satisfies readonly FormatDescriptor[];

/**
 * Maps every owned extension to its canonical format identifier.
 */
export const formatIdByExtension = new Map<string, FormatDriverId>([
${extensionSource}
]);

/**
 * Lazily loads only format directories present at generation time.
 */
export const formatLoaders = new Map<FormatDriverId, FormatLoader>([
${loaderSource}
]);
`;
}

const directoryEntries = await readdir(formatsRoot, { withFileTypes: true });
const descriptors = [];
const extensionOwners = new Map();
for (const entry of directoryEntries.toSorted((left, right) =>
  left.name.localeCompare(right.name),
)) {
  if (!entry.isDirectory()) continue;
  const descriptionPath = resolve(formatsRoot, entry.name, "format.json");
  const descriptor = validateDescriptor(
    entry.name,
    JSON.parse(await readFile(descriptionPath, "utf8")),
  );
  await access(resolve(formatsRoot, entry.name, descriptor.entry));
  for (const extension of descriptor.extensions) {
    const owner = extensionOwners.get(extension);
    if (owner !== undefined) {
      throw new Error(`extension ${extension} is owned by both ${owner} and ${descriptor.id}`);
    }
    extensionOwners.set(extension, descriptor.id);
  }
  descriptors.push(descriptor);
}

const prettierOptions = (await resolveConfig(outputPath)) ?? {};
const output = await formatSource(renderRegistry(descriptors), {
  ...prettierOptions,
  parser: "typescript",
});
if (checkOnly) {
  const current = await readFile(outputPath, "utf8").catch(() => "");
  if (current !== output) {
    process.stderr.write("Generated format registry is stale. Run npm run generate:formats.\n");
    process.exitCode = 1;
  }
} else {
  await writeFile(outputPath, output, "utf8");
  process.stdout.write(`Generated ${descriptors.length} format modules.\n`);
}
