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
 * Defines the stable format-driver and progress contracts.
 */

import type { ParseOutcome, ViewerDocument } from "./document.js";
import type { FormatDecision, FormatDriverId } from "./format.js";
import type { ResourceBudget } from "./resource-budget.js";
import type { RandomAccessResource, RelatedResourceRequest } from "./source.js";

/**
 * Reports monotonic progress from a driver.
 */
export interface ViewerProgress {
  readonly stage: "opening" | "detecting" | "indexing" | "parsing" | "rendering" | "searching";
  readonly completed?: number;
  readonly total?: number;
  readonly unit?: "bytes" | "entries" | "pages" | "sheets" | "slides" | "items";
  readonly indeterminate: boolean;
}

/**
 * Supplies every capability a driver may use.
 */
export interface DriverContext {
  readonly resource: RandomAccessResource;
  readonly decision: FormatDecision;
  readonly budget: ResourceBudget;
  readonly signal: AbortSignal;
  readonly reportProgress: (progress: ViewerProgress) => void;
  readonly resolveRelated?: (
    request: RelatedResourceRequest,
    signal?: AbortSignal,
  ) => Promise<RandomAccessResource | undefined>;
}

/**
 * Supplies bounded evidence to an optional driver probe.
 */
export interface ProbeContext {
  readonly prefix: Uint8Array;
  readonly name?: string;
  readonly mimeType?: string;
  readonly signal: AbortSignal;
}

/**
 * Reports driver confidence without opening the full document.
 */
export interface ProbeResult {
  readonly confidence: number;
  readonly reason: string;
}

/**
 * Defines a deterministic, cancellable file-format driver.
 */
export interface ViewerDriver<TDocument extends ViewerDocument = ViewerDocument> {
  readonly id: FormatDriverId;
  probe?(context: ProbeContext): ProbeResult | Promise<ProbeResult>;
  open(context: DriverContext): Promise<ParseOutcome<TDocument>>;
}
