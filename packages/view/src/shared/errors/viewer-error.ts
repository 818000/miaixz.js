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

/**
 * Defines sanitized runtime errors and stable recovery metadata.
 */

/**
 * Identifies stable, language-neutral viewer failures.
 */
export type ViewerErrorCode =
  | "ABORTED"
  | "COMPATIBILITY_UNSUPPORTED"
  | "DOCUMENT_DISPOSED"
  | "FORMAT_AMBIGUOUS"
  | "FORMAT_UNSUPPORTED"
  | "INVALID_CONFIGURATION"
  | "INVALID_SOURCE"
  | "INTERNAL_UNEXPECTED"
  | "NETWORK_FAILED"
  | "PARSE_FAILED"
  | "PARSE_STALLED"
  | "PASSWORD_REJECTED"
  | "PASSWORD_REQUIRED"
  | "RELATED_RESOURCE_REQUIRED"
  | "RESOURCE_LIMIT_EXCEEDED"
  | "RENDER_FAILED"
  | "SECURITY_BLOCKED"
  | "UNSUPPORTED_RUNTIME";

/**
 * Identifies the pipeline stage at which a safe failure occurred.
 */
export type ViewerErrorStage = "source" | "detect" | "parse" | "render" | "dispose";

/**
 * Groups stable codes without requiring callers to inspect error text.
 */
export type ViewerErrorCategory =
  | "cancelled"
  | "compatibility"
  | "format"
  | "internal"
  | "parse"
  | "render"
  | "resource"
  | "security"
  | "source";

/**
 * Recovery actions which a host may offer explicitly.
 */
export type ViewerRecoveryAction =
  "download" | "open-as-text" | "provide-related-resource" | "request-password" | "retry";

/**
 * Identifies the precise bounded resource which rejected an input.
 */
export interface ViewerResourceLimit {
  readonly field: string;
  readonly actual: number;
  readonly allowed: number;
}

/**
 * Maps a stable viewer error code to its public category.
 *
 * @param code - Stable viewer error code being classified.
 * @returns Public category associated with the error code.
 */
function errorCategory(code: ViewerErrorCode): ViewerErrorCategory {
  if (code === "ABORTED" || code === "DOCUMENT_DISPOSED") return "cancelled";
  if (code === "FORMAT_AMBIGUOUS" || code === "FORMAT_UNSUPPORTED") return "format";
  if (
    code === "COMPATIBILITY_UNSUPPORTED" ||
    code === "INVALID_CONFIGURATION" ||
    code === "UNSUPPORTED_RUNTIME"
  )
    return "compatibility";
  if (code === "INVALID_SOURCE" || code === "NETWORK_FAILED") return "source";
  if (code === "INTERNAL_UNEXPECTED") return "internal";
  if (code === "PASSWORD_REJECTED" || code === "PASSWORD_REQUIRED") return "security";
  if (code === "RELATED_RESOURCE_REQUIRED" || code === "RESOURCE_LIMIT_EXCEEDED") return "resource";
  if (code === "SECURITY_BLOCKED") return "security";
  if (code === "PARSE_FAILED" || code === "PARSE_STALLED") return "parse";
  if (code === "RENDER_FAILED") return "render";
  return "internal";
}

/**
 * Selects the safe recovery actions exposed for a stable error code.
 *
 * @param code - Stable viewer error code being inspected.
 * @returns Immutable recovery actions suitable for host presentation.
 */
function defaultRecoveryActions(code: ViewerErrorCode): readonly ViewerRecoveryAction[] {
  if (code === "NETWORK_FAILED") return ["retry", "download"];
  if (code === "FORMAT_AMBIGUOUS") return ["open-as-text", "download"];
  if (code === "FORMAT_UNSUPPORTED" || code === "UNSUPPORTED_RUNTIME") return ["download"];
  if (code === "PASSWORD_REQUIRED" || code === "PASSWORD_REJECTED")
    return ["request-password", "download"];
  if (code === "RELATED_RESOURCE_REQUIRED") return ["provide-related-resource", "download"];
  if (code === "PARSE_FAILED" || code === "RENDER_FAILED") return ["retry", "download"];
  return [];
}

let nextDiagnosticId = 1;

/**
 * Reports a sanitized public error without retaining source data or credentials.
 */
export class ViewerError extends Error {
  readonly code: ViewerErrorCode;
  readonly stage: ViewerErrorStage;
  readonly recoverable: boolean;
  readonly category: ViewerErrorCategory;
  readonly recoveryActions: readonly ViewerRecoveryAction[];
  readonly diagnosticId: string;
  readonly resourceLimit?: ViewerResourceLimit;

  /**
   * Creates a sanitized viewer error.
   *
   * @param code - Stable machine-readable failure code.
   * @param stage - Pipeline stage at which the failure occurred.
   * @param recoverable - Whether the current session may attempt recovery.
   * @param recoveryActions - Explicit actions that a host may safely offer.
   * @param resourceLimit - Optional non-sensitive resource-limit diagnostic.
   */
  constructor(
    code: ViewerErrorCode,
    stage: ViewerErrorStage,
    recoverable = false,
    recoveryActions: readonly ViewerRecoveryAction[] = defaultRecoveryActions(code),
    resourceLimit?: ViewerResourceLimit,
  ) {
    super(`[${code}]`);
    this.name = "ViewerError";
    this.code = code;
    this.stage = stage;
    this.recoverable = recoverable;
    this.category = errorCategory(code);
    this.recoveryActions = recoveryActions;
    if (resourceLimit !== undefined) this.resourceLimit = resourceLimit;
    this.diagnosticId = `viewer-error-${nextDiagnosticId}`;
    nextDiagnosticId += 1;
  }
}

/**
 * Converts unknown failures into the public sanitized error contract.
 *
 * @param value - Unknown failure caught at a trust boundary.
 * @param stage - Pipeline stage used when creating a sanitized replacement.
 * @returns Existing viewer error or a sanitized public replacement.
 */
export function sanitizeViewerError(value: unknown, stage: ViewerErrorStage): ViewerError {
  if (value instanceof ViewerError) return value;
  if (value instanceof DOMException && value.name === "AbortError") {
    return new ViewerError("ABORTED", stage, true);
  }
  return new ViewerError("INTERNAL_UNEXPECTED", stage);
}
