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
 * Implements the tree breadcrumb module.
 */

import { Icon } from "@miaixz/icons";

import type { TreeController } from "./use-tree.js";
import type { FocusTreeViewOptions } from "./tree.types.js";

/**
 * Properties accepted by the focus-view path navigation.
 */
export interface TreeBreadcrumbProps<Value> {
  readonly controller: TreeController<Value>;
  readonly navigation: NonNullable<FocusTreeViewOptions["navigation"]>;
  readonly currentPathLabel: string;
  readonly rootLabel: string;
  readonly backLabel: string;
}

/**
 * Renders breadcrumb and/or back navigation without entering the tree roving sequence.
 * @param props - Focus navigation state, labels, and controller actions.
 * @returns Focus-view breadcrumb and back controls when enabled.
 */
export function TreeBreadcrumb<Value>(props: TreeBreadcrumbProps<Value>) {
  const currentId = props.controller.state.viewRootId;
  const path = props.controller.view.breadcrumb;
  const disabled = props.controller.state.viewRootReadOnly;
  const showBreadcrumb = props.navigation === "breadcrumb" || props.navigation === "both";
  const showBack =
    currentId !== null && (props.navigation === "back" || props.navigation === "both");
  const parentId =
    currentId === null ? null : (props.controller.collection.get(currentId)?.parentId ?? null);
  return (
    <div className="miaixz-tree-focus-navigation">
      {showBack ? (
        <button
          type="button"
          className="miaixz-tree-back"
          disabled={disabled}
          onClick={() => props.controller.actions.setViewRoot(parentId)}
        >
          <Icon name="arrow-left" size="control" aria-hidden="true" />
          {props.backLabel}
        </button>
      ) : null}
      {showBreadcrumb ? (
        <nav className="miaixz-tree-breadcrumb" aria-label={props.currentPathLabel}>
          <ol>
            <li>
              {currentId === null ? (
                <span aria-current="location">{props.rootLabel}</span>
              ) : (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => props.controller.actions.setViewRoot(null)}
                >
                  {props.rootLabel}
                </button>
              )}
            </li>
            {path.map((record, index) => {
              const current = index === path.length - 1;
              return (
                <li key={record.id}>
                  <Icon name="chevron-right" size="indicator" aria-hidden="true" />
                  {current ? (
                    <span aria-current="location">{record.node.label}</span>
                  ) : (
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => props.controller.actions.setViewRoot(record.id)}
                    >
                      {record.node.label}
                    </button>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      ) : null}
    </div>
  );
}
