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

import { MiaixzThemeError } from "./error.js";
import { presetBuiltInThemes, presetThemeDescriptors } from "./presets/index.js";
import { resolveThemeDefinitions } from "./resolve.js";
import type {
  MiaixzResolvedThemeDefinition,
  MiaixzThemeDefinition,
  MiaixzThemeDescriptor,
} from "./types.js";
import { validateThemeDefinition } from "./validate.js";

/**
 * Lists synchronously bundled themes in stable catalog order.
 */
export const miaixzBuiltInThemes = presetBuiltInThemes;

const reservedThemeIds = new Set(presetThemeDescriptors.map((theme) => theme.name));

/**
 * Maintains one atomic, ordered, instance-local theme catalog.
 */
export class ThemeCatalog {
  #definitions = new Map<string, Readonly<MiaixzThemeDefinition>>();
  #resolved = new Map<string, Readonly<MiaixzResolvedThemeDefinition>>();
  #sources = new Map<string, MiaixzThemeDescriptor["source"]>();
  #descriptors: readonly MiaixzThemeDescriptor[] = presetThemeDescriptors;

  /**
   * Creates a catalog containing built-ins followed by trusted registered themes.
   *
   * @param themes - Optional application-registered themes.
   */
  constructor(themes: readonly MiaixzThemeDefinition[] = []) {
    this.#registerBatch(miaixzBuiltInThemes, "builtin", true);
    if (themes.length > 0) this.#registerBatch(themes, "registered", false);
  }

  /**
   * Reports whether a resolved theme exists.
   *
   * @param name - Theme identifier.
   * @returns Whether the theme is already resolved.
   */
  has(name: string): boolean {
    return this.#resolved.has(name);
  }

  /**
   * Returns one complete resolved theme.
   *
   * @param name - Theme identifier.
   * @returns Complete resolved theme.
   */
  get(name: string): Readonly<MiaixzResolvedThemeDefinition> {
    const theme = this.#resolved.get(name);
    if (theme === undefined) throw new MiaixzThemeError("UI_THEME_NOT_FOUND", { theme: name });
    return theme;
  }

  /**
   * Returns immutable descriptors in stable catalog order.
   *
   * @returns Ordered frozen descriptors, including unloaded presets.
   */
  descriptors(): readonly MiaixzThemeDescriptor[] {
    return this.#descriptors;
  }

  /**
   * Atomically registers one parsed loader result.
   *
   * @param theme - Validated loaded theme definition.
   */
  registerLoaded(theme: MiaixzThemeDefinition): void {
    this.#registerBatch([theme], "loaded", false);
  }

  /**
   * Resolves and atomically commits one definition batch.
   *
   * @param themes - Candidate definitions.
   * @param source - Descriptor source category.
   * @param allowReserved - Whether built-in reserved identifiers are permitted.
   */
  #registerBatch(
    themes: readonly MiaixzThemeDefinition[],
    source: MiaixzThemeDescriptor["source"],
    allowReserved: boolean,
  ): void {
    const definitions = new Map(this.#definitions);
    const sources = new Map(this.#sources);
    for (const candidate of themes) {
      const theme = validateThemeDefinition(candidate);
      const advertisedPreset = reservedThemeIds.has(theme.name) && !definitions.has(theme.name);
      if (
        definitions.has(theme.name) ||
        (!allowReserved &&
          reservedThemeIds.has(theme.name) &&
          !(source === "loaded" && advertisedPreset))
      ) {
        throw new MiaixzThemeError("UI_THEME_DUPLICATE", { theme: theme.name });
      }
      if (!allowReserved && theme.extends === undefined) {
        throw new MiaixzThemeError("UI_THEME_INHERITANCE_INVALID", {
          theme: theme.name,
          details: { reason: "custom-root" },
        });
      }
      definitions.set(theme.name, theme);
      sources.set(theme.name, source);
    }
    const resolved = resolveThemeDefinitions(definitions);
    const resolvedDescriptors = new Map(
      [...definitions.values()].map((theme) => {
        const complete = resolved.get(theme.name);
        if (complete === undefined) {
          throw new MiaixzThemeError("UI_THEME_NOT_FOUND", { theme: theme.name });
        }
        return [
          theme.name,
          Object.freeze({
            name: theme.name,
            label: theme.label,
            version: theme.version,
            source: sources.get(theme.name) ?? "registered",
            preview: Object.freeze({
              light: themePreview(complete, "light"),
              dark: themePreview(complete, "dark"),
            }),
          }),
        ] as const;
      }),
    );
    const descriptors: MiaixzThemeDescriptor[] = presetThemeDescriptors.map((advertised) => {
      const resolvedDescriptor = resolvedDescriptors.get(advertised.name);
      if (resolvedDescriptor === undefined) return advertised;
      resolvedDescriptors.delete(advertised.name);
      return Object.freeze({
        ...resolvedDescriptor,
        ...(advertised.group === undefined ? {} : { group: advertised.group }),
        source: advertised.source,
      });
    });
    descriptors.push(...resolvedDescriptors.values());
    this.#definitions = definitions;
    this.#resolved = new Map(resolved);
    this.#sources = sources;
    this.#descriptors = Object.freeze(descriptors);
  }
}

/**
 * Selects the resolved colors exposed by one descriptor preview.
 *
 * @param theme - Complete resolved theme.
 * @param mode - Resolved light or dark mode.
 * @returns Frozen preview color subset.
 */
function themePreview(theme: Readonly<MiaixzResolvedThemeDefinition>, mode: "light" | "dark") {
  const colors = theme.modes[mode].colors;
  return Object.freeze({
    brand: colors.brand,
    surface: colors.surface,
    textPrimary: colors["text-primary"],
  });
}
