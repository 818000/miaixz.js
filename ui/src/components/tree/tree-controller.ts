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

/* eslint-disable jsdoc/require-jsdoc -- Internal tree controller is covered through Tree.
 */
import { MiaixzUiError } from "../../errors/ui-error.js";
import type { TreeNode } from "./tree.types.js";

export interface TreeRecord<Value> {
  readonly node: Readonly<TreeNode<Value>>;
  readonly parentId: string | null;
  readonly level: number;
  readonly position: number;
  readonly setSize: number;
}

export interface TreeIndex<Value> {
  readonly byId: ReadonlyMap<string, TreeRecord<Value>>;
  readonly roots: readonly TreeNode<Value>[];
}

export function resolveTreeChildren<Value>(
  node: Readonly<TreeNode<Value>>,
  childCache: ReadonlyMap<string, readonly TreeNode<Value>[]>,
): readonly TreeNode<Value>[] | undefined {
  return node.children ?? childCache.get(node.id);
}

export function isTreeNodeExpandable<Value>(
  node: Readonly<TreeNode<Value>>,
  childCache: ReadonlyMap<string, readonly TreeNode<Value>[]>,
): boolean {
  const children = resolveTreeChildren(node, childCache);
  return children === undefined ? node.hasChildren === true : children.length > 0;
}

export function buildTreeIndex<Value>(
  nodes: readonly TreeNode<Value>[],
  childCache: ReadonlyMap<string, readonly TreeNode<Value>[]>,
): TreeIndex<Value> {
  const byId = new Map<string, TreeRecord<Value>>();
  const visit = (siblings: readonly TreeNode<Value>[], parentId: string | null, level: number) => {
    siblings.forEach((node, index) => {
      if (node.textValue.trim().length === 0) {
        throw new MiaixzUiError({
          code: "UI_TREE_TEXT_VALUE_INVALID",
          details: { id: node.id },
        });
      }
      if (byId.has(node.id)) {
        throw new MiaixzUiError({
          code: "UI_TREE_DUPLICATE_ID",
          details: { id: node.id },
        });
      }
      byId.set(node.id, {
        node,
        parentId,
        level,
        position: index + 1,
        setSize: siblings.length,
      });
      const children = resolveTreeChildren(node, childCache);
      if (children !== undefined) visit(children, node.id, level + 1);
    });
  };
  visit(nodes, null, 1);
  return { byId, roots: nodes };
}

export function getVisibleTreeRecords<Value>(
  index: TreeIndex<Value>,
  childCache: ReadonlyMap<string, readonly TreeNode<Value>[]>,
  expandedIds: ReadonlySet<string>,
): readonly TreeRecord<Value>[] {
  const visible: TreeRecord<Value>[] = [];
  const append = (nodes: readonly TreeNode<Value>[]) => {
    for (const node of nodes) {
      const record = index.byId.get(node.id);
      if (record === undefined) continue;
      visible.push(record);
      if (!expandedIds.has(node.id)) continue;
      const children = resolveTreeChildren(node, childCache);
      if (children !== undefined) append(children);
    }
  };
  append(index.roots);
  if (visible.length > 1000) {
    throw new MiaixzUiError({
      code: "UI_TREE_VISIBLE_LIMIT",
      details: { visibleCount: visible.length, limit: 1000 },
    });
  }
  return visible;
}

export function normalizeTreeIds(ids: readonly string[]): readonly string[] {
  return [...new Set(ids)];
}

export function resolveTreeFocusedId<Value>(
  focusedId: string | null,
  selectedIds: readonly string[],
  visible: readonly TreeRecord<Value>[],
  index: TreeIndex<Value>,
): string | null {
  const visibleIds = new Set(visible.map((record) => record.node.id));
  let candidate = focusedId;
  while (candidate !== null) {
    if (visibleIds.has(candidate)) return candidate;
    candidate = index.byId.get(candidate)?.parentId ?? null;
  }
  return selectedIds.find((id) => visibleIds.has(id)) ?? visible[0]?.node.id ?? null;
}
