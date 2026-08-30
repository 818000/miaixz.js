import type { MiaixzIdentifier } from "./api.js";

/**
 * Describes the execution context propagated across Miaixz services.
 *
 * @public
 */
export interface MiaixzRuntimeContext {
  /**
   * Identifier of the authenticated user.
   */
  userId?: MiaixzIdentifier;

  /**
   * Security and data-isolation boundary for every tenant-owned resource.
   */
  tenantId?: MiaixzIdentifier;
  /**
   * Optional organization selected inside the active tenant.
   */
  organizationId?: MiaixzIdentifier;

  /**
   * Optional department selected inside the active organization.
   */
  departmentId?: MiaixzIdentifier;

  /**
   * Optional workspace selected by the user.
   */
  spaceId?: MiaixzIdentifier;

  /**
   * Locale used for translated messages and regional formatting.
   */
  locale?: string;

  /**
   * IANA timezone used for date and time presentation.
   */
  timezone?: string;

  /**
   * Optional trace identifier propagated for diagnostics.
   */
  traceId?: string;
}
