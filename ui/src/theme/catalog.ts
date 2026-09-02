import { miaixzBuiltInThemes } from "../themes/index.js";
import { MiaixzThemeError } from "./errors.js";
import { resolveThemeDefinitions } from "./resolve.js";
import type {
  MiaixzResolvedThemeDefinition,
  MiaixzThemeDefinition,
  MiaixzThemeDescriptor,
} from "./theme.types.js";
import { validateThemeDefinition } from "./validate.js";

const reservedThemeIds = new Set(["miaixz", "neutral", "contrast"]);

/**
 * Maintains one atomic, ordered, instance-local theme catalog.
 */
export class ThemeCatalog {
  #definitions = new Map<string, Readonly<MiaixzThemeDefinition>>();
  #resolved = new Map<string, Readonly<MiaixzResolvedThemeDefinition>>();
  #sources = new Map<string, MiaixzThemeDescriptor["source"]>();
  #descriptors: readonly MiaixzThemeDescriptor[] = Object.freeze([]);

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
   * @returns Whether the theme exists.
   */
  has(name: string): boolean {
    return this.#resolved.has(name);
  }

  /**
   * Returns one complete resolved theme.
   *
   * @param name - Theme identifier.
   * @returns Complete resolved theme.
   * @throws MiaixzThemeError When the theme does not exist.
   */
  get(name: string): Readonly<MiaixzResolvedThemeDefinition> {
    const theme = this.#resolved.get(name);
    if (theme === undefined) throw new MiaixzThemeError("UI_THEME_NOT_FOUND", { theme: name });
    return theme;
  }

  /**
   * Returns immutable descriptors in stable registration order.
   *
   * @returns Ordered frozen descriptors.
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
      if (definitions.has(theme.name) || (!allowReserved && reservedThemeIds.has(theme.name))) {
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
    const descriptors = Object.freeze(
      [...definitions.values()].map((theme) => {
        const complete = resolved.get(theme.name);
        if (complete === undefined) {
          throw new MiaixzThemeError("UI_THEME_NOT_FOUND", { theme: theme.name });
        }
        return Object.freeze({
          name: theme.name,
          label: theme.label,
          version: theme.version,
          source: sources.get(theme.name) ?? "registered",
          preview: Object.freeze({
            light: themePreview(complete, "light"),
            dark: themePreview(complete, "dark"),
          }),
        });
      }),
    );
    this.#definitions = definitions;
    this.#resolved = new Map(resolved);
    this.#sources = sources;
    this.#descriptors = descriptors;
  }
}

/**
 * Selects and freezes the three resolved colors exposed by a descriptor.
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
