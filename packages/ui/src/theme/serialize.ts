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
 * Serializes validated theme values into deterministic CSS token output.
 */

import type {
  MiaixzBaseFontSize,
  MiaixzColorMode,
  MiaixzDensity,
  MiaixzRadiusScale,
  MiaixzResolvedColorMode,
  MiaixzShellLayout,
  MiaixzThemeColorOverrides,
} from "@miaixz/sdk/appearance";
import { miaixzThemeColorTokens } from "../design/colors.js";
import { serializeThemeOpacity } from "../design/opacity.js";
import {
  miaixzDensities,
  miaixzThemeDensityGeometryFields,
  miaixzThemeLayoutGeometryFields,
} from "../design/geometry.js";
import { miaixzThemeRadiusFields } from "../design/radius.js";
import { miaixzThemeShadowLevels } from "../design/shadow.js";
import { miaixzThemeSurfaceFields, miaixzThemeSurfaceRoles } from "../design/surfaces.js";
import { miaixzThemeFontFamilyFields, miaixzThemeTypographyFields } from "../design/typography.js";
import type { MiaixzResolvedThemeDefinition } from "./types.js";
import { mergeThemeColors } from "./resolve.js";

/**
 * Exposes the frozen field order consumed by the build-time CSS generator.
 */
export const miaixzThemeSerializationContract = Object.freeze({
  colors: miaixzThemeColorTokens,
  radius: miaixzThemeRadiusFields,
  shadowLevels: miaixzThemeShadowLevels,
  densities: miaixzDensities,
  densityGeometry: miaixzThemeDensityGeometryFields,
  layoutGeometry: miaixzThemeLayoutGeometryFields,
  surfaceRoles: miaixzThemeSurfaceRoles,
  surfaceFields: miaixzThemeSurfaceFields,
});

/**
 * Describes one complete serialized theme application transaction.
 */
export interface MiaixzSerializedThemeApplication {
  /**
   * Stable runtime instance identifier.
   */
  readonly instanceId: string;
  /**
   * Applied theme identifier.
   */
  readonly theme: string;
  /**
   * Concrete applied color mode.
   */
  readonly colorMode: MiaixzResolvedColorMode;
  /**
   * Persisted light, dark, or system preference.
   */
  readonly colorPreference: MiaixzColorMode;
  /**
   * Applied density branch.
   */
  readonly density: MiaixzDensity;
  /**
   * Resolved application-shell layout.
   */
  readonly shellLayout: MiaixzShellLayout;
  /**
   * Resolved semantic-radius multiplier.
   */
  readonly radiusScale: MiaixzRadiusScale;
  /**
   * Resolved base interface font size in pixels.
   */
  readonly baseFontSize: number;
  /**
   * Registered composition variants applied as target attributes.
   */
  readonly composition: Readonly<
    Required<import("../design/composition.js").MiaixzThemeComposition>
  >;
  /**
   * Complete scoped runtime CSS text.
   */
  readonly cssText: string;
}

/**
 * Supplies user appearance preferences that transform resolved theme tokens.
 */
export interface MiaixzThemeSerializationPreferences {
  /**
   * Overrides the theme's shell layout.
   */
  readonly shellLayout?: MiaixzShellLayout;
  /**
   * Scales semantic radii while leaving circular geometry unchanged.
   */
  readonly radiusScale?: MiaixzRadiusScale;
  /**
   * Scales numeric typography tokens relative to the theme body size.
   */
  readonly baseFontSize?: MiaixzBaseFontSize;
}

/**
 * Serializes a complete theme, mode, density, and override snapshot in fixed token order.
 *
 * @param theme - Complete resolved theme.
 * @param colorMode - Concrete light or dark mode.
 * @param colorPreference - Persisted user color-mode preference.
 * @param density - Active density branch.
 * @param overrides - Optional overrides for the concrete mode.
 * @param instanceId - Sanitized runtime instance identifier.
 * @param preferences - Optional user layout, radius, and typography preferences.
 * @returns Immutable complete application payload.
 */
export function serializeThemeApplication(
  theme: Readonly<MiaixzResolvedThemeDefinition>,
  colorMode: MiaixzResolvedColorMode,
  colorPreference: MiaixzColorMode,
  density: MiaixzDensity,
  overrides: MiaixzThemeColorOverrides | undefined,
  instanceId: string,
  preferences?: Readonly<MiaixzThemeSerializationPreferences>,
): Readonly<MiaixzSerializedThemeApplication> {
  if (!/^[a-zA-Z0-9_-]+$/.test(instanceId)) throw new TypeError("Invalid theme instance ID");
  const shellLayout = preferences?.shellLayout ?? theme.tokens.composition.shellLayout;
  const radiusScale = preferences?.radiusScale ?? 1;
  const baseFontSize = preferences?.baseFontSize ?? theme.tokens.typography.bodySize;
  const declarations = serializeThemeDeclarations(theme, colorMode, overrides, {
    radiusScale,
    baseFontSize,
  });
  for (const field of miaixzThemeDensityGeometryFields) {
    declarations.push(
      `--miaixz-density-${toKebab(field)}: var(--miaixz-geometry-${density}-${toKebab(field)});`,
    );
  }
  const selector = `[data-miaixz-theme-instance="${instanceId}"][data-miaixz-theme="${theme.name}"][data-miaixz-color-mode="${colorMode}"]`;
  const cssText = [
    "@layer miaixz-themes {",
    `  ${selector} {`,
    ...declarations.map((declaration) => `    ${declaration}`),
    "  }",
    "}",
    "",
  ].join("\n");
  return Object.freeze({
    instanceId,
    theme: theme.name,
    colorMode,
    colorPreference,
    density,
    shellLayout,
    radiusScale,
    baseFontSize,
    composition: theme.tokens.composition,
    cssText,
  });
}

