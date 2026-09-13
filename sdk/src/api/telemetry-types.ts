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

import type { MiaixzHttpMethod } from "./request.js";

/**
 * Receives immutable, redacted API lifecycle events without changing request behavior.
 *
 * @public
 */
export interface MiaixzApiTelemetryHooks {
  /**
   * Observes a request immediately before Fetch is invoked.
   */
  readonly onRequest?: (event: Readonly<MiaixzRequestEvent>) => void | Promise<void>;

  /**
   * Observes an HTTP response immediately after Fetch resolves.
   */
  readonly onResponse?: (event: Readonly<MiaixzResponseEvent>) => void | Promise<void>;

  /**
   * Observes a normalized request failure.
   */
  readonly onError?: (event: Readonly<MiaixzErrorEvent>) => void | Promise<void>;

  /**
   * Receives an exception thrown by a primary telemetry hook.
   */
  readonly onHookError?: (error: unknown, hook: "request" | "response" | "error") => void;
}

/**
 * Describes a safe request attempt for host-provided telemetry.
 *
 * @public
 */
export interface MiaixzRequestEvent {
  /**
   * Correlates every attempt belonging to one logical request.
   */
  readonly requestId: string;

  /**
   * Contains the request HTTP method.
   */
  readonly method: MiaixzHttpMethod;

  /**
   * Contains the URL with credentials, fragments, and query values removed.
   */
  readonly url: string;

  /**
   * Contains the zero-based request attempt number.
   */
  readonly attempt: number;

  /**
   * Contains a frozen header snapshot with sensitive values redacted.
   */
  readonly headers: Readonly<Record<string, string>>;

  /**
   * Contains a frozen redacted JSON value or safe non-JSON body summary.
   */
  readonly body?: unknown;

  /**
   * Contains the attempt start time as Unix epoch milliseconds.
   */
  readonly startedAt: number;
}

/**
 * Describes a safe HTTP response attempt for host-provided telemetry.
 *
 * @public
 */
export interface MiaixzResponseEvent {
  /**
   * Correlates the response with its logical request.
   */
  readonly requestId: string;

  /**
   * Contains the request HTTP method.
   */
  readonly method: MiaixzHttpMethod;

  /**
   * Contains the URL with credentials, fragments, and query values removed.
   */
  readonly url: string;

  /**
   * Contains the zero-based request attempt number.
   */
  readonly attempt: number;

  /**
   * Contains the HTTP response status.
   */
  readonly status: number;

  /**
   * Contains elapsed time from attempt start through response receipt.
   */
  readonly durationMs: number;

  /**
   * Contains a frozen header snapshot with sensitive values redacted.
   */
  readonly headers: Readonly<Record<string, string>>;
}

/**
 * Describes a safe normalized failure for host-provided telemetry.
 *
 * @public
 */
export interface MiaixzErrorEvent {
  /**
   * Correlates the failure with its logical request.
   */
  readonly requestId: string;

  /**
   * Contains the request HTTP method.
   */
  readonly method: MiaixzHttpMethod;

  /**
   * Contains the URL with credentials, fragments, and query values removed.
   */
  readonly url: string;

  /**
   * Contains the zero-based request attempt number.
   */
  readonly attempt: number;

  /**
   * Contains elapsed time from attempt start through failure normalization.
   */
  readonly durationMs: number;

  /**
   * Contains a frozen error summary without causes or diagnostic payloads.
   */
  readonly error: Readonly<{
    /**
     * Contains the stable JavaScript error class name.
     */
    name: string;

    /**
     * Contains the stable machine-readable SDK error code.
     */
    code: string;

    /**
     * Contains the localized, content-safe error message.
     */
    message: string;
  }>;
}
