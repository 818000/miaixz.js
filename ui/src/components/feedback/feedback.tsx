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

import type { HTMLAttributes, ReactElement } from "react";

import { IconButton } from "../action/icon-button.js";
import { Icon } from "../icon/icon.js";
import type { MiaixzFeedbackTone } from "../shared.types.js";
import type { MiaixzFeedbackLive, MiaixzFeedbackProps } from "./feedback.types.js";

/**
 * Returns the sole live-region semantics for Alert and Notice.
 *
 * @param tone - Visual feedback tone.
 * @param live - Optional explicit announcement priority.
 * @returns The role and live attributes owned by the feedback root.
 */
export function getMiaixzFeedbackSemantics(
  tone: MiaixzFeedbackTone,
  live?: MiaixzFeedbackLive,
): Pick<HTMLAttributes<HTMLDivElement>, "role" | "aria-live"> {
  const resolved = live ?? (tone === "danger" ? "assertive" : "polite");
  if (resolved === "off") return {};
  return resolved === "assertive"
    ? { role: "alert", "aria-live": "assertive" }
    : { role: "status", "aria-live": "polite" };
}

/**
 * Renders the one feedback DOM structure shared by prominent and compact recipes.
 *
 * @param props - Already merged structure, content, and dismissal properties.
 * @returns The shared feedback element tree.
 */
export function MiaixzFeedback(props: MiaixzFeedbackProps): ReactElement {
  return (
    <div {...props.rootProps}>
      <span {...props.iconProps}>
        <Icon aria-hidden="true" name={feedbackIcons[props.tone]} size="control" />
      </span>
      <div {...props.contentProps}>
        {props.title === undefined ? null : <div {...props.titleProps}>{props.title}</div>}
        <div {...props.messageProps}>{props.message}</div>
        {props.actions === undefined ? null : <div {...props.actionsProps}>{props.actions}</div>}
      </div>
      {props.onDismiss === undefined || props.dismissLabel === undefined ? null : (
        <span {...props.dismissProps}>
          <IconButton icon="X" label={props.dismissLabel} onClick={props.onDismiss} size="small" />
        </span>
      )}
    </div>
  );
}

const feedbackIcons: Record<
  MiaixzFeedbackTone,
  "Info" | "CircleCheck" | "TriangleAlert" | "CircleAlert"
> = {
  neutral: "Info",
  info: "Info",
  success: "CircleCheck",
  warning: "TriangleAlert",
  danger: "CircleAlert",
};
