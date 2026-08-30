/**
 * Joins truthy class names without adding external runtime dependencies.
 *
 * @param values - Candidate class names and false-like values.
 * @returns A space-delimited class-name string.
 */
export function classNames(...values: ReadonlyArray<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}
