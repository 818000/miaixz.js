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
 * Implements the tree view types module.
 */

import type { TreeCollection, TreeCollectionRecord } from "./tree-collection.js";
import type { TreeView, TreeViewOptionsMap } from "./tree.types.js";

/**
 * One collection record projected into the current semantic and visual view.
 */
export interface TreeViewRecord<Value = unknown> {
  readonly record: Readonly<TreeCollectionRecord<Value>>;
  readonly visibleParentId: string | null;
  readonly visibleChildIds: readonly string[];
  readonly semanticLevel: number;
  readonly semanticPosition: number;
  readonly semanticSetSize: number;
  readonly visualLevel: number;
  readonly stateExpanded: boolean;
  readonly disclosed: boolean;
  readonly boundary: boolean;
  readonly viewRoot: boolean;
}

/**
 * Complete projection consumed by renderers and keyboard navigation.
 */
export interface TreeViewModel<Value = unknown> {
  readonly name: TreeView;
  readonly roots: readonly TreeViewRecord<Value>[];
  readonly visibleRecords: readonly TreeViewRecord<Value>[];
  readonly byId: ReadonlyMap<string, TreeViewRecord<Value>>;
  readonly breadcrumb: readonly TreeCollectionRecord<Value>[];
}

/**
 * Inputs shared by all built-in view strategies.
 */
export interface TreeViewStrategyInput<Value, View extends TreeView = TreeView> {
  readonly collection: TreeCollection<Value>;
  readonly expandedIds: ReadonlySet<string>;
  readonly viewRootId: string | null;
  readonly options: TreeViewOptionsMap[View];
}

/**
 * Package-private view strategy contract.
 */
export interface TreeViewStrategy {
  readonly name: TreeView;
  createViewModel<Value>(input: TreeViewStrategyInput<Value>): TreeViewModel<Value>;
}
