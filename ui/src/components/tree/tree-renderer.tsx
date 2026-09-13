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

/* eslint-disable jsdoc/require-jsdoc -- Fixed tree DOM renderer is internal.
 */
import type { KeyboardEvent, MouseEvent, RefObject } from "react";

import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import { Icon } from "../icon/icon.js";
import {
  isTreeNodeExpandable,
  resolveTreeChildren,
  type TreeIndex,
  type TreeRecord,
} from "./tree-controller.js";
import type { TreeNode, TreeOwnerState, TreeSlotProps } from "./tree.types.js";

export interface TreeRendererProps<Value> {
  readonly nodes: readonly TreeNode<Value>[];
  readonly index: TreeIndex<Value>;
  readonly childCache: ReadonlyMap<string, readonly TreeNode<Value>[]>;
  readonly expandedIds: ReadonlySet<string>;
  readonly selectedIds: ReadonlySet<string>;
  readonly loadingIds: ReadonlySet<string>;
  readonly errorIds: ReadonlySet<string>;
  readonly focusedId: string | null;
  readonly selectionMode: "none" | "single" | "multiple";
  readonly surface: TreeOwnerState["surface"];
  readonly connectors: boolean;
  readonly dividerStyle: TreeOwnerState["dividerStyle"];
  readonly density: TreeOwnerState["density"];
  readonly slotProps: TreeSlotProps | undefined;
  readonly itemRefs: RefObject<Map<string, HTMLDivElement>>;
  readonly errorLabel: string;
  readonly retryLabel: string;
  readonly onFocus: (id: string) => void;
  readonly onSelect: (node: Readonly<TreeNode<Value>>) => void;
  readonly onToggle: (node: Readonly<TreeNode<Value>>) => void;
  readonly onRetry: (node: Readonly<TreeNode<Value>>) => void;
  readonly onKeyDown: (event: KeyboardEvent<HTMLDivElement>, record: TreeRecord<Value>) => void;
}

export function TreeRenderer<Value>(props: TreeRendererProps<Value>) {
  const renderNodes = (nodes: readonly TreeNode<Value>[]) =>
    nodes.map((node) => {
      const record = props.index.byId.get(node.id)!;
      const children = resolveTreeChildren(node, props.childCache);
      const expandable = isTreeNodeExpandable(node, props.childCache);
      const expanded = expandable && props.expandedIds.has(node.id);
      const selected = props.selectedIds.has(node.id);
      const loading = props.loadingIds.has(node.id);
      const error = props.errorIds.has(node.id);
      const state = loading
        ? "loading"
        : error
          ? "error"
          : !expandable
            ? "leaf"
            : expanded
              ? "expanded"
              : "collapsed";
      const ownerState: TreeOwnerState = {
        surface: props.surface,
        connectors: props.connectors,
        dividerStyle: props.dividerStyle,
        density: props.density,
        selectionMode: props.selectionMode,
        itemId: node.id,
        level: record.level,
        expanded,
        selected,
        disabled: node.disabled === true,
        loading,
        error,
      };
      return (
        <div
          {...mergeMiaixzSlotProps({
            ownerState,
            defaultProps: { className: "miaixz-tree-item" },
            slotProps: props.slotProps?.item,
            internalRef: (element: HTMLDivElement | null) => {
              if (element === null) props.itemRefs.current.delete(node.id);
              else props.itemRefs.current.set(node.id, element);
            },
            internalProps: {
              role: "treeitem",
              "aria-label": node.textValue,
              tabIndex: node.id === props.focusedId ? 0 : -1,
              "aria-level": record.level,
              "aria-posinset": record.position,
              "aria-setsize": record.setSize,
              "aria-expanded": expandable ? expanded : undefined,
              "aria-selected": props.selectionMode === "none" ? undefined : selected,
              "aria-disabled": node.disabled || undefined,
              "aria-busy": loading || undefined,
              "data-state": state,
              ...(node.disabled === true ? { "data-disabled": true } : {}),
              onFocus: () => props.onFocus(node.id),
              onKeyDown: (event) => props.onKeyDown(event, record),
            },
            ownedProps: [
              "role",
              "aria-label",
              "tabIndex",
              "aria-level",
              "aria-posinset",
              "aria-setsize",
              "aria-expanded",
              "aria-selected",
              "aria-disabled",
              "aria-busy",
              "data-state",
              "data-disabled",
            ],
          })}
          key={node.id}
        >
          <div
            className="miaixz-tree-row"
            onClick={() => {
              props.onFocus(node.id);
              props.onSelect(node);
            }}
          >
            <span
              {...mergeMiaixzSlotProps({
                ownerState,
                defaultProps: { className: "miaixz-tree-expander" },
                slotProps: props.slotProps?.icon,
                internalProps: {
                  "aria-hidden": true,
                  "data-state": expandable ? (expanded ? "expanded" : "collapsed") : "leaf",
                  onClick: (event: MouseEvent<HTMLSpanElement>) => {
                    event.stopPropagation();
                    props.onFocus(node.id);
                    if (expandable) props.onToggle(node);
                  },
                },
                ownedProps: ["aria-hidden"],
              })}
            >
              {loading ? (
                <span
                  {...mergeMiaixzSlotProps({
                    ownerState,
                    defaultProps: { className: "miaixz-tree-loading-indicator" },
                    slotProps: props.slotProps?.loadingIndicator,
                  })}
                >
                  <Icon name="LoaderCircle" size="control" className="miaixz-icon-spin" />
                </span>
              ) : expandable ? (
                <Icon name={expanded ? "ChevronDown" : "ChevronRight"} size="control" />
              ) : null}
            </span>
            <span className="miaixz-tree-copy">
              <span
                {...mergeMiaixzSlotProps({
                  ownerState,
                  defaultProps: { className: "miaixz-tree-label" },
                  slotProps: props.slotProps?.label,
                })}
              >
                {node.label}
              </span>
              {node.description !== undefined && (
                <span className="miaixz-tree-description">{node.description}</span>
              )}
            </span>
            {node.trailing !== undefined && (
              <span className="miaixz-tree-trailing">{node.trailing}</span>
            )}
            {selected && props.selectionMode !== "none" && (
              <Icon name="Check" size="control" className="miaixz-tree-selection" />
            )}
          </div>
          {error && (
            <div
              {...mergeMiaixzSlotProps({
                ownerState,
                defaultProps: { className: "miaixz-tree-error" },
                slotProps: props.slotProps?.error,
                internalProps: { role: "alert" },
                ownedProps: ["role"],
              })}
            >
              <span>{props.errorLabel}</span>
              <button
                type="button"
                className="miaixz-tree-retry"
                onClick={(event) => {
                  event.stopPropagation();
                  props.onRetry(node);
                }}
              >
                <Icon name="RotateCcw" size="indicator" />
                {props.retryLabel}
              </button>
            </div>
          )}
          {expanded && children !== undefined && children.length > 0 && (
            <div
              {...mergeMiaixzSlotProps({
                ownerState,
                defaultProps: { className: "miaixz-tree-group" },
                slotProps: props.slotProps?.childrenGroup,
                internalProps: { role: "group" },
                ownedProps: ["role"],
              })}
            >
              {renderNodes(children)}
            </div>
          )}
        </div>
      );
    });
  return <>{renderNodes(props.nodes)}</>;
}
