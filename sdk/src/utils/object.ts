/**
 * Determines whether a value is an object record.
 *
 * @param value - Value to inspect.
 * @returns Whether `value` is a non-null, non-array object record.
 * @public
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
