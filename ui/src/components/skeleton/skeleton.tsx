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
import type { SkeletonOwnerState, SkeletonProps } from "./skeleton.types.js";
import { withMiaixzThemeComponent } from "../../theme/themed-component.js";

/*
 * Renders an empty, assistive-hidden geometric loading placeholder.
 */
export const Skeleton = withMiaixzThemeComponent(
  "Skeleton",
  forwardRef<HTMLSpanElement, SkeletonProps>(function Skeleton(
    { variant = "text", width, height, slotProps, style, ...props },
    ref,
  ) {
    const ownerState: SkeletonOwnerState = { variant };
    return (
      <span
        {...mergeMiaixzSlotProps({
          ownerState,
          defaultProps: { className: "miaixz-skeleton" },
          componentProps: { ...props, style: { ...style, width, height } },
          slotProps: slotProps?.root,
          forwardedRef: ref,
          internalProps: { "aria-hidden": true, "data-variant": variant },
          ownedProps: ["aria-hidden", "data-variant"],
        })}
      />
    );
  }),
);
