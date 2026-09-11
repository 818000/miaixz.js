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

import type { ReactNode, Ref } from "react";

import type { ActionDescriptor } from "./action.types.js";

interface ActionTargetProps {
  /**
   * Resolved action contract.
   */
  readonly action: ActionDescriptor;
  /**
   * Framework-owned visual content.
   */
  readonly children: ReactNode;
  /**
   * Framework-owned class recipe.
   */
  readonly className: string;
  /**
   * Framework-owned responsive label behavior.
   */
  readonly dataLabelCollapse?: "compact";
  /**
   * Native DOM id supplied by an owning composite.
   */
  readonly id?: string;
  /**
   * Tooltip or supporting-description relation supplied by an owning composite.
   */
  readonly "aria-describedby"?: string;
  /**
   * Optional pressed state for icon toggles.
   */
  readonly pressed?: boolean;
  /**
   * Forwarded native element ref.
   */
  readonly ref?: Ref<HTMLElement>;
}

/**
 * Renders the semantic element selected by an action target.
 *
 * @param properties - Internal semantic action properties.
 * @returns A native anchor for navigation or native button for commands.
 * @internal
 */
export function ActionTarget(properties: ActionTargetProps) {
  const {
    action,
    children,
    className,
    dataLabelCollapse,
    id,
    pressed,
    ref,
    "aria-describedby": ariaDescribedBy,
  } = properties;
  const accessibility = {
    "aria-label": action["aria-label"],
    "aria-controls": action["aria-controls"],
    "aria-expanded": action["aria-expanded"],
    "aria-haspopup": action["aria-haspopup"],
    "aria-current": action["aria-current"],
    "aria-describedby": ariaDescribedBy,
    "data-testid": action["data-testid"],
  };

  if ("href" in action && action.href !== undefined) {
    return (
      <a
        {...accessibility}
        ref={ref as Ref<HTMLAnchorElement>}
        id={id}
        className={className}
        data-action-intent={action.intent}
        data-action-tone={action.tone}
        data-label-collapse={dataLabelCollapse}
        href={action.href}
        rel={action.rel}
        target={action.target}
      >
        {children}
      </a>
    );
  }

  const unavailable = action.disabled === true || action.loading === true;
  return (
    <button
      {...accessibility}
      ref={ref as Ref<HTMLButtonElement>}
      id={id}
      aria-busy={action.loading || undefined}
      aria-pressed={pressed}
      className={className}
      data-action-intent={action.intent}
      data-action-tone={action.tone}
      data-label-collapse={dataLabelCollapse}
      data-loading={action.loading || undefined}
      disabled={unavailable}
      onClick={action.onAction}
      type="button"
    >
      {children}
    </button>
  );
}
