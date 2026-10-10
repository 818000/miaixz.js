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
 * Resolves tree keyboard navigation into focus, expansion, and selection commands.
 */

import type { TreeViewRecord } from "./tree-view.types.js";

/**
 * Keyboard-navigation commands interpreted by the tree controller.
 */
export type TreeNavigationAction =
  | { readonly kind: "focus"; readonly id: string }
  | { readonly kind: "expand"; readonly id: string }
  | { readonly kind: "collapse"; readonly id: string }
  | { readonly kind: "expand-siblings"; readonly id: string }
  | { readonly kind: "enter"; readonly id: string }
  | { readonly kind: "select"; readonly id: string }
  | { readonly kind: "none" };

/**
 * Resolves one keyboard key into a deterministic tree navigation action.
 *
 * @typeParam Value - Application value stored by each tree node.
 * @param key - Keyboard key to interpret.
 * @param current - Currently focused tree record.
 * @param visible - Visible tree records in display order.
 * @param expandedIds - Identifiers of expanded nodes.
 * @param expandable - Whether the current node can expand.
 * @returns Navigation action for the tree controller.
 */
export function resolveTreeNavigation<Value>(
  key: string,
  current: TreeViewRecord<Value>,
  visible: readonly TreeViewRecord<Value>[],
  expandedIds: ReadonlySet<string>,
  expandable: boolean,
): TreeNavigationAction {
  const currentIndex = visible.findIndex((record) => record.record.id === current.record.id);
  if (key === "ArrowDown") {
    return {
      kind: "focus",
      id: visible[Math.min(currentIndex + 1, visible.length - 1)]!.record.id,
    };
  }
  if (key === "ArrowUp") {
    return { kind: "focus", id: visible[Math.max(currentIndex - 1, 0)]!.record.id };
  }
  if (key === "Home") return { kind: "focus", id: visible[0]!.record.id };
  if (key === "End") return { kind: "focus", id: visible[visible.length - 1]!.record.id };
  if (key === "*") return { kind: "expand-siblings", id: current.record.id };
  if (key === "ArrowRight") {
    if (current.boundary) return { kind: "enter", id: current.record.id };
    if (expandable && !expandedIds.has(current.record.id)) {
      return { kind: "expand", id: current.record.id };
    }
    const child = visible[currentIndex + 1];
    return child?.visibleParentId === current.record.id
      ? { kind: "focus", id: child.record.id }
      : { kind: "none" };
  }
  if (key === "ArrowLeft") {
    if (expandedIds.has(current.record.id)) return { kind: "collapse", id: current.record.id };
    return current.visibleParentId === null
      ? { kind: "none" }
      : { kind: "focus", id: current.visibleParentId };
  }
  if (key === "Enter" || key === " ") return { kind: "select", id: current.record.id };
  return { kind: "none" };
}

/**
 * Finds the next cyclic tree record whose text begins with a typeahead query.
 *
 * @typeParam Value - Application value stored by each tree node.
 * @param visible - Visible tree records in display order.
 * @param currentId - Identifier from which cyclic search begins.
 * @param query - Normalized lowercase typeahead text.
 * @returns Matching record, or undefined when no visible record matches.
 */
export function findTreeTypeaheadMatch<Value>(
  visible: readonly TreeViewRecord<Value>[],
  currentId: string,
  query: string,
): TreeViewRecord<Value> | undefined {
  const start = visible.findIndex((record) => record.record.id === currentId);
  for (let offset = 1; offset <= visible.length; offset += 1) {
    const candidate = visible[(start + offset) % visible.length];
    if (candidate?.record.node.textValue.trim().toLocaleLowerCase().startsWith(query)) {
      return candidate;
    }
  }
  return undefined;
}
