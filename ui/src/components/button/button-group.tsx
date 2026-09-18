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

import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import { withMiaixzThemeComponent } from "../../theme/binding.js";
import { ButtonGroupProvider } from "./button-group-context.js";
import type {
  ButtonGroupOwnerState,
  ButtonGroupProps,
  ButtonGroupRootAttributes,
} from "./button-group.types.js";

/**
 * Groups directly adjacent Buttons or ButtonLinks under shared defaults.
 */
export const ButtonGroup = withMiaixzThemeComponent(
  "ButtonGroup",
  forwardRef<HTMLDivElement, ButtonGroupProps>(function ButtonGroup(
    {
      children,
      orientation = "horizontal",
      fullWidth = false,
      size = "medium",
      tone = "neutral",
      variant = "outlined",
      disabled = false,
      slotProps,
      ...props
    },
    forwardedRef,
  ) {
    const ownerState: ButtonGroupOwnerState = {
      orientation,
      fullWidth,
      size,
      tone,
      variant,
      disabled,
    };
    return (
      <ButtonGroupProvider value={{ size, tone, variant, disabled, fullWidth }}>
        <div
          {...mergeMiaixzSlotProps<
            ButtonGroupOwnerState,
            ButtonGroupRootAttributes,
            HTMLDivElement
          >({
            ownerState,
            defaultProps: { className: "miaixz-button-group" },
            componentProps: props,
            slotProps: slotProps?.root,
            forwardedRef,
            internalProps: {
              role: "group",
              "data-ui": "button-group",
              "data-orientation": orientation,
              ...(fullWidth ? { "data-full-width": true } : {}),
            },
            ownedProps: ["role", "data-ui", "data-orientation", "data-full-width"],
          })}
        >
          {children}
        </div>
      </ButtonGroupProvider>
    );
  }),
);
