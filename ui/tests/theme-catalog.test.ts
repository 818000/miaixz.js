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

import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  createThemeStyles,
  loadThemePreset,
  loadThemePresets,
  themePresets,
} from "../src/theme/index.js";

interface PresetMetadata {
  readonly name: string;
  readonly label: string;
  readonly group: string;
  readonly order: number;
  readonly builtin: boolean;
}

const presetDirectory = resolve("src/theme/presets");
const presetMetadata = readdirSync(presetDirectory, { recursive: true })
  .filter((entry) => entry.toString().endsWith("preset.json"))
  .map(
    (entry) =>
      JSON.parse(
        readFileSync(resolve(presetDirectory, entry.toString()), "utf8"),
      ) as PresetMetadata,
  )
  .sort((left, right) => left.order - right.order);
const lazyPresetMetadata = presetMetadata.filter(({ builtin }) => !builtin);

describe("optional theme catalog", () => {
  it("publishes all preset descriptors in one stable generated catalog", () => {
    expect(
      themePresets.map(({ name, label, group, source }) => ({ name, label, group, source })),
    ).toEqual(
      presetMetadata.map(({ name, label, group, builtin }) => ({
        name,
        label,
        group,
        source: builtin ? "builtin" : "preset",
      })),
    );
    expect(new Set(themePresets.map((theme) => theme.name)).size).toBe(presetMetadata.length);
  });

  it("loads and serializes every lazy preset for both color modes", async () => {
    const themes = await loadThemePresets();
    const styles = createThemeStyles(themes);
    for (const theme of themes) {
      expect(styles).toContain(
        `[data-miaixz-theme="${theme.name}"][data-miaixz-color-mode="light"]`,
      );
      expect(styles).toContain(
        `[data-miaixz-theme="${theme.name}"][data-miaixz-color-mode="dark"]`,
      );
    }
  });

  it("loads a preset through its generated dynamic import", async () => {
    const preset = lazyPresetMetadata[0];
    expect(preset).toBeDefined();
    const theme = await loadThemePreset(preset!.name, { signal: new AbortController().signal });
    expect(theme).toMatchObject({ name: preset!.name, label: preset!.label });
  });
});
