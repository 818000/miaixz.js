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

import { forwardRef } from "react";

import { Icon } from "../icon/index.js";
import { ActionTarget } from "./action-target.js";
import type { ActionDescriptor, ActionTextProps } from "./action.types.js";

interface ActionTextViewProps {
  /**
   * Resolved action contract.
   */
  readonly action: ActionDescriptor;
  /**
   * Whether the framework-owned icon remains visible.
   */
  readonly showIcon: boolean;
}

/**
 * Renders a low-emphasis text action while preserving native semantics.
 *
 * @param root0 - Action text properties.
 * @param root0.action - Resolved action contract.
 * @returns A semantic text action.
 * @public
 */
export const ActionText = forwardRef<HTMLElement, ActionTextProps>(function ActionText(
  { action, id, ...accessibility },
  ref,
) {
  return (
    <ActionTextView
      ref={ref}
      {...(id === undefined ? {} : { id })}
      action={{ ...action, ...accessibility }}
      showIcon
    />
  );
});

/**
 * Selects the framework-owned toolbar or row presentation.
 *
 * @param properties - Internal action presentation properties.
 * @param properties.action - Resolved action contract.
 * @param properties.showIcon - Whether the icon is visible.
 * @returns A text action with its prescribed icon visibility.
 * @internal
 */
export const ActionTextView = forwardRef<HTMLElement, ActionTextViewProps>(function ActionTextView(
  { action, showIcon },
  ref,
) {
  const loading = "loading" in action && action.loading === true;
  return (
    <ActionTarget
      ref={ref}
      action={action}
      className={`miaixz-action-text miaixz-action-${action.size ?? "default"}`}
    >
      {showIcon && (
        <span className="miaixz-action-icon">
          <Icon name={loading ? "LoaderCircle" : action.icon} size="control" />
        </span>
      )}
      <span className="miaixz-action-label">{action.label}</span>
    </ActionTarget>
  );
});
