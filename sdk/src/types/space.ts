import type { MiaixzIdentifier } from "./api.js";

/**
 * Represents the lifecycle status of a workspace.
 *
 * @public
 */
export type MiaixzSpaceStatus = "active" | "disabled" | "archived";

/**
 * Describes a workspace available within a tenant.
 *
 * @public
 */
export interface MiaixzSpaceSummary {
  /**
   * Unique identifier of the workspace.
   */
  id: MiaixzIdentifier;

  /**
   * Identifier of the tenant that owns the workspace.
   */
  tenantId: MiaixzIdentifier;

  /**
   * Display name of the workspace.
   */
  name: string;

  /**
   * Optional human-readable workspace code.
   */
  code?: string;

  /**
   * Optional description of the workspace purpose.
   */
  description?: string;

  /**
   * Current lifecycle status of the workspace.
   */
  status: MiaixzSpaceStatus;

  /**
   * Optional identifier of the user responsible for the workspace.
   */
  ownerId?: MiaixzIdentifier;
}
