/**
 * Determines whether a date contains a finite timestamp.
 *
 * @param value - Date instance to validate.
 * @returns Whether a Date contains a finite timestamp.
 * @public
 */
export function isValidDate(value: Date): boolean {
  return !Number.isNaN(value.getTime());
}
