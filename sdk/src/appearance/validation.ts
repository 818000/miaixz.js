import { MiaixzSdkError } from "../api/errors.js";
import { translateMiaixzDefaultMessage } from "../i18n/default-translator.js";
import type { MiaixzTranslator } from "../i18n/index.js";
import {
  miaixzColorModes,
  miaixzDensities,
  miaixzThemeColorTokens,
  type MiaixzAppearanceSettings,
  type MiaixzColorMode,
  type MiaixzDensity,
  type MiaixzThemeColorOverrides,
  type MiaixzThemeColorToken,
  type MiaixzThemeOverrides,
} from "../types/index.js";

const miaixzAppearanceKeys = new Set(["theme", "colorMode", "density", "overrides"]);
const miaixzOverrideModeKeys = new Set(["light", "dark"]);
const miaixzThemeColorTokenSet = new Set<string>(miaixzThemeColorTokens);
const miaixzThemeIdPattern = /^[a-z][a-z0-9-]{0,63}$/;
const miaixzThemeColorPattern = /^#[0-9A-Fa-f]{6}(?:[0-9A-Fa-f]{2})?$/;

/**
 * Defines the default Appearance Schema v2 snapshot.
 *
 * @public
 */
export const miaixzDefaultAppearance: Readonly<MiaixzAppearanceSettings> = Object.freeze({
  theme: "miaixz",
  colorMode: "system",
  density: "standard",
});

/**
 * Determines whether a value is a supported Miaixz color mode.
 *
 * @param value - Value to inspect.
 * @returns Whether the value is a supported color mode.
 * @public
 */
export function isMiaixzColorMode(value: unknown): value is MiaixzColorMode {
  return typeof value === "string" && miaixzColorModes.includes(value as MiaixzColorMode);
}

/**
 * Determines whether a value is a supported Miaixz density.
 *
 * @param value - Value to inspect.
 * @returns Whether the value is a supported density.
 * @public
 */
export function isMiaixzDensity(value: unknown): value is MiaixzDensity {
  return typeof value === "string" && miaixzDensities.includes(value as MiaixzDensity);
}

/**
 * Determines whether a value is a valid theme identifier.
 *
 * @param value - Value to inspect.
 * @returns Whether the value follows the public theme ID contract.
 * @public
 */
export function isMiaixzThemeId(value: unknown): value is string {
  return typeof value === "string" && miaixzThemeIdPattern.test(value);
}

/**
 * Parses, normalizes, validates, and deeply freezes Appearance Schema v2 settings.
 *
 * @param value - Untrusted appearance settings to parse.
 * @returns A deeply frozen settings snapshot with uppercase hexadecimal overrides.
 * @throws MiaixzSdkError When structure, fields, tokens, or colors are invalid.
 * @public
 */
export function parseMiaixzAppearanceSettings(value: unknown): MiaixzAppearanceSettings {
  return parseMiaixzAppearanceSettingsWithTranslator(value, translateMiaixzDefaultMessage);
}

/**
 * Determines whether a value satisfies Appearance Schema v2.
 *
 * @param value - Untrusted appearance settings to inspect.
 * @returns Whether strict parsing succeeds.
 * @public
 */
