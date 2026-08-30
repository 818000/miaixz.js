import type { MiaixzIdentifier } from "./api.js";

/**
 * Represents the lifecycle status of a platform tenant.
 *
 * @public
 */
export type MiaixzTenantStatus = "active" | "suspended" | "disabled";

/**
 * Platform tenant and security-boundary summary.
 *
 * @public
 */
export interface MiaixzTenantSummary {
  /**
   * Unique identifier of the tenant.
   */
  id: MiaixzIdentifier;

  /**
   * Display name of the tenant.
   */
  name: string;

  /**
   * Optional human-readable tenant code.
   */
  code?: string;

  /**
   * Current lifecycle status of the tenant.
   */
  status: MiaixzTenantStatus;
}
