import type { MiaixzThemeDefinition } from "./theme.types.js";
import { validateThemeDefinition } from "./validate.js";

/**
 * Strictly parses untrusted JSON-like theme data without invoking accessors or code.
 *
 * @param value - Untrusted theme value.
 * @returns Detached immutable theme definition.
 * @public
 */
export function parseTheme(value: unknown): Readonly<MiaixzThemeDefinition> {
  return validateThemeDefinition(value);
}
