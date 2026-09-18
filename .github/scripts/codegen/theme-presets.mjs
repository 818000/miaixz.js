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

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { format, resolveConfig } from "prettier";
import { discoverThemePresets } from "./theme-preset-catalog.mjs";
import { loadWorkspaceRepository, repositoryRoot } from "../miaixz.mjs";

const repository = loadWorkspaceRepository();
const uiWorkspace = repository.workspaces.find(({ name }) => name === "@miaixz/ui");
const sdkWorkspace = repository.workspaces.find(({ name }) => name === "@miaixz/sdk");
if (uiWorkspace === undefined || sdkWorkspace === undefined) {
  throw new Error("Theme preset generation requires the UI and SDK workspaces");
}
const sourceDirectory = resolve(uiWorkspace.rootPath, "src/theme/presets");
const runtimeDirectory = resolve(uiWorkspace.rootPath, "dist");
const sdkRuntimeDirectory = resolve(sdkWorkspace.rootPath, "dist");
const outputPath = resolve(runtimeDirectory, "theme/presets/manifest.js");
const prettierConfiguration = (await resolveConfig(uiWorkspace.manifestPath)) ?? {};
const checkOnly = process.argv.slice(2).includes("--check");
const sourceHeader = (await readFile(resolve(repositoryRoot, ".github/scripts/miaixz.org"), "utf8"))
  .replaceAll("\r\n", "\n")
  .trim();

const records = await discoverThemePresets(sourceDirectory, repositoryRoot);
for (const record of records) {
  const runtimeEntry = resolve(
    runtimeDirectory,
    "theme/presets",
    record.relativeDirectory,
    "index.js",
  );
  const module = await import(pathToFileURL(runtimeEntry).href);
  const definition = module.default;
  if (definition === undefined || typeof definition !== "object") {
    throw new Error(`${record.relativeDirectory}/index.ts must default-export its theme`);
  }
  if (definition.name !== record.metadata.name || definition.label !== record.metadata.label) {
    throw new Error(`${record.relativeDirectory}/preset.json does not match its theme export`);
  }
  record.definition = definition;
}

const { miaixzDefaultAppearance } = await import(
  pathToFileURL(resolve(sdkRuntimeDirectory, "appearance/index.js")).href
);
const fallbackRecord = records.find(
  (record) => record.metadata.name === miaixzDefaultAppearance.theme,
);
if (fallbackRecord === undefined || !fallbackRecord.metadata.builtin) {
  throw new Error("The SDK default theme must identify a discovered built-in preset");
}
if (records[0] !== fallbackRecord) {
  throw new Error("The SDK default theme must be the first preset in catalog order");
}

const { resolveThemeDefinitions } = await import(
  pathToFileURL(resolve(runtimeDirectory, "theme/resolve.js")).href
);
const definitions = new Map(records.map((record) => [record.definition.name, record.definition]));
const resolvedThemes = resolveThemeDefinitions(definitions);
const descriptors = records.map((record) => {
  const resolved = resolvedThemes.get(record.metadata.name);
  if (resolved === undefined) throw new Error(`Unable to resolve ${record.metadata.name}`);
  return {
    name: record.metadata.name,
    label: record.metadata.label,
    version: record.definition.version,
    group: record.metadata.group,
    source: record.metadata.builtin ? "builtin" : "preset",
    preview: {
      light: preview(resolved, "light"),
      dark: preview(resolved, "dark"),
    },
  };
});
const expected = await format(renderManifest(records, descriptors), {
  ...prettierConfiguration,
  parser: "babel",
});
const current = await readFile(outputPath, "utf8").catch(() => undefined);
if (current !== expected) {
  if (checkOnly) process.exitCode = 1;
  else {
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, expected, "utf8");
  }
}

/**
 * Renders the package-runtime preset manifest discovered from the current directory tree.
 *
 * @param {object[]} presetRecords Ordered preset records.
 * @param {object[]} presetDescriptors Resolved public descriptor metadata.
 * @returns {string} JavaScript package artifact.
 */
function renderManifest(presetRecords, presetDescriptors) {
  const builtins = presetRecords.filter((record) => record.metadata.builtin);
  const lazy = presetRecords.filter((record) => !record.metadata.builtin);
  const imports = builtins
    .map((record, index) => `import builtin${index} from "./${record.relativeDirectory}/index.js";`)
    .join("\n");
  const loaders = lazy
    .map(
      (record) =>
        `${JSON.stringify(record.metadata.name)}: async () => (await import("./${record.relativeDirectory}/index.js")).default,`,
    )
    .join("\n");
  return `${sourceHeader}

/**
 * Generated at build time from the preset directories; do not edit.
 */

${imports}

export const presetBuiltInThemes = Object.freeze([
${builtins.map((_, index) => `  builtin${index},`).join("\n")}
]);

export const presetThemeDescriptors = Object.freeze(${JSON.stringify(presetDescriptors, null, 2)});

export const presetThemeImports = Object.freeze({
${loaders}
});
`;
}

/**
 * Selects descriptor preview colors from one resolved mode.
 *
 * @param {object} theme Resolved theme definition.
 * @param {"light" | "dark"} mode Theme mode.
 * @returns {{ brand: string, surface: string, textPrimary: string }} Preview colors.
 */
function preview(theme, mode) {
  const colors = theme.modes[mode].colors;
  return {
    brand: colors.brand,
    surface: colors.surface,
    textPrimary: colors["text-primary"],
  };
}
