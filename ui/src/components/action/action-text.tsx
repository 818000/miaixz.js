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

import { Icon } from "../icon/icon.js";
import { ActionTarget } from "./action-target.js";
import type { ActionTextProps } from "./action.types.js";
import { withMiaixzThemeComponent } from "../../theme/themed-component.js";

/**
 * Renders an always-labeled low-emphasis command or navigation action.
 *
 * @public
 */
export const ActionText = withMiaixzThemeComponent(
  "ActionText",
  forwardRef<HTMLButtonElement | HTMLAnchorElement, ActionTextProps>(function ActionText(
    { action, slotProps },
    ref,
  ) {
    const startIcon =
      action.icon === undefined ? undefined : <Icon name={action.icon} size="control" />;
    return (
      <ActionTarget
        ref={ref}
        action={action}
        className="miaixz-action-text"
        {...(slotProps === undefined ? {} : { slotProps })}
        {...(startIcon === undefined ? {} : { startIcon })}
      >
        {action.label}
      </ActionTarget>
    );
  }),
);
