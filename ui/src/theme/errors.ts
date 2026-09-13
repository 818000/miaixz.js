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

import { MiaixzUiError } from "../errors/ui-error.js";
import type { MiaixzThemeErrorCode } from "./error-types.js";

/**
 * Configures one structured theme runtime error.
 */
export interface MiaixzThemeErrorOptions {
  /**
   * Identifies the related theme without exposing its source data.
   */
  readonly theme?: string;
  /**
   * Supplies bounded diagnostic metadata.
   */
  readonly details?: unknown;
  /**
   * Supplies the original local failure.
   */
  readonly cause?: unknown;
}

/**
 * Represents a stable theme validation, loading, application, or persistence failure.
 *
 * @public
 */
export class MiaixzThemeError extends MiaixzUiError {
  /**
   * Contains the narrowed stable theme error code.
   */
  override readonly code: MiaixzThemeErrorCode;

  /**
   * Contains the sanitized related theme identifier when available.
   */
  readonly theme?: string;

  /**
   * Creates one structured theme error.
   *
   * @param code - Stable theme error code.
   * @param options - Optional safe theme, details, and cause metadata.
   */
  constructor(code: MiaixzThemeErrorCode, options: MiaixzThemeErrorOptions = {}) {
    super({
      code,
      ...(options.details === undefined && options.theme === undefined
        ? {}
        : {
            details: {
              ...asDetails(options.details),
              ...(options.theme ? { theme: options.theme } : {}),
            },
          }),
      ...(options.cause === undefined ? {} : { cause: options.cause }),
    });
    this.name = "MiaixzThemeError";
    this.code = code;
    if (options.theme !== undefined) this.theme = options.theme;
  }
}

/**
 * Converts optional diagnostic data to a safe object merge boundary.
 *
 * @param details - Optional diagnostic value.
 * @returns Plain diagnostic record.
 */
function asDetails(details: unknown): Record<string, unknown> {
  return details !== null && typeof details === "object" && !Array.isArray(details)
    ? { ...(details as Record<string, unknown>) }
    : details === undefined
      ? {}
      : { value: details };
}
