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
 * Implements the nested tree strategy module.
 */

import type { TreeCollectionRecord } from "../tree-collection.js";
import type {
  TreeViewModel,
  TreeViewRecord,
  TreeViewStrategy,
  TreeViewStrategyInput,
} from "../tree-view.types.js";

/**
 * Built-in nested tree strategy.
 */
export const nestedTreeStrategy: TreeViewStrategy = {
  name: "nested",
  /**
   * Projects the compatibility nested hierarchy without visual compression.
   * @param input - Current collection and expansion state.
   * @returns Nested renderer-facing tree model.
   */
  createViewModel<Value>(input: TreeViewStrategyInput<Value>): TreeViewModel<Value> {
    const visible: TreeViewRecord<Value>[] = [];
    const byId = new Map<string, TreeViewRecord<Value>>();
    const append = (
      siblings: readonly TreeCollectionRecord<Value>[],
      visibleParentId: string | null,
    ): readonly TreeViewRecord<Value>[] => {
      const output: TreeViewRecord<Value>[] = [];
      for (const [index, record] of siblings.entries()) {
        const children = input.collection.getChildren(record.id);
        const stateExpanded = input.expandedIds.has(record.id);
        const disclosed = stateExpanded && children.length > 0;
        const childIds = disclosed ? children.map((child) => child.id) : [];
        const viewRecord: TreeViewRecord<Value> = {
          record,
          visibleParentId,
          visibleChildIds: Object.freeze(childIds),
          semanticLevel: record.logicalLevel,
          semanticPosition: index + 1,
          semanticSetSize: siblings.length,
          visualLevel: record.logicalLevel - 1,
          stateExpanded,
          disclosed,
          boundary: false,
          viewRoot: false,
        };
        visible.push(viewRecord);
        output.push(viewRecord);
        byId.set(record.id, viewRecord);
        if (disclosed) append(children, record.id);
      }
      return Object.freeze(output);
    };
    const roots = append(input.collection.roots, null);
    return Object.freeze({
      name: "nested",
      roots,
      visibleRecords: Object.freeze(visible),
      byId,
      breadcrumb: Object.freeze([]),
    });
  },
};
