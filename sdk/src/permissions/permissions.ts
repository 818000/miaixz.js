import type { MiaixzPermissionCode, MiaixzPermissionSnapshot } from "../types/index.js";
import { MiaixzSdkError } from "../api/errors.js";
import { miaixzDefaultI18n, type MiaixzTranslator } from "../i18n/index.js";
import { isRecord } from "../utils/object.js";

/**
 * Checks that a value is an array of non-empty permission or role strings.
 *
 * @param value - Value to inspect.
 * @returns Whether the value is an array of non-empty strings.
 */
function isStringList(value: unknown): value is readonly string[] {
  return (
    Array.isArray(value) &&
    value.every((entry) => typeof entry === "string" && entry.trim().length > 0)
  );
}

/**
 * Determines whether a value is a usable permission snapshot.
 *
 * @param value - Value to inspect.
 * @returns Whether `value` is a complete, usable permission snapshot.
 * @public
 */
export function isMiaixzPermissionSnapshot(value: unknown): value is MiaixzPermissionSnapshot {
  if (!isRecord(value) || !isStringList(value.allowed)) return false;
  if (value.denied !== undefined && !isStringList(value.denied)) return false;
  if (value.roles !== undefined && !isStringList(value.roles)) return false;
  return true;
}

/**
 * Matches exact, global, and namespace wildcard permission grants.
 *
 * @param grant - Granted permission or wildcard pattern.
 * @param required - Permission required by the operation.
 * @returns Whether the grant satisfies the required permission.
 */
function matchesPermission(grant: MiaixzPermissionCode, required: MiaixzPermissionCode): boolean {
  if (grant === "*" || grant === required) return true;
  if (!grant.endsWith(":*")) return false;
  const namespace = grant.slice(0, -1);
  return required.startsWith(namespace);
}

/**
 * Evaluates immutable allow, deny, and role snapshots on the client.
 *
 * @public
 */
export class MiaixzPermissionSet {
  readonly #allowed: readonly MiaixzPermissionCode[];
  readonly #denied: readonly MiaixzPermissionCode[];

  /**
   * Immutable role identifiers included in the permission snapshot.
   */
  readonly roles: ReadonlySet<string>;

  /**
   * Creates an immutable permission evaluator.
   *
   * @param snapshot - Permission grants and roles supplied by the backend.
   * @param translate - Translator used by runtime validation errors.
   */
  constructor(
    snapshot: MiaixzPermissionSnapshot,
    translate: MiaixzTranslator = miaixzDefaultI18n.t,
  ) {
    if (!isMiaixzPermissionSnapshot(snapshot)) {
      throw new MiaixzSdkError(translate("sdk.error.permissions.invalid"), {
        code: "PERMISSIONS_INVALID",
      });
    }
    this.#allowed = [...new Set(snapshot.allowed)];
    this.#denied = [...new Set(snapshot.denied ?? [])];
    this.roles = new Set(snapshot.roles ?? []);
  }

  /**
   * Determines whether one permission is allowed.
   *
   * @param permission - Permission code to evaluate.
   * @returns Whether one permission is allowed; explicit deny always wins.
   */
  can(permission: MiaixzPermissionCode): boolean {
    if (this.#denied.some((grant) => matchesPermission(grant, permission))) return false;
    return this.#allowed.some((grant) => matchesPermission(grant, permission));
  }

  /**
   * Determines whether any requested permission is allowed.
   *
   * @param permissions - Permission codes to evaluate.
   * @returns Whether at least one requested permission is allowed.
   */
  canAny(permissions: readonly MiaixzPermissionCode[]): boolean {
    return permissions.some((permission) => this.can(permission));
  }

  /**
   * Determines whether all requested permissions are allowed.
   *
   * @param permissions - Permission codes to evaluate.
   * @returns Whether every requested permission is allowed.
   */
  canAll(permissions: readonly MiaixzPermissionCode[]): boolean {
    return permissions.every((permission) => this.can(permission));
  }

  /**
   * Determines whether a role is present in the snapshot.
   *
   * @param role - Role identifier to evaluate.
   * @returns Whether the snapshot includes the specified role.
   */
  hasRole(role: string): boolean {
    return this.roles.has(role);
  }
}

/**
 * Creates an immutable permission evaluator from a backend snapshot.
 *
 * @param snapshot - Permission grants and roles supplied by the backend.
 * @param translate - Translator used by runtime validation errors.
 * @returns Immutable permission evaluator.
 * @public
 */
export function createMiaixzPermissionSet(
  snapshot: MiaixzPermissionSnapshot,
  translate: MiaixzTranslator = miaixzDefaultI18n.t,
): MiaixzPermissionSet {
  return new MiaixzPermissionSet(snapshot, translate);
}
