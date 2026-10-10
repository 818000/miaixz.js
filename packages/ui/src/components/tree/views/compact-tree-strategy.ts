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
 * Implements the compact tree strategy module.
 */

import type { TreeCollectionRecord } from "../tree-collection.js";
import type {
  TreeViewModel,
  TreeViewRecord,
  TreeViewStrategy,
  TreeViewStrategyInput,
} from "../tree-view.types.js";
import type { CompactTreeViewOptions } from "../tree.types.js";

/**
 * Maps logical depth to a stable compact visual indentation slot.
 * @param logicalLevel - One-based source depth.
 * @param compression - Balanced or dense indentation policy.
 * @returns A capped zero-based visual indentation slot.
 */
export function getCompactTreeVisualLevel(
  logicalLevel: number,
  compression: NonNullable<CompactTreeViewOptions["compression"]>,
): number {
  if (compression === "dense") return Math.min(Math.max(logicalLevel - 1, 0), 3);
  return Math.min(Math.max(logicalLevel - 1, 0), 5);
}

/**
 * Built-in compact tree strategy.
 */
export const compactTreeStrategy: TreeViewStrategy = {
  name: "compact",
  /**
   * Projects the collection through capped visual indentation slots.
   * @param input - Current collection and presentation state.
   * @returns Compact renderer-facing tree model.
   */
  createViewModel<Value>(input: TreeViewStrategyInput<Value>): TreeViewModel<Value> {
    const options = input.options as CompactTreeViewOptions;
    const compression = options.compression ?? "balanced";
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
        const viewRecord: TreeViewRecord<Value> = {
          record,
          visibleParentId,
          visibleChildIds: Object.freeze(disclosed ? children.map((child) => child.id) : []),
          semanticLevel: record.logicalLevel,
          semanticPosition: index + 1,
          semanticSetSize: siblings.length,
          visualLevel: getCompactTreeVisualLevel(record.logicalLevel, compression),
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
      name: "compact",
      roots,
      visibleRecords: Object.freeze(visible),
      byId,
      breadcrumb: Object.freeze([]),
    });
  },
};
