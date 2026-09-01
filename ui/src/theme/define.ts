import type { MiaixzThemeDefinition } from "./theme.types.js";
import { validateThemeDefinition } from "./validate.js";

/**
 * Validates and deeply freezes one trusted developer-authored theme definition.
 *
 * @param value - Theme definition to validate.
 * @returns Detached immutable theme definition.
 * @public
 */
export function defineTheme(value: MiaixzThemeDefinition): Readonly<MiaixzThemeDefinition> {
  return validateThemeDefinition(value);
}
