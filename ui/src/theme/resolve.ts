import type { MiaixzThemeColorOverrides } from "@miaixz/sdk/appearance";
import type { MiaixzThemeColors } from "../tokens/colors.js";
import { miaixzThemeCompositionDefaults } from "../tokens/composition.js";
import { miaixzThemeLayoutGeometryDefaults } from "../tokens/geometry.js";
import { miaixzThemeOpacityDefaults } from "../tokens/opacity.js";
import { miaixzThemeTypographyDefaults } from "../tokens/typography.js";
import { MiaixzThemeError } from "./errors.js";
import type { MiaixzResolvedThemeDefinition, MiaixzThemeDefinition } from "./theme.types.js";
import { validateResolvedTheme } from "./validate.js";

const maximumThemeInheritanceDepth = 8;

/**
 * Resolves every theme definition through a deterministic inherited deep merge.
 *
 * @param definitions - Validated theme definitions keyed by ID.
 * @returns Complete immutable themes keyed by ID.
 * @throws MiaixzThemeError When a parent is missing, a cycle exists, depth exceeds eight, or the result is incomplete.
 */
export function resolveThemeDefinitions(
  definitions: ReadonlyMap<string, Readonly<MiaixzThemeDefinition>>,
): ReadonlyMap<string, Readonly<MiaixzResolvedThemeDefinition>> {
  const resolved = new Map<string, Readonly<MiaixzResolvedThemeDefinition>>();
  const visiting: string[] = [];

  const resolveOne = (name: string): Readonly<MiaixzResolvedThemeDefinition> => {
    const existing = resolved.get(name);
    if (existing !== undefined) return existing;
    const definition = definitions.get(name);
    if (definition === undefined) inheritanceInvalid(name, "parent-missing");
    if (visiting.includes(name)) inheritanceInvalid(name, "cycle");
    if (visiting.length >= maximumThemeInheritanceDepth) inheritanceInvalid(name, "depth");
    visiting.push(name);
    try {
      const merged =
        definition.extends === undefined
          ? applyThemeTokenDefaults(definition)
          : mergeTheme(resolveOne(definition.extends), definition);
      const candidate = {
        schemaVersion: 1,
        name: definition.name,
        label: definition.label,
        version: definition.version,
        tokens: merged.tokens,
        modes: merged.modes,
      } as MiaixzResolvedThemeDefinition;
      const complete = validateResolvedTheme(candidate);
      resolved.set(name, complete);
      return complete;
    } finally {
      visiting.pop();
    }
  };

  for (const name of definitions.keys()) resolveOne(name);
  return resolved;
}

/**
 * Completes geometry fields added to schema version one after its initial release.
 *
 * @param definition - Validated root theme definition.
 * @returns Theme definition with new layout defaults merged before validation.
 */
function applyThemeTokenDefaults(
  definition: Readonly<MiaixzThemeDefinition>,
): Readonly<MiaixzThemeDefinition> {
  const geometry = definition.tokens?.geometry;
  const typography = definition.tokens?.typography;
  const composition = definition.tokens?.composition;
  const opacity = definition.tokens?.opacity;
  if (
    geometry === undefined &&
    typography === undefined &&
    composition === undefined &&
    opacity === undefined
  ) {
    return definition;
  }
  return {
    ...definition,
    tokens: {
      ...definition.tokens,
      opacity: { ...miaixzThemeOpacityDefaults, ...opacity },
      composition: { ...miaixzThemeCompositionDefaults, ...composition },
      ...(typography === undefined
        ? {}
        : { typography: { ...miaixzThemeTypographyDefaults, ...typography } }),
      ...(geometry === undefined
        ? {}
        : {
            geometry: {
              ...geometry,
              layout: {
                ...miaixzThemeLayoutGeometryDefaults,
                ...geometry.layout,
              },
            },
          }),
    },
  };
}

/**
 * Merges one mode-specific color override over a complete color map.
 *
 * @param colors - Complete resolved theme colors.
 * @param overrides - Optional user overrides for the same mode.
 * @returns Frozen complete merged colors.
 */
export function mergeThemeColors(
  colors: MiaixzThemeColors,
  overrides?: MiaixzThemeColorOverrides,
): MiaixzThemeColors {
  return Object.freeze({ ...colors, ...overrides });
}

/**
 * Deeply merges one inherited child definition over a complete parent.
 *
 * @param parent - Complete resolved parent theme.
 * @param child - Validated partial child theme.
 * @returns Merged theme data retaining the child's identity.
 */
function mergeTheme(
  parent: Readonly<MiaixzResolvedThemeDefinition>,
  child: Readonly<MiaixzThemeDefinition>,
): Readonly<MiaixzThemeDefinition> {
  return {
    schemaVersion: 1,
    name: child.name,
    label: child.label,
    version: child.version,
    tokens: mergeObject(parent.tokens, child.tokens),
    modes: {
      light: { colors: mergeObject(parent.modes.light.colors, child.modes.light.colors) },
      dark: { colors: mergeObject(parent.modes.dark.colors, child.modes.dark.colors) },
    },
  };
}

/**
 * Recursively merges plain object leaves without array or deletion semantics.
 *
 * @param parent - Complete parent object.
 * @param child - Optional partial child object.
 * @returns Detached recursively merged object.
 */
function mergeObject<T extends object>(parent: T, child: object | undefined): T {
  if (child === undefined) {
    const clone: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(parent)) clone[key] = cloneValue(value);
    return clone as T;
  }
  const result: Record<string, unknown> = {};
  for (const [key, parentValue] of Object.entries(parent)) {
    const childValue = Object.hasOwn(child, key)
      ? (child as Record<string, unknown>)[key]
      : undefined;
    if (isMergeObject(parentValue) && isMergeObject(childValue)) {
      result[key] = mergeObject(parentValue, childValue);
    } else {
      result[key] = childValue === undefined ? cloneValue(parentValue) : cloneValue(childValue);
    }
  }
  for (const [key, childValue] of Object.entries(child)) {
    if (Object.hasOwn(result, key)) continue;
    if (childValue === undefined || childValue === null || Array.isArray(childValue)) {
      inheritanceInvalid("unknown", "delete-or-array");
    }
    result[key] = cloneValue(childValue);
  }
  return result as T;
}

/**
 * Clones a supported validated theme value.
 *
 * @param value - Scalar or plain object value.
 * @returns Detached clone.
 */
function cloneValue<T>(value: T): T {
  return isMergeObject(value) ? cloneObject(value) : value;
}

/**
 * Recursively clones a plain object.
 *
 * @param value - Plain object to clone.
 * @returns Detached clone.
 */
function cloneObject<T extends object>(value: T): T {
  return mergeObject(value, undefined);
}

/**
 * Determines whether a value may participate in theme deep merge.
 *
 * @param value - Runtime value.
 * @returns Whether the value is a non-array object.
 */
function isMergeObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * Throws a stable inheritance error.
 *
 * @param theme - Related theme identifier.
 * @param reason - Safe failure category.
 * @returns Never returns.
 */
function inheritanceInvalid(theme: string, reason: string): never {
  throw new MiaixzThemeError("UI_THEME_INHERITANCE_INVALID", {
    theme,
    details: { reason },
  });
}
