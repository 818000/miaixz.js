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
 * Implements the tree expansion controls module.
 */

import { Button } from "../button/button.js";
import { Dropdown } from "../dropdown/dropdown.js";
import { MiaixzUiError } from "../../errors/ui-error.js";
import type { TreeExpansionScope } from "./tree-collection.js";
import type { TreeController } from "./use-tree.js";
import type { TreeExpansionControls, TreeViewMode } from "./tree.types.js";

/**
 * Labels required by the Tree expansion command group.
 */
export interface TreeExpansionControlLabels {
  readonly defaultLabel: string;
  readonly expandAll: string;
  readonly collapseAll: string;
  readonly expandToDepth: string;
  readonly depth: (depth: number) => string;
}

/**
 * Properties accepted by the Tree expansion command group.
 */
export interface TreeExpansionControlsProps<Value> {
  readonly controller: TreeController<Value>;
  readonly config: TreeExpansionControls;
  readonly view: TreeViewMode;
  readonly labels: TreeExpansionControlLabels;
}

/**
 * Renders normalized expand, collapse, and depth actions.
 * @param props - Expansion configuration, labels, view name, and controller actions.
 * @returns The configured expansion command group, or null when no commands are enabled.
 */
export function TreeExpansionControlsView<Value>(props: TreeExpansionControlsProps<Value>) {
  if (props.config === false) return null;
  const objectConfig = typeof props.config === "object" ? props.config : {};
  const showExpand = objectConfig.expandAll ?? true;
  const showCollapse = objectConfig.collapseAll ?? true;
  const scopeType = objectConfig.scope ?? "view";
  const depths: number[] = [];
  for (const depth of objectConfig.depthOptions ?? []) {
    if (!Number.isInteger(depth) || depth < 1) {
      throw new MiaixzUiError({
        code: "UI_TREE_CONFIG_INVALID",
        details: { option: "expansionControls.depthOptions" },
      });
    }
    if (!depths.includes(depth)) depths.push(depth);
  }
  if (!showExpand && !showCollapse && depths.length === 0) return null;
  const scope: TreeExpansionScope =
    scopeType === "view" && props.view === "focus" && props.controller.state.viewRootId !== null
      ? { type: "subtree", id: props.controller.state.viewRootId }
      : { type: "tree" };
  const disabled = props.controller.state.batchPending || props.controller.state.expansionReadOnly;
  const canExpand = props.controller.collection.getExpandableIds(scope).some((id) => {
    const record = props.controller.collection.get(id);
    return record?.loaded === true && !props.controller.state.expandedIds.has(id);
  });
  const canCollapse = props.controller.collection
    .getExpandableIds(scope)
    .some((id) => props.controller.state.expandedIds.has(id));
  const depthItems = depths.map((depth) => ({
    id: `tree-depth-${depth}`,
    kind: "action" as const,
    label: props.labels.depth(depth),
    textValue: props.labels.depth(depth),
    disabled,
    onAction: () => {
      void props.controller.actions.expandToDepth(depth, scope);
    },
  }));
  return (
    <div
      className="miaixz-tree-expansion-controls"
      role="group"
      aria-label={objectConfig.label ?? props.labels.defaultLabel}
    >
      {showExpand ? (
        <Button
          size="small"
          disabled={disabled || !canExpand}
          onClick={() => void props.controller.actions.expandAll({ scope, load: "loaded" })}
        >
          {props.labels.expandAll}
        </Button>
      ) : null}
      {showCollapse ? (
        <Button
          size="small"
          disabled={disabled || !canCollapse}
          onClick={() => props.controller.actions.collapseAll(scope)}
        >
          {props.labels.collapseAll}
        </Button>
      ) : null}
      {depthItems.length > 0 ? (
        <Dropdown
          label={props.labels.expandToDepth}
          items={depthItems}
          presentation="action-menu"
          surface="plain"
          trigger={
            <Button size="small" disabled={disabled}>
              {props.labels.expandToDepth}
            </Button>
          }
        />
      ) : null}
    </div>
  );
}
