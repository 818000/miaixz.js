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
import type { MasonryOwnerState, MasonryProps, MasonryRootAttributes } from "./masonry.types.js";

/**
 * Renders a CSS multi-column layout without measuring or reordering content.
 */
export const Masonry = withMiaixzThemeComponent(
  "Masonry",
  forwardRef<HTMLDivElement, MasonryProps>(function Masonry(
    { columns = 3, gap = "default", slotProps, ...props },
    forwardedRef,
  ) {
    const ownerState: MasonryOwnerState = { columns, gap };
    return (
      <div
        {...mergeMiaixzSlotProps<MasonryOwnerState, MasonryRootAttributes, HTMLDivElement>({
          ownerState,
          defaultProps: { className: "miaixz-masonry" },
          componentProps: props,
          slotProps: slotProps?.root,
          forwardedRef,
          internalProps: {
            "data-ui": "masonry",
            "data-columns": columns,
            "data-gap": gap,
          },
          ownedProps: ["data-ui", "data-columns", "data-gap"],
        })}
      />
    );
  }),
);
