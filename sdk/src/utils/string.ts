/**
 * Determines whether a value is a non-empty string.
 *
 * @param value - Value to inspect.
 * @returns Whether `value` is a string containing non-whitespace characters.
 * @public
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
