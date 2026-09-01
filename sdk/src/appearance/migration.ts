import type { MiaixzStorageMigration } from "../storage/index.js";
import {
  miaixzThemeColorTokens,
  type MiaixzAppearanceSettings,
  type MiaixzColorMode,
  type MiaixzDensity,
  type MiaixzThemeColorOverrides,
  type MiaixzThemeColorToken,
  type MiaixzThemeOverrides,
} from "../types/index.js";
import {
  isMiaixzAppearanceSettings,
  isMiaixzColorMode,
  isMiaixzDensity,
  miaixzDefaultAppearance,
  parseMiaixzAppearanceSettings,
} from "./validation.js";

const miaixzLegacyAppearanceKeys = new Set(["colorMode", "density", "colors"]);
const miaixzThemeColorTokenSet = new Set<string>(miaixzThemeColorTokens);
const miaixzThemeColorPattern = /^#[0-9A-Fa-f]{6}(?:[0-9A-Fa-f]{2})?$/;

/**
 * Migrates an Appearance v1 settings value to the complete v2 contract.
 *
 * Invalid legacy structures or colors use the frozen default snapshot. An already-valid v2
 * snapshot is normalized without changing its serialized field order or values.
 *
 * @param value - Untrusted v1 or v2 settings value.
 * @returns Deeply frozen Appearance Schema v2 settings.
 * @public
 */
export function migrateMiaixzAppearanceV1(value: unknown): MiaixzAppearanceSettings {
  if (isMiaixzAppearanceSettings(value)) return parseMiaixzAppearanceSettings(value);
  const legacy = parseLegacyAppearance(value);
  if (legacy === undefined) return miaixzDefaultAppearance;
  const overrides = createMigratedOverrides(legacy.colorMode, legacy.colors);
  return parseMiaixzAppearanceSettings({
    theme: "miaixz",
    colorMode: legacy.colorMode,
    density: legacy.density,
    ...(overrides === undefined ? {} : { overrides }),
  });
}

/**
 * Defines the built-in continuous storage migration from schema one to schema two.
 *
 * @public
 */
export const miaixzAppearanceMigrationV1ToV2: Readonly<MiaixzStorageMigration> = Object.freeze({
  from: 1,
  to: 2,
  migrate: migrateMiaixzAppearanceV1,
});

/**
 * Describes the private v1 settings shape accepted by the migration boundary.
 */
interface MiaixzLegacyAppearanceSettings {
  /**
   * Legacy color-mode preference.
   */
  readonly colorMode: MiaixzColorMode;
  /**
   * Legacy density preference.
   */
  readonly density: MiaixzDensity;
  /**
   * Legacy single-branch color overrides.
   */
  readonly colors?: MiaixzThemeColorOverrides;
}

/**
 * Strictly parses the previous settings shape without invoking accessors.
 *
 * @param value - Untrusted v1 settings value.
 * @returns Normalized v1 settings, or undefined when any field is invalid.
 */
function parseLegacyAppearance(value: unknown): MiaixzLegacyAppearanceSettings | undefined {
  const record = readPlainDataObject(value);
  if (
    record === undefined ||
    !Object.keys(record).every((key) => miaixzLegacyAppearanceKeys.has(key)) ||
    !Object.hasOwn(record, "colorMode") ||
    !Object.hasOwn(record, "density") ||
    !isMiaixzColorMode(record.colorMode) ||
    !isMiaixzDensity(record.density)
  ) {
    return undefined;
  }
  const colors = Object.hasOwn(record, "colors") ? parseLegacyColors(record.colors) : undefined;
  if (Object.hasOwn(record, "colors") && colors === undefined) return undefined;
  return Object.freeze({
    colorMode: record.colorMode,
    density: record.density,
    ...(colors === undefined ? {} : { colors }),
  });
}

/**
 * Parses and freezes a valid legacy color map.
 *
 * @param value - Untrusted legacy colors.
 * @returns Normalized colors, or undefined when invalid.
 */
function parseLegacyColors(value: unknown): MiaixzThemeColorOverrides | undefined {
  const record = readPlainDataObject(value);
  if (record === undefined) return undefined;
  const normalized: Partial<Record<MiaixzThemeColorToken, string>> = {};
  for (const [token, color] of Object.entries(record)) {
    if (
      !miaixzThemeColorTokenSet.has(token) ||
      typeof color !== "string" ||
      !miaixzThemeColorPattern.test(color)
    ) {
      return undefined;
    }
    normalized[token as MiaixzThemeColorToken] = color.toUpperCase();
  }
  return Object.freeze(normalized);
}

/**
 * Maps one legacy color branch to its frozen v2 mode branches.
 *
 * @param colorMode - Legacy color-mode preference.
 * @param colors - Optional normalized legacy colors.
 * @returns Mode-specific overrides, or undefined when no colors exist.
 */
function createMigratedOverrides(
  colorMode: MiaixzColorMode,
  colors: MiaixzThemeColorOverrides | undefined,
): MiaixzThemeOverrides | undefined {
  if (colors === undefined) return undefined;
  if (colorMode === "light") return Object.freeze({ light: colors });
  if (colorMode === "dark") return Object.freeze({ dark: colors });
  return Object.freeze({ light: colors, dark: colors });
}

/**
 * Reads a plain record without accepting arrays, accessors, symbols, or exotic prototypes.
 *
 * @param value - Runtime value to inspect.
 * @returns Detached plain record, or undefined for an unsafe shape.
 */
function readPlainDataObject(value: unknown): Record<string, unknown> | undefined {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return undefined;
  try {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) return undefined;
    if (Object.getOwnPropertySymbols(value).length > 0) return undefined;
    const descriptors = Object.getOwnPropertyDescriptors(value);
    const record: Record<string, unknown> = {};
    for (const [key, descriptor] of Object.entries(descriptors)) {
      if (!descriptor.enumerable) continue;
      if (!("value" in descriptor)) return undefined;
      record[key] = descriptor.value;
    }
    return record;
  } catch {
    return undefined;
  }
}
