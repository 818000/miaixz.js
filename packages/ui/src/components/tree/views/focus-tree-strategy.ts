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
 * Implements the focus tree strategy module.
 */

import type { TreeCollectionRecord } from "../tree-collection.js";
import type {
  TreeViewModel,
  TreeViewRecord,
  TreeViewStrategy,
  TreeViewStrategyInput,
} from "../tree-view.types.js";
import type { FocusTreeViewOptions } from "../tree.types.js";

/**
 * Built-in focus tree strategy.
 */
export const focusTreeStrategy: TreeViewStrategy = {
  name: "focus",
  /**
   * Projects a bounded window rooted at the current focus node.
   * @param input - Current collection, focus root, expansion state, and view options.
   * @returns Focus renderer-facing tree model.
   */
  createViewModel<Value>(input: TreeViewStrategyInput<Value>): TreeViewModel<Value> {
    const options = input.options as FocusTreeViewOptions;
    const windowDepth = options.windowDepth ?? 3;
    const root = input.viewRootId === null ? undefined : input.collection.get(input.viewRootId);
    const sourceRoots = root === undefined ? input.collection.roots : [root];
    const visible: TreeViewRecord<Value>[] = [];
    const byId = new Map<string, TreeViewRecord<Value>>();
    const append = (
      siblings: readonly TreeCollectionRecord<Value>[],
      visibleParentId: string | null,
      semanticLevel: number,
    ): readonly TreeViewRecord<Value>[] => {
      const output: TreeViewRecord<Value>[] = [];
      for (const [index, record] of siblings.entries()) {
        const children = input.collection.getChildren(record.id);
        const stateExpanded = input.expandedIds.has(record.id);
        const boundary = semanticLevel >= windowDepth && record.expandable;
        const disclosed = !boundary && stateExpanded && children.length > 0;
        const viewRecord: TreeViewRecord<Value> = {
          record,
          visibleParentId,
          visibleChildIds: Object.freeze(disclosed ? children.map((child) => child.id) : []),
          semanticLevel,
          semanticPosition: index + 1,
          semanticSetSize: siblings.length,
          visualLevel: semanticLevel - 1,
          stateExpanded,
          disclosed,
          boundary,
          viewRoot: root?.id === record.id,
        };
        visible.push(viewRecord);
        output.push(viewRecord);
        byId.set(record.id, viewRecord);
        if (disclosed) append(children, record.id, semanticLevel + 1);
      }
      return Object.freeze(output);
    };
    const roots = append(sourceRoots, null, 1);
    return Object.freeze({
      name: "focus",
      roots,
      visibleRecords: Object.freeze(visible),
      byId,
      breadcrumb: Object.freeze(
        input.viewRootId === null ? [] : input.collection.getPath(input.viewRootId),
      ),
    });
  },
};
