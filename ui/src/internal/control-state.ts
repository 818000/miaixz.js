/**
 * Reports whether a control value contains meaningful user-visible content.
 *
 * @param value - Controlled or uncontrolled form value.
 * @returns Whether the value represents a filled control.
 */
export function hasMiaixzControlValue(value: unknown): boolean {
  if (value === undefined || value === null || value === false) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "string") return value.length > 0;
  return true;
}
