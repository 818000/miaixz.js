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
 * Defines the tree public type contracts.
 */

import type { HTMLAttributes, ReactNode } from "react";

import type { MiaixzSlotProps } from "../../shared/slots.js";

/**
 * Tree item identity, application value, display content, and optional child-loading metadata.
 */
export interface TreeNode<Value = unknown> {
  readonly id: string;
  readonly label: ReactNode;
  readonly textValue: string;
  readonly description?: ReactNode;
  readonly trailing?: ReactNode;
  readonly value?: Value;
  readonly children?: readonly TreeNode<Value>[];
  readonly hasChildren?: boolean;
  readonly disabled?: boolean;
}

/**
 * Mutually exclusive controlled or uncontrolled tree-selection settings.
 */
export type TreeSelectionProps =
  | {
      readonly selectionMode: "none";
      readonly selectedIds?: never;
      readonly defaultSelectedIds?: never;
      readonly onSelectedIdsChange?: never;
    }
  | ({ readonly selectionMode?: "single" | "multiple" } & (
      | {
          readonly selectedIds: readonly string[];
          readonly defaultSelectedIds?: never;
          readonly onSelectedIdsChange?: (ids: readonly string[]) => void;
        }
      | {
          readonly selectedIds?: never;
          readonly defaultSelectedIds?: readonly string[];
          readonly onSelectedIdsChange?: (ids: readonly string[]) => void;
        }
    ));

/**
 * Mutually exclusive controlled or uncontrolled expanded-node settings.
 */
export type TreeExpansionProps =
  | {
      readonly expandedIds: readonly string[];
      readonly defaultExpandedIds?: never;
      readonly onExpandedIdsChange?: (ids: readonly string[]) => void;
    }
  | {
      readonly expandedIds?: never;
      readonly defaultExpandedIds?: readonly string[];
      readonly onExpandedIdsChange?: (ids: readonly string[]) => void;
    };

/**
 * Tree surface treatments permitted by the component contract.
 */
export type TreeSurface = "framed" | "plain";
/**
 * Tree divider treatments permitted by the component contract.
 */
export type TreeDividerStyle = "none" | "dashed";
/**
 * Tree spacing densities permitted by the component contract.
 */
export type TreeDensity = "compact" | "standard" | "comfortable";

/**
 * Resolved Tree state exposed to theme and slot overrides.
 */
export interface TreeOwnerState {
  readonly surface: TreeSurface;
  readonly connectors: boolean;
  readonly dividerStyle: TreeDividerStyle;
  readonly density: TreeDensity;
  readonly selectionMode: "none" | "single" | "multiple";
  readonly itemId: string;
  readonly level: number;
  readonly expanded: boolean;
  readonly selected: boolean;
  readonly disabled: boolean;
  readonly loading: boolean;
  readonly error: boolean;
}

/**
 * Attributes accepted by the Tree Item slot.
 */
export interface TreeItemAttributes extends HTMLAttributes<HTMLDivElement> {
  readonly "data-state"?: "leaf" | "collapsed" | "expanded" | "loading" | "error";
  readonly "data-disabled"?: boolean;
}

/**
 * Attributes accepted by the Tree Icon slot.
 */
export interface TreeIconAttributes extends HTMLAttributes<HTMLSpanElement> {
  readonly "data-state"?: "leaf" | "collapsed" | "expanded";
}

/**
 * Per-slot attributes and state-dependent override callbacks for Tree.
 */
export interface TreeSlotProps {
  readonly item?: MiaixzSlotProps<TreeOwnerState, TreeItemAttributes>;
  readonly label?: MiaixzSlotProps<TreeOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly icon?: MiaixzSlotProps<TreeOwnerState, TreeIconAttributes>;
  readonly childrenGroup?: MiaixzSlotProps<TreeOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly loadingIndicator?: MiaixzSlotProps<TreeOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly error?: MiaixzSlotProps<TreeOwnerState, HTMLAttributes<HTMLDivElement>>;
}

/**
 * Component-specific Tree properties composed with the permitted native attributes.
 */
export interface MiaixzTreeBaseProps<Value = unknown> {
  readonly nodes: readonly TreeNode<Value>[];
  readonly label: string;
  readonly loadChildren?: (
    node: Readonly<TreeNode<Value>>,
    signal: AbortSignal,
  ) => Promise<readonly TreeNode<Value>[]>;
  readonly surface?: TreeSurface;
  readonly connectors?: boolean;
  readonly dividerStyle?: TreeDividerStyle;
  readonly density?: TreeDensity;
  readonly showSelectionIndicator?: boolean;
  readonly slotProps?: TreeSlotProps;
}

/**
 * Component-specific Tree properties composed with the permitted native attributes.
 */
export type MiaixzTreeOwnProps<Value = unknown> = MiaixzTreeBaseProps<Value> &
  TreeSelectionProps &
  TreeExpansionProps;

/**
 * Configures a business-neutral WAI-ARIA tree. @public
 */
export type TreeProps<Value = unknown> = MiaixzTreeOwnProps<Value> &
  Omit<HTMLAttributes<HTMLDivElement>, keyof MiaixzTreeOwnProps<Value> | "children">;
