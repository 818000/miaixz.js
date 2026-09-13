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

/* eslint-disable jsdoc/require-jsdoc -- Public contract is declared in the adjacent type module.
 */
import { forwardRef } from "react";
import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import type { StatusOwnerState, StatusProps } from "./status.types.js";
import { withMiaixzThemeComponent } from "../../theme/themed-component.js";

/*
 * Renders one stable marker, optional content, and status label structure.
 */
export const Status = withMiaixzThemeComponent(
  "Status",
  forwardRef<HTMLSpanElement, StatusProps>(function Status(
    { tone, label, children, size = "medium", layout = "inline", slotProps, ...props },
    ref,
  ) {
    const ownerState: StatusOwnerState = { tone, size, layout };
    return (
      <span
        {...mergeMiaixzSlotProps({
          ownerState,
          defaultProps: { className: "miaixz-status" },
          componentProps: props,
          slotProps: slotProps?.root,
          forwardedRef: ref,
          internalProps: { "data-tone": tone, "data-size": size, "data-layout": layout },
          ownedProps: ["data-tone", "data-size", "data-layout"],
        })}
      >
        <span
          {...mergeMiaixzSlotProps({
            ownerState,
            defaultProps: { className: "miaixz-status-marker" },
            slotProps: slotProps?.marker,
            internalProps: { "aria-hidden": true },
            ownedProps: ["aria-hidden"],
          })}
        />
        {children !== undefined && (
          <span
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-status-content" },
              slotProps: slotProps?.content,
            })}
          >
            {children}
          </span>
        )}
        <span
          {...mergeMiaixzSlotProps({
            ownerState,
            defaultProps: { className: "miaixz-status-label" },
            slotProps: slotProps?.label,
          })}
        >
          {label}
        </span>
      </span>
    );
  }),
);
