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
 * Defines structured-clone-safe payloads for the spreadsheet worker.
 */

import type {
  SpreadsheetRenderDocument,
  ViewerWarning,
  SkippedFeature,
} from "../../shared/contracts/document.js";
import type { FormatDecision } from "../../shared/contracts/format.js";
import type { ResourceBudget } from "../../shared/contracts/resource-budget.js";
import type {
  ViewerErrorCode,
  ViewerResourceLimit,
  ViewerErrorStage,
} from "../../shared/errors/viewer-error.js";

/**
 * Carries one transferred workbook into the parser worker.
 */
export interface SpreadsheetWorkerOpenPayload {
  readonly source: ArrayBuffer;
  readonly name: string;
  readonly mimeType?: string;
  readonly decision: FormatDecision;
  readonly budget: ResourceBudget;
}

/**
 * Carries only stable error metadata across the worker boundary.
 */
export interface SpreadsheetWorkerErrorPayload {
  readonly code: ViewerErrorCode;
  readonly stage: ViewerErrorStage;
  readonly recoverable: boolean;
  readonly resourceLimit?: ViewerResourceLimit;
}

/**
 * Carries a spreadsheet parse result without cloning an Error instance.
 */
export type SpreadsheetWorkerResultPayload =
  | {
      readonly status: "complete";
      readonly model: SpreadsheetRenderDocument;
      readonly warnings: readonly ViewerWarning[];
    }
  | {
      readonly status: "partial";
      readonly model: SpreadsheetRenderDocument;
      readonly warnings: readonly ViewerWarning[];
      readonly skipped: readonly SkippedFeature[];
    }
  | {
      readonly status: "rejected";
      readonly error: SpreadsheetWorkerErrorPayload;
    };
