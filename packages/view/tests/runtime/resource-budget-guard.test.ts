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
 * Verifies cumulative session resource accounting and depth boundaries.
 */

import { describe, expect, it } from "vitest";
import { defaultResourceBudget } from "../../src/runtime/resource-budget.js";
import {
  getResourceBudgetGuard,
  ResourceBudgetGuard,
} from "../../src/runtime/resource-budget-guard.js";

describe("ResourceBudgetGuard", () => {
  it("accepts the exact cumulative boundary and reports the first excess", () => {
    const budget = { ...defaultResourceBudget, maxExpandedBytes: 3 };
    const guard = new ResourceBudgetGuard(budget);
    guard.consumeExpandedBytes(1);
    guard.consumeExpandedBytes(2);
    expect(() => guard.consumeExpandedBytes(1)).toThrowError(
      expect.objectContaining({
        code: "RESOURCE_LIMIT_EXCEEDED",
        resourceLimit: { field: "maxExpandedBytes", actual: 4, allowed: 3 },
      }),
    );
  });

  it("rejects invalid counts and excessive semantic depth", () => {
    const budget = { ...defaultResourceBudget, maxRecursionDepth: 2 };
    const guard = new ResourceBudgetGuard(budget);
    expect(() => guard.consumePages(-1)).toThrowError(
      expect.objectContaining({ code: "RESOURCE_LIMIT_EXCEEDED" }),
    );
    expect(() => guard.assertDepth(2, "maxRecursionDepth")).not.toThrow();
    expect(() => guard.assertDepth(3, "maxRecursionDepth")).toThrowError(
      expect.objectContaining({ code: "RESOURCE_LIMIT_EXCEEDED" }),
    );
  });

  it("shares exactly one guard per document signal and propagates cancellation", () => {
    const controller = new AbortController();
    const first = getResourceBudgetGuard(defaultResourceBudget, controller.signal);
    expect(getResourceBudgetGuard(defaultResourceBudget, controller.signal)).toBe(first);
    controller.abort();
    expect(() => first.checkpoint(controller.signal)).toThrowError(
      expect.objectContaining({ name: "AbortError" }),
    );
  });
});
