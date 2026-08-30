/**
 * Identifies a Miaixz domain resource.
 *
 * @public
 */
export type MiaixzIdentifier = string;

/**
 * Represents an ISO 8601 date-time string.
 *
 * @public
 */
export type MiaixzIsoDateTime = string;

/**
 * Describes the identity shared by Miaixz domain entities.
 *
 * @public
 */
export interface MiaixzEntity {
  /**
   * Unique identifier of the entity.
   */
  id: MiaixzIdentifier;
}

/**
 * Describes an entity that records creation and update times.
 *
 * @public
 */
export interface MiaixzTimestampedEntity extends MiaixzEntity {
  /**
   * Time at which the entity was created.
   */
  createdAt: MiaixzIsoDateTime;

  /**
   * Time at which the entity was last updated.
   */
  updatedAt: MiaixzIsoDateTime;
}

/**
 * Describes the standard envelope returned by Miaixz APIs.
 *
 * @typeParam T - Type of the successful response payload.
 * @public
 */
export interface MiaixzApiEnvelope<T> {
  /**
   * Result code, where zero represents a successful response.
   */
  readonly errcode: string | number;

  /**
   * Human-readable result message supplied by the API.
   */
  readonly errmsg: string;

  /**
   * Payload returned by the API.
   */
  readonly data: T;
}

/**
 * Describes normalized information about an API failure.
 *
 * @public
 */
export interface MiaixzApiProblem {
  /**
   * Optional machine-readable error code.
   */
  code?: string;

  /**
   * Human-readable error message.
   */
  message: string;

  /**
   * Optional request identifier used for diagnostics.
   */
  requestId?: string;

  /**
   * Optional provider-specific error details.
   */
  details?: unknown;
}
