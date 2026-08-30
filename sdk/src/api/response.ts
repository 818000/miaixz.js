import type { MiaixzApiEnvelope } from "../types/index.js";

/**
 * Describes a successful HTTP response returned by the Miaixz API client.
 *
 * @typeParam T - Type of the normalized response payload.
 * @public
 */
export interface MiaixzHttpResponse<T> {
  /**
   * Normalized response payload.
   */
  readonly data: T;

  /**
   * HTTP status code.
   */
  readonly status: number;

  /**
   * HTTP status text.
   */
  readonly statusText: string;

  /**
   * Response headers returned by the server.
   */
  readonly headers: Headers;

  /**
   * Optional request identifier returned by the server.
   */
  readonly requestId?: string;

  /**
   * Final response URL after redirects.
   */
  readonly url: string;
}

/**
 * Transforms a normalized response before it reaches the caller.
 *
 * @public
 */
export type MiaixzResponseInterceptor = (
  response: MiaixzHttpResponse<unknown>,
) => MiaixzHttpResponse<unknown> | Promise<MiaixzHttpResponse<unknown>>;

/**
 * Validates the standard `{ errcode, errmsg, data }` response shape.
 *
 * @param value - Parsed response body.
 * @returns Whether the body is a Miaixz API envelope.
 * @public
 */
export function isMiaixzApiEnvelope<T = unknown>(value: unknown): value is MiaixzApiEnvelope<T> {
  const record = value as Record<string, unknown>;
  return (
    typeof value === "object" &&
    value !== null &&
    "errcode" in value &&
    (typeof record.errcode === "string" || typeof record.errcode === "number") &&
    "errmsg" in value &&
    typeof record.errmsg === "string" &&
    "data" in value
  );
}

/* eslint-disable jsdoc/check-param-names, jsdoc/require-param -- TSDoc documents the inline field on its TypeScript property. */
/**
 * Determines whether an API result code represents success.
 *
 * @param value - API result code to inspect.
 * @returns Whether an API envelope has the success code `0`.
 * @public
 */
export function isMiaixzApiSuccess(value: {
  /**
   * Business result code returned by the API.
   */
  errcode: string | number;
}): boolean {
  return String(value.errcode) === "0";
}
/* eslint-enable jsdoc/check-param-names, jsdoc/require-param */

/**
 * Returns an envelope's `data` value and leaves non-envelope values unchanged.
 *
 * @param value - Envelope or already-unwrapped value.
 * @returns Unwrapped envelope data or the original non-envelope value.
 * @public
 */
export function unwrapMiaixzData<T>(value: T | MiaixzApiEnvelope<T>): T {
  if (isMiaixzApiEnvelope<T>(value)) {
    return value.data;
  }
  return value;
}
