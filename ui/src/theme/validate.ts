import { miaixzThemeColorTokens, type MiaixzThemeColorToken } from "../tokens/colors.js";
import {
  miaixzDensities,
  miaixzThemeDensityGeometryFields,
  miaixzThemeDensityGeometryRanges,
  miaixzThemeLayoutGeometryFields,
  miaixzThemeLayoutGeometryRanges,
} from "../tokens/geometry.js";
import { miaixzThemeRadiusFields, miaixzThemeRadiusRange } from "../tokens/radius.js";
import {
  miaixzThemeShadowFields,
  miaixzThemeShadowLevels,
  miaixzThemeShadowRanges,
} from "../tokens/shadow.js";
import { miaixzThemeSurfaceFields, miaixzThemeSurfaceRoles } from "../tokens/surfaces.js";
import { miaixzThemeFontFamilyLength, miaixzThemeTypographyFields } from "../tokens/typography.js";
import { MiaixzThemeError } from "./errors.js";
import type { MiaixzResolvedThemeDefinition, MiaixzThemeDefinition } from "./theme.types.js";

const themeKeys = new Set([
  "schemaVersion",
  "name",
  "label",
  "version",
  "extends",
  "tokens",
  "modes",
]);
const tokenGroupKeys = new Set(["typography", "radius", "shadow", "geometry", "surfaces"]);
const modeKeys = new Set(["light", "dark"]);
const themeModeKeys = new Set(["colors"]);
const geometryKeys = new Set([...miaixzDensities, "layout"]);
const themeIdPattern = /^[a-z][a-z0-9-]{0,63}$/;
const semanticVersionPattern =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
const colorPattern = /^#[0-9A-Fa-f]{6}(?:[0-9A-Fa-f]{2})?$/;
const forbiddenFontPattern = /url\(|var\(|[;{}]/i;
const colorTokenSet = new Set<string>(miaixzThemeColorTokens);
const normalContrastPairs = [
  ["text-primary", "background"],
  ["text-secondary", "background"],
  ["text-muted", "background"],
  ["on-brand", "brand"],
  ["success", "success-soft"],
  ["warning", "warning-soft"],
  ["danger", "danger-soft"],
  ["info", "info-soft"],
] as const satisfies readonly (readonly [MiaixzThemeColorToken, MiaixzThemeColorToken])[];

/**
 * Defines one inclusive numeric validation range.
 */
interface MiaixzNumberRange {
  /**
   * Minimum accepted value.
   */
  readonly min: number;
  /**
   * Maximum accepted value.
   */
  readonly max: number;
}

/**
 * Validates and freezes one standalone trusted or untrusted theme definition.
 *
 * Inheritance resolution and final completeness are deliberately handled by the catalog.
 *
 * @param value - Candidate theme definition.
 * @returns Detached and deeply frozen normalized definition.
 * @throws MiaixzThemeError When any schema field or value is invalid.
 */
export function validateThemeDefinition(value: unknown): Readonly<MiaixzThemeDefinition> {
  const record = readRecord(value, "theme");
  assertOnlyKeys(record, themeKeys, "theme");
  if (record.schemaVersion !== 1) {
    throw new MiaixzThemeError("UI_THEME_SCHEMA_UNSUPPORTED", {
      details: { path: "schemaVersion" },
    });
  }
  if (!isThemeId(record.name)) invalid("name");
  if (!isThemeLabel(record.label)) invalid("label", record.name as string);
  if (typeof record.version !== "string" || !semanticVersionPattern.test(record.version)) {
    invalid("version", record.name as string);
  }
  if (record.extends !== undefined && !isThemeId(record.extends)) {
    invalid("extends", record.name as string);
  }
  const tokens =
    record.tokens === undefined ? undefined : parseTokens(record.tokens, record.name as string);
  const modesRecord = readRecord(record.modes, "modes", record.name as string);
  assertExactKeys(modesRecord, modeKeys, "modes", record.name as string);
  const light = parseMode(modesRecord.light, "modes.light", record.name as string);
  const dark = parseMode(modesRecord.dark, "modes.dark", record.name as string);
  return deepFreeze({
    schemaVersion: 1,
    name: record.name,
    label: record.label,
    version: record.version,
    ...(record.extends === undefined ? {} : { extends: record.extends }),
    ...(tokens === undefined ? {} : { tokens }),
    modes: { light, dark },
  } as MiaixzThemeDefinition);
}

/**
 * Validates completeness, cross-field geometry, surface references, and contrast.
 *
 * @param theme - Fully inherited theme candidate.
 * @returns The same deeply frozen resolved theme.
 * @throws MiaixzThemeError When a required leaf or semantic constraint fails.
 */
export function validateResolvedTheme(
  theme: Readonly<MiaixzResolvedThemeDefinition>,
): Readonly<MiaixzResolvedThemeDefinition> {
  for (const mode of ["light", "dark"] as const) {
    const colors = theme.modes[mode].colors;
    assertCompleteObject(colors, miaixzThemeColorTokens, `modes.${mode}.colors`, theme.name);
    for (const [foreground, background] of normalContrastPairs) {
      assertContrast(
        colors[foreground],
        colors[background],
        4.5,
        theme.name,
        `${mode}.${foreground}/${background}`,
      );
    }
  }
  assertCompleteObject(
    theme.tokens.typography,
    miaixzThemeTypographyFields,
    "tokens.typography",
    theme.name,
  );
  assertCompleteObject(theme.tokens.radius, miaixzThemeRadiusFields, "tokens.radius", theme.name);
  assertCompleteObject(theme.tokens.shadow, miaixzThemeShadowLevels, "tokens.shadow", theme.name);
  for (const level of miaixzThemeShadowLevels) {
    assertCompleteObject(
      theme.tokens.shadow[level],
      miaixzThemeShadowFields,
      `tokens.shadow.${level}`,
      theme.name,
    );
  }
  for (const density of miaixzDensities) {
    assertCompleteObject(
      theme.tokens.geometry[density],
      miaixzThemeDensityGeometryFields,
      `tokens.geometry.${density}`,
      theme.name,
    );
  }
  assertCompleteObject(
    theme.tokens.geometry.layout,
    miaixzThemeLayoutGeometryFields,
    "tokens.geometry.layout",
    theme.name,
  );
  if (theme.tokens.geometry.layout.pageGutterMin > theme.tokens.geometry.layout.pageGutterMax) {
    geometryInvalid(theme.name, "tokens.geometry.layout.pageGutterMin");
  }
  if (
    theme.tokens.geometry.layout.sidebarCompactWidth >= theme.tokens.geometry.layout.sidebarWidth
  ) {
    geometryInvalid(theme.name, "tokens.geometry.layout.sidebarCompactWidth");
  }
  assertCompleteObject(
    theme.tokens.surfaces,
    miaixzThemeSurfaceRoles,
    "tokens.surfaces",
    theme.name,
  );
  for (const role of miaixzThemeSurfaceRoles) {
    const surface = theme.tokens.surfaces[role];
    assertCompleteObject(surface, miaixzThemeSurfaceFields, `tokens.surfaces.${role}`, theme.name);
    for (const token of Object.values(surface)) {
      if (!colorTokenSet.has(token)) surfaceInvalid(theme.name, `tokens.surfaces.${role}`);
    }
    for (const mode of ["light", "dark"] as const) {
      const colors = theme.modes[mode].colors;
      assertContrast(
        colors[surface.foreground],
        colors[surface.background],
        4.5,
        theme.name,
        `${mode}.surface.${role}`,
      );
    }
  }
  return deepFreeze(theme);
}

/**
 * Parses optional theme-level token groups.
 *
 * @param value - Untrusted token-group value.
 * @param theme - Related theme identifier.
 * @returns Frozen normalized token groups.
 */
function parseTokens(value: unknown, theme: string) {
  const record = readRecord(value, "tokens", theme);
  assertOnlyKeys(record, tokenGroupKeys, "tokens", theme);
  return {
    ...(record.typography === undefined
      ? {}
      : { typography: parseTypography(record.typography, theme) }),
    ...(record.radius === undefined ? {} : { radius: parseRadius(record.radius, theme) }),
    ...(record.shadow === undefined ? {} : { shadow: parseShadow(record.shadow, theme) }),
    ...(record.geometry === undefined ? {} : { geometry: parseGeometry(record.geometry, theme) }),
    ...(record.surfaces === undefined ? {} : { surfaces: parseSurfaces(record.surfaces, theme) }),
  };
}

/**
 * Parses one light or dark color layer.
 *
 * @param value - Untrusted mode value.
 * @param path - Diagnostic field path.
 * @param theme - Related theme identifier.
 * @returns Frozen normalized mode.
 */
function parseMode(value: unknown, path: string, theme: string) {
  const record = readRecord(value, path, theme);
  assertOnlyKeys(record, themeModeKeys, path, theme);
  return record.colors === undefined
    ? {}
    : { colors: parseColors(record.colors, `${path}.colors`, theme) };
}

/**
 * Parses one partial normalized color map.
 *
 * @param value - Untrusted colors.
 * @param path - Diagnostic field path.
 * @param theme - Related theme identifier.
 * @returns Frozen uppercase color overrides.
 */
function parseColors(value: unknown, path: string, theme: string) {
  const record = readRecord(value, path, theme);
  const result: Record<string, string> = {};
  for (const [token, color] of Object.entries(record)) {
    if (!colorTokenSet.has(token)) {
      throw new MiaixzThemeError("UI_THEME_TOKEN_UNKNOWN", {
        theme,
        details: { path: `${path}.${token}` },
      });
    }
    if (typeof color !== "string" || !colorPattern.test(color)) invalid(`${path}.${token}`, theme);
    result[token] = color.toUpperCase();
  }
  return result;
}

/**
 * Parses optional theme typography fields.
 *
 * @param value - Untrusted typography value.
 * @param theme - Related theme identifier.
 * @returns Frozen normalized typography.
 */
function parseTypography(value: unknown, theme: string) {
  const record = readRecord(value, "tokens.typography", theme);
  assertOnlyKeys(record, new Set(miaixzThemeTypographyFields), "tokens.typography", theme);
  const result: Record<string, string> = {};
  for (const field of miaixzThemeTypographyFields) {
    const font = record[field];
    if (font === undefined) continue;
    if (
      typeof font !== "string" ||
      [...font].length < miaixzThemeFontFamilyLength.min ||
      [...font].length > miaixzThemeFontFamilyLength.max ||
      forbiddenFontPattern.test(font)
    ) {
      invalid(`tokens.typography.${field}`, theme);
    }
    result[field] = font;
  }
  return result;
}

/**
 * Parses optional theme radius fields.
 *
 * @param value - Untrusted radius value.
 * @param theme - Related theme identifier.
 * @returns Frozen normalized radius.
 */
function parseRadius(value: unknown, theme: string) {
  return parseRangedRecord(
    value,
    miaixzThemeRadiusFields,
    () => miaixzThemeRadiusRange,
    "tokens.radius",
    theme,
    "UI_THEME_INVALID",
  );
}

/**
 * Parses optional structured shadow levels.
 *
 * @param value - Untrusted shadow value.
 * @param theme - Related theme identifier.
 * @returns Frozen normalized shadow levels.
 */
function parseShadow(value: unknown, theme: string) {
  const record = readRecord(value, "tokens.shadow", theme);
  assertOnlyKeys(record, new Set(miaixzThemeShadowLevels), "tokens.shadow", theme);
  const result: Record<string, unknown> = {};
  for (const level of miaixzThemeShadowLevels) {
    if (record[level] === undefined) continue;
    result[level] = parseRangedRecord(
      record[level],
      miaixzThemeShadowFields,
      (field) => miaixzThemeShadowRanges[field],
      `tokens.shadow.${level}`,
      theme,
      "UI_THEME_INVALID",
      true,
    );
  }
  return result;
}

/**
 * Parses optional density and layout geometry branches.
 *
 * @param value - Untrusted geometry value.
 * @param theme - Related theme identifier.
 * @returns Frozen normalized geometry.
 */
function parseGeometry(value: unknown, theme: string) {
  const record = readRecord(value, "tokens.geometry", theme);
  assertOnlyKeys(record, geometryKeys, "tokens.geometry", theme);
  const result: Record<string, unknown> = {};
  for (const density of miaixzDensities) {
    if (record[density] === undefined) continue;
    result[density] = parseRangedRecord(
      record[density],
      miaixzThemeDensityGeometryFields,
      (field) => miaixzThemeDensityGeometryRanges[field],
      `tokens.geometry.${density}`,
      theme,
      "UI_THEME_GEOMETRY_INVALID",
    );
  }
  if (record.layout !== undefined) {
    const layout = parseRangedRecord(
      record.layout,
      miaixzThemeLayoutGeometryFields,
      (field) => miaixzThemeLayoutGeometryRanges[field],
      "tokens.geometry.layout",
      theme,
      "UI_THEME_GEOMETRY_INVALID",
    );
    if (
      layout.pageGutterMin !== undefined &&
      layout.pageGutterMax !== undefined &&
      layout.pageGutterMin > layout.pageGutterMax
    )
      geometryInvalid(theme, "tokens.geometry.layout.pageGutterMin");
    if (
      layout.sidebarCompactWidth !== undefined &&
      layout.sidebarWidth !== undefined &&
      layout.sidebarCompactWidth >= layout.sidebarWidth
    )
      geometryInvalid(theme, "tokens.geometry.layout.sidebarCompactWidth");
    result.layout = layout;
  }
  return result;
}

/**
 * Parses optional semantic surface roles.
 *
 * @param value - Untrusted surface value.
 * @param theme - Related theme identifier.
 * @returns Frozen normalized surfaces.
 */
function parseSurfaces(value: unknown, theme: string) {
  const record = readRecord(value, "tokens.surfaces", theme);
  assertOnlyKeys(record, new Set(miaixzThemeSurfaceRoles), "tokens.surfaces", theme);
  const result: Record<string, unknown> = {};
  for (const role of miaixzThemeSurfaceRoles) {
    if (record[role] === undefined) continue;
    const surface = readRecord(record[role], `tokens.surfaces.${role}`, theme);
    assertOnlyKeys(surface, new Set(miaixzThemeSurfaceFields), `tokens.surfaces.${role}`, theme);
    const normalized: Record<string, MiaixzThemeColorToken> = {};
    for (const field of miaixzThemeSurfaceFields) {
      const token = surface[field];
      if (token === undefined) continue;
      if (typeof token !== "string" || !colorTokenSet.has(token))
        surfaceInvalid(theme, `tokens.surfaces.${role}.${field}`);
      normalized[field] = token as MiaixzThemeColorToken;
    }
    result[role] = normalized;
  }
  return result;
}

/**
 * Parses a numeric object against ordered field-specific ranges.
 *
 * @param value - Untrusted numeric record.
 * @param fields - Allowed field order.
 * @param rangeFor - Range lookup for one field.
 * @param path - Diagnostic field path.
 * @param theme - Related theme identifier.
 * @param code - Error code used for invalid values.
 * @param exact - Whether every field must be present.
 * @returns Normalized numeric record.
 */
function parseRangedRecord<Field extends string>(
  value: unknown,
  fields: readonly Field[],
  rangeFor: (field: Field) => Readonly<MiaixzNumberRange>,
  path: string,
  theme: string,
  code: "UI_THEME_INVALID" | "UI_THEME_GEOMETRY_INVALID",
  exact = false,
): Partial<Record<Field, number>> {
  const record = readRecord(value, path, theme);
  const allowed = new Set<string>(fields);
  assertOnlyKeys(record, allowed, path, theme);
  if (exact) assertExactKeys(record, allowed, path, theme);
  const result: Partial<Record<Field, number>> = {};
  for (const field of fields) {
    const number = record[field];
    if (number === undefined) continue;
    const range = rangeFor(field);
    if (
      typeof number !== "number" ||
      !Number.isFinite(number) ||
      number < range.min ||
      number > range.max
    ) {
      throw new MiaixzThemeError(code, { theme, details: { path: `${path}.${field}` } });
    }
    result[field] = number;
  }
  return result;
}

/**
 * Reads a getter-safe, symbol-free plain data record.
 *
 * @param value - Runtime value to inspect.
 * @param path - Diagnostic field path.
 * @param theme - Optional related theme identifier.
 * @returns Detached plain record.
 */
function readRecord(value: unknown, path: string, theme?: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) invalid(path, theme);
  try {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) invalid(path, theme);
    if (Object.getOwnPropertySymbols(value).length > 0) invalid(path, theme);
    const result: Record<string, unknown> = {};
    for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
      if (!descriptor.enumerable) continue;
      if (!("value" in descriptor) || ["__proto__", "prototype", "constructor"].includes(key))
        invalid(`${path}.${key}`, theme);
      result[key] = descriptor.value;
    }
    return result;
  } catch (error) {
    if (error instanceof MiaixzThemeError) throw error;
    invalid(path, theme);
  }
}

