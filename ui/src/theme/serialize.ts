import type {
  MiaixzColorMode,
  MiaixzDensity,
  MiaixzResolvedColorMode,
  MiaixzThemeColorOverrides,
} from "@miaixz/sdk/appearance";
import { miaixzThemeColorTokens } from "../tokens/colors.js";
import {
  miaixzThemeDensityGeometryFields,
  miaixzThemeLayoutGeometryFields,
} from "../tokens/geometry.js";
import { miaixzThemeRadiusFields } from "../tokens/radius.js";
import { miaixzThemeShadowLevels } from "../tokens/shadow.js";
import { miaixzThemeSurfaceFields, miaixzThemeSurfaceRoles } from "../tokens/surfaces.js";
import type { MiaixzResolvedThemeDefinition } from "./theme.types.js";
import { mergeThemeColors } from "./resolve.js";

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
   * Complete scoped runtime CSS text.
   */
  readonly cssText: string;
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
 * @returns Immutable complete application payload.
 */
export function serializeThemeApplication(
  theme: Readonly<MiaixzResolvedThemeDefinition>,
  colorMode: MiaixzResolvedColorMode,
  colorPreference: MiaixzColorMode,
  density: MiaixzDensity,
  overrides: MiaixzThemeColorOverrides | undefined,
  instanceId: string,
): Readonly<MiaixzSerializedThemeApplication> {
  if (!/^[a-zA-Z0-9_-]+$/.test(instanceId)) throw new TypeError("Invalid theme instance ID");
  const colors = mergeThemeColors(theme.modes[colorMode].colors, overrides);
  const declarations = [`color-scheme: ${colorMode};`];
  for (const token of miaixzThemeColorTokens) {
    declarations.push(`--miaixz-color-${token}: ${colors[token]};`);
  }
  declarations.push(
    `--miaixz-font-family-sans: ${theme.tokens.typography.familySans};`,
    `--miaixz-font-family-mono: ${theme.tokens.typography.familyMono};`,
  );
  for (const field of miaixzThemeRadiusFields) {
    declarations.push(`--miaixz-radius-${toKebab(field)}: ${theme.tokens.radius[field]}px;`);
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
    const unit = field === "readingWidthCh" ? "ch" : "px";
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
    cssText,
  });
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
