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

/* eslint-disable jsdoc/require-jsdoc --
 * Public rail-group contracts are defined by the component type module.
 */
import { forwardRef, useId } from "react";

import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import type {
  NavigationRailGroupOwnerState,
  NavigationRailGroupProps,
} from "./navigation-rail-group.types.js";
import { withMiaixzThemeComponent } from "../../theme/themed-component.js";

/*
 * Renders an explicitly named navigation rail group. @public
 */
export const NavigationRailGroup = withMiaixzThemeComponent(
  "NavigationRailGroup",
  forwardRef<HTMLElement, NavigationRailGroupProps>(function NavigationRailGroup(
    { label, separated = false, slotProps, children, ...props },
    ref,
  ) {
    const generatedId = useId();
    const labelId = `${generatedId}-label`;
    const ownerState: NavigationRailGroupOwnerState = { separated };
    return (
      <section
        {...mergeMiaixzSlotProps({
          ownerState,
          defaultProps: { className: "miaixz-navigation-rail-group" },
          componentProps: props,
          slotProps: slotProps?.root,
          forwardedRef: ref,
          internalProps: {
            "aria-labelledby": labelId,
            ...(separated ? { "data-separated": true } : {}),
          },
          ownedProps: ["aria-labelledby", "data-separated"],
        })}
      >
        <div
          {...mergeMiaixzSlotProps({
            ownerState,
            defaultProps: { className: "miaixz-navigation-rail-group-marker" },
            slotProps: slotProps?.marker,
          })}
        >
          {separated && (
            <span
              {...mergeMiaixzSlotProps({
                ownerState,
                defaultProps: { className: "miaixz-navigation-rail-group-marker-line" },
                slotProps: slotProps?.line,
                internalProps: { "aria-hidden": true },
                ownedProps: ["aria-hidden"],
              })}
            />
          )}
          <span
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-navigation-rail-group-marker-label" },
              slotProps: slotProps?.label,
              internalProps: { id: labelId },
              ownedProps: ["id"],
            })}
          >
            {label}
          </span>
        </div>
        {children}
      </section>
    );
  }),
);
