/*
 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
 ~                                                                           ~
 ~ Copyright (c) 2015-2026 miaixz.org and other contributors.                ~
 ~                                                                           ~
 ~ Licensed under the Apache License, Version 2.0 (the "License");           ~
 ~ you may not use this file except in compliance with the License.          ~
 ~ You may obtain a copy of the License at                                   ~
 ~                                                                           ~
 ~      https://www.apache.org/licenses/LICENSE-2.0                          ~
 ~                                                                           ~
 ~ Unless required by applicable law or agreed to in writing, software       ~
 ~ distributed under the License is distributed on an "AS IS" BASIS,         ~
 ~ WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  ~
 ~ See the License for the specific language governing permissions and       ~
 ~ limitations under the License.                                            ~
 ~                                                                           ~
 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
*/

import { getMiaixzSdkErrorMessageKey } from "./error-codes.js";
import {
  sanitizeMiaixzErrorCause,
  sanitizeMiaixzErrorDetails,
  sanitizeMiaixzServerMessage,
} from "./sanitize.js";

/**
 * Configures language-independent SDK error metadata.
 *
 * @public
 */
export interface MiaixzSdkErrorOptions {
  /**
   * Stable machine-readable code.
   */
  readonly code: string;
  /**
   * Optional sanitized diagnostic metadata.
   */
  readonly details?: unknown;
  /**
   * Optional failure category retained without original content.
   */
  readonly cause?: unknown;
}

/**
 * Base class for every language-independent SDK error.
 *
 * @public
 */
export class MiaixzSdkError extends Error {
  /**
   * Content-free failure category.
   */
  declare readonly cause?: unknown;
  /**
   * Stable machine-readable code.
   */
  readonly code: string;
  /**
   * Presentation key derived from the error-code registry.
   */
  readonly messageKey: string;
  /**
   * Sanitized bounded diagnostic metadata.
   */
  readonly details?: unknown;

  /**
   * Creates an SDK error without accepting localized text.
   *
   * @param options - Stable code and optional diagnostic metadata.
   */
  constructor(options: MiaixzSdkErrorOptions) {
    const messageKey = getMiaixzSdkErrorMessageKey(options.code);
    const cause = sanitizeMiaixzErrorCause(options.cause);
    super(`[${options.code}] ${messageKey}`, cause === undefined ? undefined : { cause });
    this.name = "MiaixzSdkError";
    this.code = options.code;
    this.messageKey = messageKey;
    if (options.details !== undefined) this.details = sanitizeMiaixzErrorDetails(options.details);
  }
}

/**
 * Configures request and response metadata attached to an API error.
 *
 * @public
 */
export interface MiaixzApiErrorOptions extends MiaixzSdkErrorOptions {
  /**
   * HTTP status, or zero when no response exists.
   */
  readonly status: number;
  /**
   * HTTP method or configuration operation.
   */
  readonly method: string;
  /**
   * Sanitized request URL.
   */
  readonly url: string;
  /**
   * Optional request correlation ID.
   */
  readonly requestId?: string;
  /**
   * Whether retrying may succeed.
   */
  readonly retryable?: boolean;
  /**
   * Optional sanitized backend text.
   */
  readonly serverMessage?: string;
}

/**
 * Error returned for HTTP, envelope, or business failures.
 *
 * @public
 */
export class MiaixzApiError extends MiaixzSdkError {
  /**
   * HTTP status, or zero when no response exists.
   */
  readonly status: number;
  /**
   * HTTP method or configuration operation.
   */
  readonly method: string;
  /**
   * Sanitized request URL.
   */
  readonly url: string;
  /**
   * Optional request correlation ID.
   */
  readonly requestId?: string;
  /**
   * Whether retrying may succeed.
   */
  readonly retryable?: boolean;
  /**
   * Optional sanitized backend text.
   */
  readonly serverMessage?: string;

  /**
   * Creates a structured API error.
   *
   * @param options - Language-independent API failure metadata.
   */
  constructor(options: MiaixzApiErrorOptions) {
    super(options);
    this.name = "MiaixzApiError";
    this.status = options.status;
    this.method = options.method;
    this.url = options.url;
    if (options.retryable !== undefined) this.retryable = options.retryable;
    if (options.requestId !== undefined) this.requestId = options.requestId;
    const serverMessage =
      options.serverMessage === undefined
        ? undefined
        : sanitizeMiaixzServerMessage(options.serverMessage);
    if (serverMessage !== undefined) this.serverMessage = serverMessage;
  }
}

/**
 * Represents a transport failure before a response was received.
 *
 * @public
 */
export class MiaixzNetworkError extends MiaixzSdkError {
  /**
   * Creates a network error.
   *
   * @param options - Optional diagnostic metadata.
   */
  constructor(options: Omit<MiaixzSdkErrorOptions, "code"> = {}) {
    super({ ...options, code: "NETWORK_ERROR" });
    this.name = "MiaixzNetworkError";
  }
}

/**
 * Represents a request cancelled after its timeout.
 *
 * @public
 */
export class MiaixzTimeoutError extends MiaixzSdkError {
  /**
   * Timeout threshold in milliseconds.
   */
  readonly timeoutMs: number;

  /**
   * Creates a timeout error.
   *
   * @param options - Timeout threshold and optional diagnostic metadata.
   */
  constructor(
    options: Omit<MiaixzSdkErrorOptions, "code"> & {
      /**
       * Timeout threshold in milliseconds.
       */
      readonly timeoutMs: number;
    },
  ) {
    super({ ...options, code: "TIMEOUT", details: { timeoutMs: options.timeoutMs } });
    this.name = "MiaixzTimeoutError";
    this.timeoutMs = options.timeoutMs;
  }
}

/**
 * Represents caller-requested cancellation.
 *
 * @public
 */
export class MiaixzAbortError extends MiaixzSdkError {
  /**
   * Creates an abort error.
   *
   * @param options - Optional diagnostic metadata.
   */
  constructor(options: Omit<MiaixzSdkErrorOptions, "code"> = {}) {
    super({ ...options, code: "ABORTED" });
    this.name = "MiaixzAbortError";
  }
}

/**
 * Determines whether a value is SDK-owned.
 *
 * @param value - Runtime value to inspect.
 * @returns Whether the value is an SDK error.
 * @public
 */
export function isMiaixzSdkError(value: unknown): value is MiaixzSdkError {
  return value instanceof MiaixzSdkError;
}

/**
 * Determines whether a value contains API metadata.
 *
 * @param value - Runtime value to inspect.
 * @returns Whether the value is an API error.
 * @public
 */
export function isMiaixzApiError(value: unknown): value is MiaixzApiError {
  return value instanceof MiaixzApiError;
}

/**
 * Converts an arbitrary thrown value into the sole SDK error model.
 *
 * @param value - Runtime failure to normalize.
 * @returns The original SDK error or a language-independent wrapper.
 * @public
 */
export function normalizeMiaixzError(value: unknown): MiaixzSdkError {
  return value instanceof MiaixzSdkError
    ? value
    : new MiaixzSdkError({ code: "SDK_ERROR", cause: value });
}