/**
 * Resolves the documented CSS unit for one layout geometry field.
 *
 * @param field - Layout geometry field.
 * @returns CSS unit suffix.
 */
function layoutGeometryUnit(field: (typeof miaixzThemeLayoutGeometryFields)[number]): string {
  if (field === "readingWidthCh") return "ch";
  if (field === "entryAsidePercent" || field === "appearanceBlockPositionPercent") return "%";
  return "px";
}

/**
 * Converts a camel-case schema field to its CSS kebab-case suffix.
 *
 * @param value - Schema field name.
 * @returns CSS suffix.
 */
function toKebab(value: string): string {
  return value.replaceAll(/[A-Z]/g, (character) => `-${character.toLowerCase()}`);
}

/**
 * Serializes first-paint declarations without choosing a density or runtime owner.
 *
 * @param theme - Fully resolved definition.
 * @param colorMode - Concrete light or dark mode.
 * @returns Static selector block matching the built-in theme stylesheets.
 */
export function serializeThemeStyles(
  theme: Readonly<MiaixzResolvedThemeDefinition>,
  colorMode: MiaixzResolvedColorMode,
): string {
  return [
    `  [data-miaixz-theme="${theme.name}"][data-miaixz-color-mode="${colorMode}"] {`,
    ...serializeThemeDeclarations(theme, colorMode).map((declaration) => `    ${declaration}`),
    "  }",
  ].join("\n");
}

/**
 * Shares validated token serialization between static and runtime styles.
 *
 * @param theme - Fully resolved definition.
 * @param colorMode - Concrete mode.
 * @param overrides - Optional runtime color overrides.
 * @param transforms - Optional radius and typography transformations.
 * @returns Ordered CSS declarations.
 */
function serializeThemeDeclarations(
  theme: Readonly<MiaixzResolvedThemeDefinition>,
  colorMode: MiaixzResolvedColorMode,
  overrides?: MiaixzThemeColorOverrides,
  transforms?: Readonly<{ radiusScale: number; baseFontSize: number }>,
): string[] {
  const colors = mergeThemeColors(theme.modes[colorMode].colors, overrides);
  const declarations = [`color-scheme: ${colorMode};`];
  for (const token of miaixzThemeColorTokens) {
    declarations.push(`--miaixz-color-${token}: ${colors[token]};`);
  }
  declarations.push(...serializeThemeOpacity(theme.tokens.opacity));
  const familyFields = new Set<string>(miaixzThemeFontFamilyFields);
  const typographyScale =
    transforms === undefined ? 1 : transforms.baseFontSize / theme.tokens.typography.bodySize;
  for (const field of miaixzThemeTypographyFields) {
    const prefix = familyFields.has(field) ? "font-" : "text-";
    const value = theme.tokens.typography[field];
    const serializedValue =
      typeof value === "number" ? roundTokenValue(value * typographyScale) : value;
    declarations.push(
      `--miaixz-${prefix}${toKebab(field)}: ${serializedValue}${typeof value === "number" ? "px" : ""};`,
    );
  }
  const radiusScale = transforms?.radiusScale ?? 1;
  for (const field of miaixzThemeRadiusFields) {
    declarations.push(
      `--miaixz-radius-${toKebab(field)}: ${roundTokenValue(theme.tokens.radius[field] * radiusScale)}px;`,
    );
  }
  for (const level of miaixzThemeShadowLevels) {
    const value = theme.tokens.shadow[level];
    const color = level === "high" || level === "overlay" ? "shadow-strong" : "shadow";
    declarations.push(
      `--miaixz-shadow-${level}: 0 ${value.y}px ${value.blur}px ${value.spread}px var(--miaixz-color-${color});`,
    );
  }
  for (const branch of ["compact", "standard", "comfortable"] as const) {
    for (const field of miaixzThemeDensityGeometryFields) {
      declarations.push(
        `--miaixz-geometry-${branch}-${toKebab(field)}: ${theme.tokens.geometry[branch][field]}px;`,
      );
    }
  }
  for (const field of miaixzThemeLayoutGeometryFields) {
    const unit = layoutGeometryUnit(field);
    declarations.push(
      `--miaixz-layout-${toKebab(field)}: ${theme.tokens.geometry.layout[field]}${unit};`,
    );
  }
  for (const role of miaixzThemeSurfaceRoles) {
    for (const field of miaixzThemeSurfaceFields) {
      declarations.push(
        `--miaixz-surface-role-${role}-${field}: var(--miaixz-color-${theme.tokens.surfaces[role][field]});`,
      );
    }
  }
  return declarations;
}

/**
 * Keeps transformed design tokens deterministic without accumulating floating-point noise.
 *
 * @param value - Computed numeric token.
 * @returns Value rounded to three fractional digits.
 */
function roundTokenValue(value: number): number {
  return Math.round(value * 1000) / 1000;
}
