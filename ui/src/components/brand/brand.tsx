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
 * Public Brand contracts are defined by the component type module.
 */
import { forwardRef } from "react";

import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import type { BrandOwnerState, BrandProps } from "./brand.types.js";
import { withMiaixzThemeComponent } from "../../theme/themed-component.js";

const ownerState: BrandOwnerState = {};

/*
 * Displays a platform name and optional logo without owning navigation. @public
 */
export const Brand = withMiaixzThemeComponent(
  "Brand",
  forwardRef<HTMLSpanElement, BrandProps>(function Brand({ name, logo, slotProps, ...props }, ref) {
    return (
      <span
        {...mergeMiaixzSlotProps({
          ownerState,
          defaultProps: { className: "miaixz-brand" },
          componentProps: props,
          slotProps: slotProps?.root,
          forwardedRef: ref,
        })}
      >
        {logo !== undefined && (
          <span
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-brand-logo" },
              slotProps: slotProps?.logo,
            })}
          >
            {logo}
          </span>
        )}
        <span
          {...mergeMiaixzSlotProps({
            ownerState,
            defaultProps: { className: "miaixz-brand-name" },
            slotProps: slotProps?.name,
          })}
        >
          {name}
        </span>
      </span>
    );
  }),
);
