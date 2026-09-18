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

import { dirname, resolve } from "node:path";
import { normalizePath } from "vite";
import { discoverThemePresets } from "./theme-preset-catalog.mjs";
import { loadWorkspaceRepository, repositoryRoot } from "../miaixz.mjs";

const virtualId = "\0miaixz-theme-preset-manifest";

/**
 * Creates the source-mode Vite catalog from the preset directories currently on disk.
 *
 * Published packages use the build-generated dist manifest instead; this virtual module keeps
 * tests and the source browser fixture free of a committed theme-name registry.
 *
 * @returns {object} Vite plugin that supplies the discovered preset manifest in memory.
 */
export function themePresetPlugin() {
  const uiWorkspace = loadWorkspaceRepository().workspaces.find(
    ({ name }) => name === "@miaixz/ui",
  );
  if (uiWorkspace === undefined)
    throw new Error("Theme preset discovery requires the UI workspace");
  const presetDirectory = resolve(uiWorkspace.rootPath, "src/theme/presets");
  const facade = resolve(presetDirectory, "index.ts");
  return {
    name: "miaixz-theme-preset-manifest",
    enforce: "pre",
    /**
     * Replaces only the source preset facade's declaration-backed manifest import.
     *
     * @param {string} source Requested module identifier.
     * @param {string | undefined} importer Importing module identifier.
     * @returns {string | undefined} Virtual identifier for the source facade.
     */
    resolveId(source, importer) {
      if (
        source === "./manifest.js" &&
        importer !== undefined &&
        resolve(dirname(importer.split("?")[0]), source) ===
          resolve(dirname(facade), "manifest.js") &&
        importer.split("?")[0] === facade
      ) {
        return virtualId;
      }
    },
    /**
     * Builds the in-memory source manifest from the directories currently present.
     *
     * @param {string} id Resolved module identifier.
     * @returns {Promise<string | undefined>} Virtual module source when requested.
     */
    async load(id) {
      if (id !== virtualId) return;
      const records = await discoverThemePresets(presetDirectory, repositoryRoot);
      const imports = records
        .map(
          (record, index) =>
            `import preset${index} from ${JSON.stringify(`/@fs/${normalizePath(record.sourceEntry)}`)};`,
        )
        .join("\n");
      const metadata = JSON.stringify(records.map(({ metadata }) => metadata));
      const builtins = records
        .map((record, index) => (record.metadata.builtin ? `preset${index}` : undefined))
        .filter(Boolean)
        .join(", ");
      const loaders = records
        .map((record, index) =>
          record.metadata.builtin
            ? undefined
            : `${JSON.stringify(record.metadata.name)}: async () => preset${index}`,
        )
        .filter(Boolean)
        .join(",\n");
      return `${imports}
import { resolveThemeDefinitions } from ${JSON.stringify(`/@fs/${normalizePath(resolve(uiWorkspace.rootPath, "src/theme/resolve.ts"))}`)};

const themes = [${records.map((_, index) => `preset${index}`).join(", ")}];
const metadata = ${metadata};
const resolved = resolveThemeDefinitions(new Map(themes.map((theme) => [theme.name, theme])));
const preview = (theme, mode) => ({
  brand: theme.modes[mode].colors.brand,
  surface: theme.modes[mode].colors.surface,
  textPrimary: theme.modes[mode].colors["text-primary"],
});

export const presetBuiltInThemes = Object.freeze([${builtins}]);
export const presetThemeDescriptors = Object.freeze(metadata.map((entry) => {
  const theme = themes.find((candidate) => candidate.name === entry.name);
  const complete = resolved.get(entry.name);
  if (theme === undefined || complete === undefined) throw new Error("Invalid discovered theme " + entry.name);
  return Object.freeze({
    name: entry.name,
    label: entry.label,
    version: theme.version,
    group: entry.group,
    source: entry.builtin ? "builtin" : "preset",
    preview: Object.freeze({ light: preview(complete, "light"), dark: preview(complete, "dark") }),
  });
}));
export const presetThemeImports = Object.freeze({${loaders}});
`;
    },
  };
}
