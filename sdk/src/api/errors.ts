import { translateMiaixzDefaultMessage } from "../i18n/default-translator.js";
import type { MiaixzTranslator } from "../i18n/index.js";

/**
 * Configures metadata attached to a Miaixz SDK error.
 *
 * @public
 */
export interface MiaixzSdkErrorOptions {
  /**
   * Optional stable machine-readable error code.
   */
  readonly code?: string;

  /**
   * Optional diagnostic details associated with the error.
   */
  readonly details?: unknown;

  /**
   * Optional original value that caused the error.
   */
  readonly cause?: unknown;
}

/**
 * Base class for errors created by the Miaixz SDK.
 *
 * @public
 */
export class MiaixzSdkError extends Error {
  /**
   * Original Error preserved for local diagnostics when one was supplied.
   */
  declare readonly cause?: Error;

  /**
   * Stable machine-readable error code.
   */
  readonly code: string;

  /**
   * Optional diagnostic details associated with the error.
   */
  readonly details?: unknown;

  /**
   * Creates an SDK error.
   *
   * @param message - Localized human-readable error message.
   * @param options - Stable code, diagnostic details, and original cause.
   */
  constructor(message: string, options: MiaixzSdkErrorOptions = {}) {
    const safeCause = options.cause instanceof Error ? options.cause : undefined;
    super(message, safeCause === undefined ? undefined : { cause: safeCause });
    this.name = "MiaixzSdkError";
    this.code = options.code ?? "SDK_ERROR";
    if (options.details !== undefined) this.details = options.details;
    else if (options.cause !== undefined && safeCause === undefined) {
      this.details = Object.freeze({ type: typeof options.cause });
    }
  }
}

/**
 * Configures request and response metadata attached to an API error.
 *
 * @public
 */
export interface MiaixzApiErrorOptions extends MiaixzSdkErrorOptions {
  /**
   * HTTP status code, or zero when no HTTP response exists.
   */
  readonly status: number;

  /**
   * HTTP method or request operation name.
   */
  readonly method: string;

  /**
   * URL associated with the failed request.
   */
  readonly url: string;

  /**
   * Optional request identifier returned by the server.
   */
  readonly requestId?: string;

  /**
   * Indicates whether retrying the request may succeed.
   */
  readonly retryable?: boolean;
}

/**
 * Error returned for HTTP failures, invalid envelopes, or non-zero business codes.
 *
 * @public
 */
export class MiaixzApiError extends MiaixzSdkError {
  /**
   * HTTP status code, or zero when no HTTP response exists.
   */
  readonly status: number;

  /**
   * HTTP method or request operation name.
   */
  readonly method: string;

  /**
   * URL associated with the failed request.
   */
  readonly url: string;

  /**
   * Optional request identifier returned by the server.
   */
  readonly requestId?: string;

  /**
   * Indicates whether retrying the request may succeed.
   */
  readonly retryable?: boolean;

  /**
   * Creates a structured API error.
   *
   * @param message - Backend or localized fallback message.
   * @param options - Request, response, and retry metadata.
   */
  constructor(message: string, options: MiaixzApiErrorOptions) {
    super(message, options);
    this.name = "MiaixzApiError";
    this.status = options.status;
    this.method = options.method;
    this.url = options.url;
    if (options.retryable !== undefined) this.retryable = options.retryable;
    if (options.requestId !== undefined) this.requestId = options.requestId;
  }
}

/**
 * Represents a transport failure before a valid HTTP response was received.
 *
 * @public
 */
export class MiaixzNetworkError extends MiaixzSdkError {
  /**
   * Creates a transport error.
   *
   * @param cause - Original transport error.
   * @param translate - Message translator.
   */
  constructor(cause?: unknown, translate: MiaixzTranslator = translateMiaixzDefaultMessage) {
    super(translate("sdk.error.network"), { code: "NETWORK_ERROR", cause });
    this.name = "MiaixzNetworkError";
  }
}

/**
 * Represents a request cancelled after exceeding its configured timeout.
 *
 * @public
 */
export class MiaixzTimeoutError extends MiaixzSdkError {
  /**
   * Timeout threshold in milliseconds that cancelled the request.
   */
  readonly timeoutMs: number;

  /**
   * Creates a timeout error.
   *
   * @param timeoutMs - Timeout threshold in milliseconds.
   * @param cause - Original abort or transport error.
   * @param translate - Message translator.
   */
  constructor(
    timeoutMs: number,
    cause?: unknown,
    translate: MiaixzTranslator = translateMiaixzDefaultMessage,
  ) {
    super(translate("sdk.error.timeout", { timeoutMs }), { code: "TIMEOUT", cause });
    this.name = "MiaixzTimeoutError";
    this.timeoutMs = timeoutMs;
  }
}

/**
 * Represents cancellation requested by the caller.
 *
 * @public
 */
export class MiaixzAbortError extends MiaixzSdkError {
  /**
   * Creates a caller-requested cancellation error.
   *
   * @param cause - Original cancellation reason.
   * @param translate - Message translator.
   */
  constructor(cause?: unknown, translate: MiaixzTranslator = translateMiaixzDefaultMessage) {
    super(translate("sdk.error.aborted"), { code: "ABORTED", cause });
    this.name = "MiaixzAbortError";
  }
}

/**
 * Determines whether a value is an error created by the Miaixz SDK.
 *
 * @param value - Value to inspect.
 * @returns Whether `value` is an SDK-created error.
 * @public
 */
export function isMiaixzSdkError(value: unknown): value is MiaixzSdkError {
  return value instanceof MiaixzSdkError;
}

/**
 * Determines whether a value contains Miaixz API request metadata.
 *
 * @param value - Value to inspect.
 * @returns Whether `value` contains Miaixz API request metadata.
 * @public
 */
export function isMiaixzApiError(value: unknown): value is MiaixzApiError {
  return value instanceof MiaixzApiError;
}

/**
 * Converts an arbitrary thrown value into a stable SDK error.
 *
 * @param value - Unknown caught value.
 * @param translate - Translator used for non-Error values.
 * @returns The original SDK error or a normalized wrapper.
 * @public
 */
export function normalizeMiaixzError(
  value: unknown,
  translate: MiaixzTranslator = translateMiaixzDefaultMessage,
): MiaixzSdkError {
  if (value instanceof MiaixzSdkError) return value;
  if (value instanceof Error) {
    return new MiaixzSdkError(translate("sdk.error.unknown"), {
      cause: value,
    });
  }
  return new MiaixzSdkError(translate("sdk.error.unknown"), { cause: value });
}
