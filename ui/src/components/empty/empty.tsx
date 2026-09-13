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
import { createElement, forwardRef } from "react";
import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import type { EmptyOwnerState, EmptyProps } from "./empty.types.js";
import { withMiaixzThemeComponent } from "../../theme/themed-component.js";

/*
 * Presents a structurally stable empty state.
 */
export const Empty = withMiaixzThemeComponent(
  "Empty",
  forwardRef<HTMLDivElement, EmptyProps>(function Empty(
    {
      title,
      description,
      icon,
      actions,
      compact = false,
      headingLevel = 3,
      variant = "framed",
      slots,
      slotProps,
      ...props
    },
    ref,
  ) {
    const ownerState: EmptyOwnerState = { variant, compact };
    const Description = slots?.description ?? "div";
    return (
      <div
        {...mergeMiaixzSlotProps({
          ownerState,
          defaultProps: { className: "miaixz-empty" },
          componentProps: props,
          slotProps: slotProps?.root,
          forwardedRef: ref,
          internalProps: { "data-variant": variant, ...(compact ? { "data-compact": true } : {}) },
          ownedProps: ["data-variant", "data-compact"],
        })}
      >
        <div
          {...mergeMiaixzSlotProps({
            ownerState,
            defaultProps: { className: "miaixz-empty-content" },
            slotProps: slotProps?.content,
          })}
        >
          {icon !== undefined && (
            <div
              {...mergeMiaixzSlotProps({
                ownerState,
                defaultProps: { className: "miaixz-empty-icon" },
                slotProps: slotProps?.icon,
              })}
            >
              {icon}
            </div>
          )}
          {createElement(
            `h${headingLevel}`,
            mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-empty-title" },
              slotProps: slotProps?.title,
            }),
            title,
          )}
          {description !== undefined && (
            <Description
              {...mergeMiaixzSlotProps({
                ownerState,
                defaultProps: { className: "miaixz-empty-description" },
                slotProps: slotProps?.description,
              })}
            >
              {description}
            </Description>
          )}
          {actions !== undefined && (
            <div
              {...mergeMiaixzSlotProps({
                ownerState,
                defaultProps: { className: "miaixz-empty-actions" },
                slotProps: slotProps?.actions,
              })}
            >
              {actions}
            </div>
          )}
        </div>
      </div>
    );
  }),
);