/**
 * Ensures a record contains no unknown fields.
 *
 * @param record - Record to inspect.
 * @param allowed - Allowed fields.
 * @param path - Diagnostic field path.
 * @param theme - Optional related theme identifier.
 */
function assertOnlyKeys(
  record: Readonly<Record<string, unknown>>,
  allowed: ReadonlySet<string>,
  path: string,
  theme?: string,
): void {
  const unknown = Object.keys(record).find((key) => !allowed.has(key));
  if (unknown !== undefined)
    throw new MiaixzThemeError("UI_THEME_TOKEN_UNKNOWN", {
      ...(theme ? { theme } : {}),
      details: { path: `${path}.${unknown}` },
    });
}

/**
 * Ensures a record contains exactly the required fields.
 *
 * @param record - Record to inspect.
 * @param expected - Required fields.
 * @param path - Diagnostic field path.
 * @param theme - Optional related theme identifier.
 */
function assertExactKeys(
  record: Readonly<Record<string, unknown>>,
  expected: ReadonlySet<string>,
  path: string,
  theme?: string,
): void {
  assertOnlyKeys(record, expected, path, theme);
  const missing = [...expected].find((key) => !Object.hasOwn(record, key));
  if (missing !== undefined)
    throw new MiaixzThemeError("UI_THEME_TOKEN_MISSING", {
      ...(theme ? { theme } : {}),
      details: { path: `${path}.${missing}` },
    });
}

