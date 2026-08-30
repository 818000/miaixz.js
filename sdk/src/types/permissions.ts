/**
 * Identifies a permission granted by the Miaixz authorization model.
 *
 * @public
 */
export type MiaixzPermissionCode = string;

/**
 * Describes resolved permissions and roles for the active context.
 *
 * @public
 */
export interface MiaixzPermissionSnapshot {
  /**
   * Immutable permission codes explicitly granted to the principal.
   */
  allowed: readonly MiaixzPermissionCode[];

  /**
   * Optional immutable permission codes explicitly denied to the principal.
   */
  denied?: readonly MiaixzPermissionCode[];

  /**
   * Optional immutable role identifiers assigned to the principal.
   */
  roles?: readonly string[];
}
