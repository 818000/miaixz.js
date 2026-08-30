/**
 * Restricts a number to the inclusive minimum and maximum bounds.
 *
 * @param value - Number to restrict.
 * @param minimum - Lowest permitted value.
 * @param maximum - Highest permitted value.
 * @returns Value restricted to the supplied inclusive bounds.
 * @public
 */
export function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}