/**
 * Ensures a resolved object has every ordered required leaf.
 *
 * @param value - Resolved record.
 * @param fields - Required field names.
 * @param path - Diagnostic field path.
 * @param theme - Related theme identifier.
 */
function assertCompleteObject(
  value: object,
  fields: readonly string[],
  path: string,
  theme: string,
): void {
  const missing = fields.find((field) => !Object.hasOwn(value, field));
  if (missing !== undefined)
    throw new MiaixzThemeError("UI_THEME_TOKEN_MISSING", {
      theme,
      details: { path: `${path}.${missing}` },
    });
}

/**
 * Validates one WCAG contrast pair.
 *
 * @param foreground - Foreground hexadecimal color.
 * @param background - Background hexadecimal color.
 * @param minimum - Minimum accepted ratio.
 * @param theme - Related theme identifier.
 * @param path - Diagnostic pair path.
 */
function assertContrast(
  foreground: string,
  background: string,
  minimum: number,
  theme: string,
  path: string,
): void {
  const ratio = contrastRatio(foreground, background);
  if (ratio < minimum)
    throw new MiaixzThemeError("UI_THEME_CONTRAST_INVALID", {
      theme,
      details: { path, minimum, ratio: Number(ratio.toFixed(2)) },
    });
}

/**
 * Calculates WCAG contrast for two opaque RGB portions.
 *
 * @param foreground - Foreground hexadecimal color.
 * @param background - Background hexadecimal color.
 * @returns Contrast ratio.
 */
