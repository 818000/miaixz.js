/**
 * Matches one non-wildcard module permission in namespace, resource, and action form.
 */
const modulePermissionPattern = /^[a-z][a-z0-9-]*:[a-z][a-z0-9-]*:[a-z][a-z0-9-]*$/;

/**
 * Determines whether a value is a non-wildcard permission accepted in module manifests.
 *
 * @param value - Permission candidate to inspect.
 * @returns Whether the value uses the frozen lowercase three-segment format.
 */
export function isMiaixzModulePermission(value: unknown): value is string {
  return typeof value === "string" && modulePermissionPattern.test(value);
}
