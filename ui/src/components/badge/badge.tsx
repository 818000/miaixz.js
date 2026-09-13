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
import type { BadgeOwnerState, BadgeProps } from "./badge.types.js";
import { withMiaixzThemeComponent } from "../../theme/themed-component.js";

/*
 * Renders a standalone semantic label rather than an overlay badge.
 */
export const Badge = withMiaixzThemeComponent(
  "Badge",
  forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
    { tone = "neutral", variant = "filled", marker = false, icon, children, slotProps, ...props },
    ref,
  ) {
    const ownerState: BadgeOwnerState = { tone, variant, marker };
    return (
      <span
        {...mergeMiaixzSlotProps({
          ownerState,
          defaultProps: { className: "miaixz-badge" },
          componentProps: props,
          slotProps: slotProps?.root,
          forwardedRef: ref,
          internalProps: { "data-tone": tone, "data-variant": variant },
          ownedProps: ["data-tone", "data-variant"],
        })}
      >
        {marker && (
          <span
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-badge-marker" },
              slotProps: slotProps?.marker,
              internalProps: { "aria-hidden": true },
              ownedProps: ["aria-hidden"],
            })}
          />
        )}
        {icon !== undefined && (
          <span
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-badge-icon" },
              slotProps: slotProps?.icon,
            })}
          >
            {icon}
          </span>
        )}
        <span
          {...mergeMiaixzSlotProps({
            ownerState,
            defaultProps: { className: "miaixz-badge-label" },
            slotProps: slotProps?.label,
          })}
        >
          {children}
        </span>
      </span>
    );
  }),
);
