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
 * Implements the immutable, renderer-independent tree data collection.
 */

import { MiaixzUiError } from "../../errors/ui-error.js";
import type { TreeNode } from "./tree.types.js";

/**
 * Selects the nodes considered by a bulk tree operation.
 */
export type TreeExpansionScope =
  | { readonly type: "tree" }
  | { readonly type: "subtree"; readonly id: string }
  | { readonly type: "siblings"; readonly id: string };

/**
 * One validated node and its immutable hierarchy metadata.
 */
export interface TreeCollectionRecord<Value = unknown> {
  readonly node: Readonly<TreeNode<Value>>;
  readonly id: string;
  readonly parentId: string | null;
  readonly childIds: readonly string[];
  readonly logicalLevel: number;
  readonly position: number;
  readonly setSize: number;
  readonly loaded: boolean;
  readonly expandable: boolean;
}

/**
 * Public read-only tree data and hierarchy queries.
 */
export interface TreeCollection<Value = unknown> {
  readonly roots: readonly TreeCollectionRecord<Value>[];
  readonly byId: ReadonlyMap<string, TreeCollectionRecord<Value>>;
  readonly size: number;
  get(id: string): TreeCollectionRecord<Value> | undefined;
  getParent(id: string): TreeCollectionRecord<Value> | undefined;
  getChildren(id: string | null): readonly TreeCollectionRecord<Value>[];
  getAncestors(id: string): readonly TreeCollectionRecord<Value>[];
  getDescendants(id: string): readonly TreeCollectionRecord<Value>[];
  getPath(id: string): readonly TreeCollectionRecord<Value>[];
  getExpandableIds(scope?: TreeExpansionScope): readonly string[];
}

/**
 * Resolves static children before an asynchronously loaded cache entry.
 * @param node - Source node whose effective children are requested.
 * @param childCache - Asynchronously loaded children keyed by parent identifier.
 * @returns Static children when present, otherwise the cached asynchronous children.
 */
export function resolveTreeCollectionChildren<Value>(
  node: Readonly<TreeNode<Value>>,
  childCache: ReadonlyMap<string, readonly TreeNode<Value>[]>,
): readonly TreeNode<Value>[] | undefined {
  return node.children !== undefined ? node.children : childCache.get(node.id);
}

/**
 * Builds one immutable tree collection in source order.
 * @param nodes - Root source nodes in stable application order.
 * @param childCache - Asynchronously loaded children keyed by parent identifier.
 * @returns An indexed, immutable collection for the supplied tree snapshot.
 */
export function createTreeCollection<Value>(
  nodes: readonly TreeNode<Value>[],
  childCache: ReadonlyMap<string, readonly TreeNode<Value>[]> = new Map(),
): TreeCollection<Value> {
  const byId = new Map<string, TreeCollectionRecord<Value>>();
  const pathCache = new Map<string, readonly TreeCollectionRecord<Value>[]>();

  const visit = (
    siblings: readonly TreeNode<Value>[],
    parentId: string | null,
    logicalLevel: number,
  ): readonly TreeCollectionRecord<Value>[] => {
    const records: TreeCollectionRecord<Value>[] = [];
    for (const [index, node] of siblings.entries()) {
      if (node.textValue.trim().length === 0) {
        throw new MiaixzUiError({ code: "UI_TREE_TEXT_VALUE_INVALID", details: { id: node.id } });
      }
      if (byId.has(node.id) || node.id === parentId) {
        throw new MiaixzUiError({ code: "UI_TREE_DUPLICATE_ID", details: { id: node.id } });
      }
      const children = resolveTreeCollectionChildren(node, childCache);
      const childIds = Object.freeze((children ?? []).map((child) => child.id));
      const record: TreeCollectionRecord<Value> = Object.freeze({
        node,
        id: node.id,
        parentId,
        childIds,
        logicalLevel,
        position: index + 1,
        setSize: siblings.length,
        loaded: children !== undefined,
        expandable: children === undefined ? node.hasChildren === true : children.length > 0,
      });
      byId.set(node.id, record);
      records.push(record);
      if (children !== undefined) visit(children, node.id, logicalLevel + 1);
    }
    return Object.freeze(records);
  };

  const roots = visit(nodes, null, 1);
  const requireRecord = (id: string): TreeCollectionRecord<Value> => {
    const record = byId.get(id);
    if (record === undefined) {
      throw new MiaixzUiError({ code: "UI_TREE_CONFIG_INVALID", details: { id } });
    }
    return record;
  };
  const getChildren = (id: string | null): readonly TreeCollectionRecord<Value>[] => {
    if (id === null) return roots;
    return Object.freeze(requireRecord(id).childIds.map((childId) => requireRecord(childId)));
  };
  const getPath = (id: string): readonly TreeCollectionRecord<Value>[] => {
    const cached = pathCache.get(id);
    if (cached !== undefined) return cached;
    const path: TreeCollectionRecord<Value>[] = [];
    let current: TreeCollectionRecord<Value> | undefined = requireRecord(id);
    while (current !== undefined) {
      path.unshift(current);
      current = current.parentId === null ? undefined : byId.get(current.parentId);
    }
    const result = Object.freeze(path);
    pathCache.set(id, result);
    return result;
  };
  const getDescendants = (id: string): readonly TreeCollectionRecord<Value>[] => {
    const descendants: TreeCollectionRecord<Value>[] = [];
    const append = (parentId: string) => {
      for (const child of getChildren(parentId)) {
        descendants.push(child);
        append(child.id);
      }
    };
    requireRecord(id);
    append(id);
    return Object.freeze(descendants);
  };
  const getScopeRoots = (scope: TreeExpansionScope): readonly TreeCollectionRecord<Value>[] => {
    if (scope.type === "tree") return roots;
    const record = requireRecord(scope.id);
    return scope.type === "subtree" ? [record] : getChildren(record.parentId);
  };

  return Object.freeze({
    roots,
    byId: byId as ReadonlyMap<string, TreeCollectionRecord<Value>>,
    size: byId.size,
    get: (id: string) => byId.get(id),
    getParent: (id: string) => {
      const parentId = requireRecord(id).parentId;
      return parentId === null ? undefined : byId.get(parentId);
    },
    getChildren,
    getAncestors: (id: string) => Object.freeze(getPath(id).slice(0, -1)),
    getDescendants,
    getPath,
    getExpandableIds: (scope: TreeExpansionScope = { type: "tree" }) => {
      const ids: string[] = [];
      const append = (record: TreeCollectionRecord<Value>) => {
        if (record.expandable) ids.push(record.id);
        for (const child of getChildren(record.id)) append(child);
      };
      for (const root of getScopeRoots(scope)) append(root);
      return Object.freeze([...new Set(ids)]);
    },
  });
}
