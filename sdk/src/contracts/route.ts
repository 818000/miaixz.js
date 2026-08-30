import { isMiaixzModulePermission } from "./permission.js";

/**
 * Describes a route contributed by a remotely loaded Miaixz module.
 *
 * @public
 */
export interface MiaixzModuleRoute {
  /**
   * Module-local route identifier.
   */
  readonly id: string;

  /**
   * Slash-relative path joined to the module base path.
   */
  readonly path: string;

  /**
   * Internationalization key used for the route title.
   */
  readonly titleKey: string;

  /**
   * Optional permissions required before the route is made available.
   */
  readonly requiredPermissions?: readonly string[];
}

/**
 * Validates IDs used by modules, routes, and navigation items.
 *
 * @param value - Identifier candidate to inspect.
 * @returns Whether the value satisfies the frozen kebab-case identifier grammar.
 */
export function isMiaixzModuleIdentifier(value: unknown): value is string {
  return typeof value === "string" && /^[a-z][a-z0-9-]{1,63}$/.test(value);
}

/**
 * Validates a module base path or slash-relative route path.
 *
 * @param value - Path candidate to inspect.
 * @returns Whether the path is static, absolute-path-shaped, and normalized.
 */
export function isMiaixzModulePath(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    (value === "/" || !value.endsWith("/")) &&
    !value.includes(":") &&
    !value.includes("?") &&
    !value.includes("#")
  );
}

/**
 * Validates the required-permission list attached to a route or manifest.
 *
 * @param value - Permission-list candidate to inspect.
 * @returns Whether every item is a non-wildcard module permission.
 */
export function isMiaixzModulePermissionList(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every(isMiaixzModulePermission);
}
