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
  readonly leading?: ReactNode;
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
      readonly defaultExpansion?: never;
      readonly onExpandedIdsChange?: (ids: readonly string[]) => void;
    }
  | {
      readonly expandedIds?: never;
      readonly defaultExpandedIds: readonly string[];
      readonly defaultExpansion?: never;
      readonly onExpandedIdsChange?: (ids: readonly string[]) => void;
    }
  | {
      readonly expandedIds?: never;
      readonly defaultExpandedIds?: never;
      readonly defaultExpansion?: TreeDefaultExpansion;
      readonly onExpandedIdsChange?: (ids: readonly string[]) => void;
    };

/**
 * Initial expansion policy used only by an uncontrolled Tree.
 */
export type TreeDefaultExpansion = "collapsed" | "all" | { readonly depth: number };

/**
 * Built-in tree presentation strategies.
 */
export type TreeView = "nested" | "compact" | "focus";

/**
 * Options for the hierarchy-preserving nested view.
 */
export interface NestedTreeViewOptions {
  readonly indent?: "standard" | "compact" | "dense";
}

/**
 * Options for the capped-indentation compact view.
 */
export interface CompactTreeViewOptions {
  readonly compression?: "balanced" | "dense";
}

/**
 * Options for the depth-windowed focus view.
 */
export interface FocusTreeViewOptions {
  readonly windowDepth?: number;
  readonly navigation?: "breadcrumb" | "back" | "both";
}

/**
 * Maps each built-in tree view to its exact options.
 */
export interface TreeViewOptionsMap {
  readonly nested: NestedTreeViewOptions;
  readonly compact: CompactTreeViewOptions;
  readonly focus: FocusTreeViewOptions;
}

/**
 * Controlled or uncontrolled focus-root state.
 */
export type TreeViewRootProps =
  | {
      readonly viewRootId: string | null;
      readonly defaultViewRootId?: never;
      readonly onViewRootIdChange?: (id: string | null) => void;
    }
  | {
      readonly viewRootId?: never;
      readonly defaultViewRootId?: string | null;
      readonly onViewRootIdChange?: (id: string | null) => void;
    };

/**
 * Excludes focus-root state from non-focus literal view configurations.
 */
export interface TreeNonFocusRootProps {
  readonly viewRootId?: never;
  readonly defaultViewRootId?: never;
  readonly onViewRootIdChange?: never;
}

/**
 * View selection and the corresponding options and focus-root contract.
 */
export type TreePresentationProps<View extends TreeView = TreeView> = {
  readonly view?: View;
  readonly viewOptions?: TreeViewOptionsMap[View];
} & (View extends "focus" ? TreeViewRootProps : TreeNonFocusRootProps);

/**
 * Optional controls rendered outside the tree keyboard sequence.
 */
export type TreeExpansionControls =
  | boolean
  | {
      readonly expandAll?: boolean;
      readonly collapseAll?: boolean;
      readonly depthOptions?: readonly number[];
      readonly scope?: "tree" | "view";
      readonly label?: string;
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
  readonly view: TreeView;
  readonly itemId: string;
  /**
   * @deprecated Use logicalLevel, semanticLevel, or visualLevel.
   */
  readonly level: number;
  readonly logicalLevel: number;
  readonly semanticLevel: number;
  readonly visualLevel: number;
  readonly stateExpanded: boolean;
  readonly expanded: boolean;
  readonly disclosed: boolean;
  readonly boundary: boolean;
  readonly viewRoot: boolean;
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
  readonly "data-boundary"?: boolean;
  readonly "data-view-root"?: boolean;
  readonly "data-visual-level"?: number;
  readonly "data-logical-level"?: string;
  readonly "data-semantic-level"?: string;
  readonly "data-state-expanded"?: "true" | "false";
  readonly "data-disclosed"?: "true" | "false";
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
  readonly row?: MiaixzSlotProps<TreeOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly expander?: MiaixzSlotProps<TreeOwnerState, TreeIconAttributes>;
  readonly leading?: MiaixzSlotProps<TreeOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly copy?: MiaixzSlotProps<TreeOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly label?: MiaixzSlotProps<TreeOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly description?: MiaixzSlotProps<TreeOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly trailing?: MiaixzSlotProps<TreeOwnerState, HTMLAttributes<HTMLSpanElement>>;
  /**
   * @deprecated Use expander. This alias remains available throughout 0.7.x.
   */
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
  readonly asyncCacheKey?: string | number;
  readonly maxVisibleNodes?: number;
  readonly expansionControls?: TreeExpansionControls;
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
export type MiaixzTreeOwnProps<
  Value = unknown,
  View extends TreeView = TreeView,
> = MiaixzTreeBaseProps<Value> &
  TreeSelectionProps &
  TreeExpansionProps &
  TreePresentationProps<View>;

/**
 * Configures a business-neutral WAI-ARIA tree. @public
 */
export type TreeProps<Value = unknown, View extends TreeView = TreeView> = MiaixzTreeOwnProps<
  Value,
  View
> &
  Omit<HTMLAttributes<HTMLDivElement>, keyof MiaixzTreeOwnProps<Value, View> | "children">;
