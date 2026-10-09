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
 * Tracks document-session resource consumption against the resolved security budget.
 */

import type { ResourceBudget } from "../shared/contracts/resource-budget.js";
import { ViewerError, type ViewerErrorStage } from "../shared/errors/viewer-error.js";

type CountedBudgetField =
  | "maxDrawingObjects"
  | "maxEstimatedMemoryBytes"
  | "maxExpandedBytes"
  | "maxPages"
  | "maxTextCharacters"
  | "maxVectorRecords";

const guards = new WeakMap<AbortSignal, ResourceBudgetGuard>();

/**
 * Owns cumulative counters and deterministic limit diagnostics for one open session.
 */
export class ResourceBudgetGuard {
  readonly #budget: ResourceBudget;
  readonly #counts = new Map<CountedBudgetField, number>();

  /**
   * Creates one guard over an already resolved budget.
   *
   * @param budget - Immutable limits for the document session.
   */
  constructor(budget: ResourceBudget) {
    this.#budget = budget;
  }

  /**
   * Propagates session cancellation at bounded loop checkpoints.
   *
   * @param signal - Controller-owned document signal.
   */
  checkpoint(signal: AbortSignal): void {
    signal.throwIfAborted();
  }

  /**
   * Rejects an observed non-cumulative value above one budget field.
   *
   * @param field - Budget field being enforced.
   * @param actual - Observed value.
   * @param stage - Pipeline stage reporting the rejection.
   */
  assertLimit(
    field: keyof ResourceBudget,
    actual: number,
    stage: ViewerErrorStage = "parse",
  ): void {
    const allowed = this.#budget[field];
    if (!Number.isSafeInteger(actual) || actual < 0 || actual > allowed) {
      throw this.#limitError(field, actual, allowed, stage);
    }
  }

  /**
   * Rejects excessive archive, XML, or semantic recursion depth.
   *
   * @param depth - Zero-based current depth.
   * @param field - Depth budget to enforce.
   */
  assertDepth(depth: number, field: "maxArchiveDepth" | "maxRecursionDepth" | "maxXmlDepth"): void {
    this.assertLimit(field, depth);
  }

  /**
   * Adds expanded bytes to the session total.
   *
   * @param count - Newly materialized bytes.
   */
  consumeExpandedBytes(count: number): void {
    this.#consume("maxExpandedBytes", count);
  }

  /**
   * Adds decoded characters to the session total.
   *
   * @param count - Newly decoded characters.
   */
  consumeTextCharacters(count: number): void {
    this.#consume("maxTextCharacters", count);
  }

  /**
   * Adds pages to the session total.
   *
   * @param count - Newly indexed pages.
   */
  consumePages(count = 1): void {
    this.#consume("maxPages", count);
  }

  /**
   * Adds drawing objects to the session total.
   *
   * @param count - Newly allocated shapes or edges.
   */
  consumeDrawingObjects(count = 1): void {
    this.#consume("maxDrawingObjects", count);
  }

  /**
   * Adds vector records to the session total.
   *
   * @param count - Newly processed vector records.
   */
  consumeVectorRecords(count = 1): void {
    this.#consume("maxVectorRecords", count);
  }

  /**
   * Adds conservative retained-memory estimates to the session total.
   *
   * @param count - Newly retained estimated bytes.
   */
  consumeEstimatedMemory(count: number): void {
    this.#consume("maxEstimatedMemoryBytes", count);
  }

  /**
   * Adds one positive safe integer to a cumulative budget field.
   *
   * @param field - Cumulative field being consumed.
   * @param count - Positive increment, or zero.
   */
  #consume(field: CountedBudgetField, count: number): void {
    const allowed = this.#budget[field];
    if (!Number.isSafeInteger(count) || count < 0) {
      throw this.#limitError(field, count, allowed, "parse");
    }
    const current = this.#counts.get(field) ?? 0;
    const next = current + count;
    if (!Number.isSafeInteger(next) || next > allowed) {
      throw this.#limitError(field, next, allowed, "parse");
    }
    this.#counts.set(field, next);
  }

  /**
   * Creates the canonical public limit failure without source content.
   *
   * @param field - Rejected budget field.
   * @param actual - Observed value.
   * @param allowed - Maximum allowed value.
   * @param stage - Pipeline stage reporting the error.
   * @returns Sanitized viewer error.
   */
  #limitError(
    field: keyof ResourceBudget,
    actual: number,
    allowed: number,
    stage: ViewerErrorStage,
  ): ViewerError {
    return new ViewerError("RESOURCE_LIMIT_EXCEEDED", stage, false, [], {
      field,
      actual: Number.isFinite(actual) ? actual : Number.MAX_SAFE_INTEGER,
      allowed,
    });
  }
}

/**
 * Returns the shared resource guard for one controller-owned document signal.
 *
 * @param budget - Resolved document budget.
 * @param signal - Unique signal identifying the open session.
 * @returns Stable guard shared by every parser layer in the session.
 */
export function getResourceBudgetGuard(
  budget: ResourceBudget,
  signal: AbortSignal,
): ResourceBudgetGuard {
  const existing = guards.get(signal);
  if (existing !== undefined) return existing;
  const guard = new ResourceBudgetGuard(budget);
  guards.set(signal, guard);
  return guard;
}
