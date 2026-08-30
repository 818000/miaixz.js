import type { MiaixzIdentifier } from "./api.js";

/**
 * Describes an organization within a tenant.
 *
 * @public
 */
export interface MiaixzOrganizationSummary {
  /**
   * Unique identifier of the organization.
   */
  id: MiaixzIdentifier;

  /**
   * Identifier of the tenant that owns the organization.
   */
  tenantId: MiaixzIdentifier;

  /**
   * Display name of the organization.
   */
  name: string;

  /**
   * Optional human-readable organization code.
   */
  code?: string;
}

/**
 * Describes a department within an organization.
 *
 * @public
 */
export interface MiaixzDepartmentSummary {
  /**
   * Unique identifier of the department.
   */
  id: MiaixzIdentifier;

  /**
   * Identifier of the tenant that owns the department.
   */
  tenantId: MiaixzIdentifier;

  /**
   * Identifier of the organization that contains the department.
   */
  organizationId: MiaixzIdentifier;

  /**
   * Display name of the department.
   */
  name: string;

  /**
   * Optional human-readable department code.
   */
  code?: string;

  /**
   * Optional identifier of the parent department.
   */
  parentId?: MiaixzIdentifier;
}
