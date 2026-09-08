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

import type { HTMLAttributes, ReactNode } from "react";

/**
 * Describes one business-neutral node rendered by Tree.
 *
 * @typeParam Value - Optional consumer-owned value attached to the node.
 * @public
 */
export interface TreeNode<Value = unknown> {
  /**
   * Supplies the globally unique node identifier within one tree.
   */
  readonly id: string;

  /**
   * Supplies the visible node label.
   */
  readonly label: ReactNode;

  /**
   * Supplies supporting hierarchy context below the primary label.
   */
  readonly description?: ReactNode;

  /**
   * Supplies optional metadata aligned to the far edge of the row.
   */
  readonly trailing?: ReactNode;

  /**
   * Supplies optional consumer-owned node data.
   */
  readonly value?: Value;

  /**
   * Supplies already loaded child nodes.
   */
  readonly children?: readonly TreeNode<Value>[];

  /**
   * Indicates that children can be loaded when no child collection is present.
   */
  readonly hasChildren?: boolean;

  /**
   * Prevents node selection and expansion.
   */
  readonly disabled?: boolean;
}

/**
 * Defines Miaixz-owned Tree properties before native div attributes are merged.
 *
 * @typeParam Value - Optional consumer-owned value attached to each node.
 * @public
 */
export interface MiaixzTreeOwnProps<Value = unknown> {
  /**
   * Supplies the complete root node collection.
   */
  nodes: readonly TreeNode<Value>[];

  /**
   * Selects whether nodes are not selectable, singly selectable, or multiply selectable.
   *
   * @defaultValue `"single"`
   */
  selectionMode?: "none" | "single" | "multiple";

  /**
   * Controls the ordered selected-node identifier collection.
   */
  selectedIds?: readonly string[];

  /**
   * Sets the initial uncontrolled selected-node identifier collection.
   */
  defaultSelectedIds?: readonly string[];

  /**
   * Receives requested selected-node identifier changes.
   */
  onSelectedIdsChange?: (ids: readonly string[]) => void;

  /**
   * Controls the ordered expanded-node identifier collection.
   */
  expandedIds?: readonly string[];

  /**
   * Sets the initial uncontrolled expanded-node identifier collection.
   */
  defaultExpandedIds?: readonly string[];

  /**
   * Receives requested expanded-node identifier changes.
   */
  onExpandedIdsChange?: (ids: readonly string[]) => void;

  /**
   * Loads children for nodes that declare children without supplying them.
   */
  loadChildren?: (
    node: Readonly<TreeNode<Value>>,
    signal: AbortSignal,
  ) => Promise<readonly TreeNode<Value>[]>;

  /**
   * Supplies the accessible tree label.
   */
  label: string;

  /**
   * Selects a framed tree, an edge-to-edge directory, or a connected hierarchy outline.
   */
  variant?: "default" | "directory" | "outline";

  /**
   * Controls the selected-row check mark while preserving selection semantics.
   */
  showSelectionIndicator?: boolean;

  /**
   * Displays the computed hierarchy depth without increasing deep-level indentation.
   */
  showLevelIndicator?: boolean;
}

/**
 * Configures a business-neutral WAI-ARIA tree view.
 *
 * @typeParam Value - Optional consumer-owned value attached to each node.
 * @public
 */
export interface TreeProps<Value = unknown>
  extends
    Omit<HTMLAttributes<HTMLDivElement>, keyof MiaixzTreeOwnProps<Value>>,
    MiaixzTreeOwnProps<Value> {}
