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
 * Implements the tree view invariants module.
 */

import type { TreeViewModel } from "./tree-view.types.js";

/**
 * Throws a diagnostic error when a strategy violates a renderer invariant.
 * @param model - Candidate view model produced by a tree strategy.
 */
export function assertTreeViewModel<Value>(model: TreeViewModel<Value>): void {
  const seen = new Set<string>();
  const order = new Map(model.visibleRecords.map((record, index) => [record.record.id, index]));
  for (const record of model.visibleRecords) {
    const id = record.record.id;
    const fail = (message: string): never => {
      throw new Error(`Tree view invariant failed (${model.name}:${id}): ${message}`);
    };
    if (seen.has(id)) fail("duplicate visible node");
    seen.add(id);
    if (record.semanticLevel < 1) fail("semanticLevel must begin at one");
    if (
      record.semanticPosition < 1 ||
      record.semanticPosition > record.semanticSetSize ||
      record.semanticSetSize < 1
    ) {
      fail("invalid semantic sibling position");
    }
    if (record.visibleParentId !== null) {
      const parent = model.byId.get(record.visibleParentId);
      if (parent === undefined) fail("visible parent missing");
      const visibleParent = parent as NonNullable<typeof parent>;
      if ((order.get(visibleParent.record.id) ?? Infinity) >= (order.get(id) ?? -1)) {
        fail("visible parent must precede child");
      }
      if (record.semanticLevel !== visibleParent.semanticLevel + 1) fail("semantic level gap");
      if (!visibleParent.visibleChildIds.includes(id))
        fail("parent child relation is not symmetric");
    }
    if (record.disclosed && record.visibleChildIds.length === 0) fail("empty disclosed group");
    if (record.boundary && record.disclosed) fail("boundary cannot be disclosed");
    if (record.disclosed && (!record.stateExpanded || !record.record.expandable)) {
      fail("disclosed state requires expandable expanded record");
    }
    if (record.boundary && (model.name !== "focus" || !record.record.expandable)) {
      fail("boundary is only valid for expandable focus nodes");
    }
    for (const childId of record.visibleChildIds) {
      if (childId === id) fail("self cycle");
      if (!model.byId.has(childId)) fail("visible child missing");
    }
  }
  if (model.byId.size !== model.visibleRecords.length) {
    throw new Error(`Tree view invariant failed (${model.name}): byId size mismatch`);
  }
  const rootIds = model.roots.map((record) => record.record.id);
  const expectedRoots = model.visibleRecords
    .filter((record) => record.visibleParentId === null)
    .map((record) => record.record.id);
  if (rootIds.join("\u0000") !== expectedRoots.join("\u0000")) {
    throw new Error(`Tree view invariant failed (${model.name}): roots mismatch`);
  }
}