function contrastRatio(foreground: string, background: string): number {
  const values = [foreground, background].map((color) => {
    const channels = [1, 3, 5].map((start) => {
      const value = Number.parseInt(color.slice(start, start + 2), 16) / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * (channels[0] ?? 0) + 0.7152 * (channels[1] ?? 0) + 0.0722 * (channels[2] ?? 0);
  });
  const lighter = Math.max(values[0] ?? 0, values[1] ?? 0);
  const darker = Math.min(values[0] ?? 0, values[1] ?? 0);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Determines whether a string follows the stable theme ID contract.
 *
 * @param value - Runtime value.
 * @returns Whether the value is a valid theme ID.
 */
function isThemeId(value: unknown): value is string {
  return typeof value === "string" && themeIdPattern.test(value);
}

/**
 * Determines whether a label satisfies safe Unicode and length rules.
 *
 * @param value - Runtime value.
 * @returns Whether the value is a valid theme label.
 */
function isThemeLabel(value: unknown): value is string {
  const containsForbiddenCharacter =
    typeof value === "string" &&
    [...value].some((character) => {
      const code = character.codePointAt(0) ?? 0;
      return character === "<" || character === ">" || code <= 31 || (code >= 127 && code <= 159);
    });
  return (
    typeof value === "string" &&
    value.trim() === value &&
    [...value].length >= 1 &&
    [...value].length <= 64 &&
    !containsForbiddenCharacter
  );
}

/**
 * Throws a generic invalid-theme error for one path.
 *
 * @param path - Diagnostic field path.
 * @param theme - Optional related theme identifier.
 * @returns Never returns.
 */
function invalid(path: string, theme?: string): never {
  throw new MiaixzThemeError("UI_THEME_INVALID", {
    ...(theme ? { theme } : {}),
    details: { path },
  });
}

/**
 * Throws a geometry-specific theme error.
 *
 * @param theme - Related theme identifier.
 * @param path - Diagnostic field path.
 * @returns Never returns.
 */
function geometryInvalid(theme: string, path: string): never {
  throw new MiaixzThemeError("UI_THEME_GEOMETRY_INVALID", { theme, details: { path } });
}

/**
 * Throws a surface-specific theme error.
 *
 * @param theme - Related theme identifier.
 * @param path - Diagnostic field path.
 * @returns Never returns.
 */
function surfaceInvalid(theme: string, path: string): never {
  throw new MiaixzThemeError("UI_THEME_SURFACE_INVALID", { theme, details: { path } });
}

/**
 * Recursively freezes a validated object graph.
 *
 * @typeParam T - Object type.
 * @param value - Validated object graph.
 * @returns The same deeply frozen graph.
 */
function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const nested of Object.values(value)) deepFreeze(nested);
    Object.freeze(value);
  }
  return value;
}