export function isMiaixzAppearanceSettings(value: unknown): value is MiaixzAppearanceSettings {
  try {
    parseMiaixzAppearanceSettings(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Parses Appearance Schema v2 with the supplied SDK translator.
 *
 * @param value - Untrusted appearance settings.
 * @param translate - Translator used for validation failures.
 * @returns Deeply frozen normalized settings.
 * @throws MiaixzSdkError When validation fails.
 */
export function parseMiaixzAppearanceSettingsWithTranslator(
  value: unknown,
  translate: MiaixzTranslator,
): MiaixzAppearanceSettings {
  const record = readPlainDataObject(value);
  if (
    record === undefined ||
    !hasOnlyKeys(record, miaixzAppearanceKeys) ||
    !Object.hasOwn(record, "theme") ||
    !Object.hasOwn(record, "colorMode") ||
    !Object.hasOwn(record, "density") ||
    !isMiaixzThemeId(record.theme) ||
    !isMiaixzColorMode(record.colorMode) ||
    !isMiaixzDensity(record.density)
  ) {
    throw createAppearanceError(translate);
  }

  const overrides = Object.hasOwn(record, "overrides")
    ? parseThemeOverrides(record.overrides, translate)
    : undefined;
  return Object.freeze({
    theme: record.theme,
    colorMode: record.colorMode,
    density: record.density,
    ...(overrides === undefined ? {} : { overrides }),
  });
}

/**
 * Parses and freezes optional light and dark override branches.
 *
 * @param value - Untrusted overrides value.
 * @param translate - Translator used for validation failures.
 * @returns Frozen overrides, or undefined when omitted.
 * @throws MiaixzSdkError When the structure or a color is invalid.
 */
function parseThemeOverrides(
  value: unknown,
  translate: MiaixzTranslator,
): MiaixzThemeOverrides | undefined {
  if (value === undefined) return undefined;
  const record = readPlainDataObject(value);
  if (record === undefined || !hasOnlyKeys(record, miaixzOverrideModeKeys)) {
    throw createAppearanceError(translate);
  }
  const light = Object.hasOwn(record, "light")
    ? parseColorOverrides(record.light, translate)
    : undefined;
  const dark = Object.hasOwn(record, "dark")
    ? parseColorOverrides(record.dark, translate)
    : undefined;
  return Object.freeze({
    ...(light === undefined ? {} : { light }),
    ...(dark === undefined ? {} : { dark }),
  });
}

/**
 * Parses one color-mode override branch.
 *
 * @param value - Untrusted color map.
 * @param translate - Translator used for validation failures.
 * @returns Frozen normalized color overrides, or undefined when omitted.
 * @throws MiaixzSdkError When a token or color is invalid.
 */
function parseColorOverrides(
  value: unknown,
  translate: MiaixzTranslator,
): MiaixzThemeColorOverrides | undefined {
  if (value === undefined) return undefined;
  const record = readPlainDataObject(value);
  if (record === undefined) throw createAppearanceColorError(translate);
  const normalized: Partial<Record<MiaixzThemeColorToken, string>> = {};
  for (const [token, color] of Object.entries(record)) {
    if (
      !miaixzThemeColorTokenSet.has(token) ||
      typeof color !== "string" ||
      !miaixzThemeColorPattern.test(color)
    ) {
      throw createAppearanceColorError(translate, token);
    }
    normalized[token as MiaixzThemeColorToken] = color.toUpperCase();
  }
  return Object.freeze(normalized);
}

/**
 * Reads a plain data object without invoking accessors or accepting symbols.
 *
 * @param value - Runtime value to inspect.
 * @returns A detached plain record, or undefined for an unsafe shape.
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

/**
 * Determines whether a record contains only permitted enumerable fields.
 *
 * @param record - Record to inspect.
 * @param allowed - Complete allowed field set.
 * @returns Whether every field is permitted.
 */
function hasOnlyKeys(
  record: Readonly<Record<string, unknown>>,
  allowed: ReadonlySet<string>,
): boolean {
  return Object.keys(record).every((key) => allowed.has(key));
}

/**
 * Creates a localized appearance-structure failure.
 *
 * @param translate - Translator used to resolve the public message.
 * @returns Stable SDK validation error.
 */
function createAppearanceError(translate: MiaixzTranslator): MiaixzSdkError {
  return new MiaixzSdkError(translate("sdk.error.appearance.invalid"), {
    code: "APPEARANCE_INVALID",
  });
}

/**
 * Creates a localized appearance-color failure.
 *
 * @param translate - Translator used to resolve the public message.
 * @param token - Optional rejected token name.
 * @returns Stable SDK color-validation error.
 */
function createAppearanceColorError(translate: MiaixzTranslator, token?: string): MiaixzSdkError {
  return new MiaixzSdkError(translate("sdk.error.appearance.colorInvalid"), {
    code: "APPEARANCE_COLOR_INVALID",
    ...(token === undefined ? {} : { details: Object.freeze({ token }) }),
  });
}
