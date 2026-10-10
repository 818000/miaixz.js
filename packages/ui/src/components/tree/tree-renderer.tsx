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
 * Implements the tree renderer module.
 */

import type { MouseEvent } from "react";

import { Icon } from "@miaixz/icons";

import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import type { TreeViewRecord } from "./tree-view.types.js";
import type { TreeController } from "./use-tree.js";
import type { TreeOwnerState, TreeSlotProps } from "./tree.types.js";

/**
 * Properties accepted by the Tree view-model renderer.
 */
export interface TreeRendererProps<Value> {
  readonly controller: TreeController<Value>;
  readonly selectionMode: "none" | "single" | "multiple";
  readonly showSelectionIndicator: boolean;
  readonly surface: TreeOwnerState["surface"];
  readonly connectors: boolean;
  readonly dividerStyle: TreeOwnerState["dividerStyle"];
  readonly density: TreeOwnerState["density"];
  readonly slotProps: TreeSlotProps | undefined;
  readonly errorLabel: string;
  readonly retryLabel: string;
}

/**
 * Renders nested semantic groups from one flat, indexed view model.
 * @param props - View model, slot configuration, styling state, and controller interactions.
 * @returns The semantic treeitem and group hierarchy for the current view model.
 */
export function TreeRenderer<Value>(props: TreeRendererProps<Value>) {
  const renderRecord = (viewRecord: TreeViewRecord<Value>) => {
    const node = viewRecord.record.node;
    const id = viewRecord.record.id;
    const selected = props.controller.state.selectedIds.has(id);
    const loading = props.controller.state.loadingIds.has(id);
    const error = props.controller.state.errorIds.has(id);
    const expandable = viewRecord.record.expandable;
    const state = loading
      ? "loading"
      : error
        ? "error"
        : !expandable
          ? "leaf"
          : viewRecord.disclosed
            ? "expanded"
            : "collapsed";
    const ownerState: TreeOwnerState = {
      surface: props.surface,
      connectors: props.connectors,
      dividerStyle: props.dividerStyle,
      density: props.density,
      selectionMode: props.selectionMode,
      view: props.controller.view.name,
      itemId: id,
      level: viewRecord.record.logicalLevel,
      logicalLevel: viewRecord.record.logicalLevel,
      semanticLevel: viewRecord.semanticLevel,
      visualLevel: viewRecord.visualLevel,
      stateExpanded: viewRecord.stateExpanded,
      expanded: viewRecord.stateExpanded,
      disclosed: viewRecord.disclosed,
      boundary: viewRecord.boundary,
      viewRoot: viewRecord.viewRoot,
      selected,
      disabled: node.disabled === true,
      loading,
      error,
    };
    const itemInteraction = props.controller.getItemProps(id);
    const { ref: itemRef, ...itemInteractionProps } = itemInteraction;
    const expanderInteraction = props.controller.getExpanderProps(id);
    const descriptionId = itemInteraction["aria-describedby"];
    const children = viewRecord.visibleChildIds
      .map((childId) => props.controller.view.byId.get(childId))
      .filter((child): child is TreeViewRecord<Value> => child !== undefined);
    return (
      <div
        {...mergeMiaixzSlotProps({
          ownerState,
          defaultProps: { className: "miaixz-tree-item" },
          slotProps: props.slotProps?.item,
          internalRef: itemRef,
          internalProps: {
            ...itemInteractionProps,
            "data-state": state,
            ...(node.disabled === true ? { "data-disabled": true } : {}),
            ...(viewRecord.boundary ? { "data-boundary": true } : {}),
            ...(viewRecord.viewRoot ? { "data-view-root": true } : {}),
            "data-visual-level": viewRecord.visualLevel,
            "data-logical-level": String(viewRecord.record.logicalLevel),
            "data-semantic-level": String(viewRecord.semanticLevel),
            "data-state-expanded": String(viewRecord.stateExpanded) as "true" | "false",
            "data-disclosed": String(viewRecord.disclosed) as "true" | "false",
          },
          ownedProps: [
            "role",
            "aria-label",
            "aria-describedby",
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
            "data-boundary",
            "data-view-root",
            "data-visual-level",
            "data-logical-level",
            "data-semantic-level",
            "data-state-expanded",
            "data-disclosed",
          ],
        })}
        key={id}
      >
        <div
          className="miaixz-tree-row"
          onClick={() => {
            props.controller.actions.focus(id);
            props.controller.actions.select(id);
          }}
        >
          <span
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-tree-expander" },
              slotProps: props.slotProps?.expander ?? props.slotProps?.icon,
              internalProps: {
                ...expanderInteraction,
                "data-state": expandable
                  ? viewRecord.disclosed
                    ? "expanded"
                    : "collapsed"
                  : "leaf",
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
                <Icon name="loading" size="control" className="miaixz-icon-spin" />
              </span>
            ) : expandable ? (
              <Icon name={viewRecord.disclosed ? "chevron-down" : "chevron-right"} size="control" />
            ) : null}
          </span>
          {node.leading === undefined ? null : (
            <span
              {...mergeMiaixzSlotProps({
                ownerState,
                defaultProps: { className: "miaixz-tree-leading" },
                slotProps: props.slotProps?.leading,
              })}
            >
              {node.leading}
            </span>
          )}
          <span
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-tree-copy" },
              slotProps: props.slotProps?.copy,
            })}
          >
            <span
              {...mergeMiaixzSlotProps({
                ownerState,
                defaultProps: { className: "miaixz-tree-label" },
                slotProps: props.slotProps?.label,
              })}
            >
              {node.label}
            </span>
            {node.description === undefined ? null : (
              <span
                {...mergeMiaixzSlotProps({
                  ownerState,
                  defaultProps: { className: "miaixz-tree-description" },
                  slotProps: props.slotProps?.description,
                  internalProps: { id: descriptionId },
                  ownedProps: ["id"],
                })}
              >
                {node.description}
              </span>
            )}
          </span>
          {node.trailing === undefined ? null : (
            <span
              {...mergeMiaixzSlotProps({
                ownerState,
                defaultProps: { className: "miaixz-tree-trailing" },
                slotProps: props.slotProps?.trailing,
              })}
            >
              {node.trailing}
            </span>
          )}
          {selected && props.selectionMode !== "none" && props.showSelectionIndicator ? (
            <Icon name="confirm" size="control" className="miaixz-tree-selection" />
          ) : null}
        </div>
        {error ? (
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
              onClick={(event: MouseEvent<HTMLButtonElement>) => {
                event.stopPropagation();
                void props.controller.actions.retry(id).catch(() => undefined);
              }}
            >
              <Icon name="rotate-ccw" size="indicator" />
              {props.retryLabel}
            </button>
          </div>
        ) : null}
        {viewRecord.disclosed && children.length > 0 ? (
          <div
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-tree-group" },
              slotProps: props.slotProps?.childrenGroup,
              internalProps: { role: "group" },
              ownedProps: ["role"],
            })}
          >
            {children.map(renderRecord)}
          </div>
        ) : null}
      </div>
    );
  };
  return <>{props.controller.view.roots.map(renderRecord)}</>;
}
