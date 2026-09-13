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

/* eslint-disable jsdoc/require-jsdoc -- Pure tree keyboard functions are self-describing.
 */
import type { TreeRecord } from "./tree-controller.js";

export type TreeNavigationAction =
  | { readonly kind: "focus"; readonly id: string }
  | { readonly kind: "expand"; readonly id: string }
  | { readonly kind: "collapse"; readonly id: string }
  | { readonly kind: "select"; readonly id: string }
  | { readonly kind: "none" };

export function resolveTreeNavigation<Value>(
  key: string,
  current: TreeRecord<Value>,
  visible: readonly TreeRecord<Value>[],
  expandedIds: ReadonlySet<string>,
  expandable: boolean,
): TreeNavigationAction {
  const currentIndex = visible.findIndex((record) => record.node.id === current.node.id);
  if (key === "ArrowDown") {
    return { kind: "focus", id: visible[Math.min(currentIndex + 1, visible.length - 1)]!.node.id };
  }
  if (key === "ArrowUp") {
    return { kind: "focus", id: visible[Math.max(currentIndex - 1, 0)]!.node.id };
  }
  if (key === "Home") return { kind: "focus", id: visible[0]!.node.id };
  if (key === "End") return { kind: "focus", id: visible[visible.length - 1]!.node.id };
  if (key === "ArrowRight") {
    if (expandable && !expandedIds.has(current.node.id)) {
      return { kind: "expand", id: current.node.id };
    }
    const child = visible[currentIndex + 1];
    return child?.parentId === current.node.id
      ? { kind: "focus", id: child.node.id }
      : { kind: "none" };
  }
  if (key === "ArrowLeft") {
    if (expandedIds.has(current.node.id)) return { kind: "collapse", id: current.node.id };
    return current.parentId === null ? { kind: "none" } : { kind: "focus", id: current.parentId };
  }
  if (key === "Enter" || key === " ") return { kind: "select", id: current.node.id };
  return { kind: "none" };
}

export function findTreeTypeaheadMatch<Value>(
  visible: readonly TreeRecord<Value>[],
  currentId: string,
  query: string,
): TreeRecord<Value> | undefined {
  const start = visible.findIndex((record) => record.node.id === currentId);
  for (let offset = 1; offset <= visible.length; offset += 1) {
    const candidate = visible[(start + offset) % visible.length];
    if (candidate?.node.textValue.trim().toLocaleLowerCase().startsWith(query)) return candidate;
  }
  return undefined;
}
