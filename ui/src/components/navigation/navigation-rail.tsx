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

import { classNames } from "../../shared/class-names.js";
import type { NavigationRailProps } from "./navigation-rail.types.js";

/**
 * Composes a single-level application rail that can reveal its labels in place.
 *
 * @public
 */
export const NavigationRail = forwardRef<HTMLDivElement, NavigationRailProps>(
  function NavigationRail(
    {
      brand,
      toggle,
      navigation,
      utility,
      expanded = false,
      variant = "default",
      className,
      classNames: slotClassNames = {},
      ...props
    },
    ref,
  ) {
    return (
      <div
        {...props}
        ref={ref}
        data-expanded={expanded || undefined}
        data-variant={variant}
        className={classNames("miaixz-navigation-rail-frame", className, slotClassNames.root)}
      >
        <div className={classNames("miaixz-navigation-rail-header", slotClassNames.header)}>
          <div className={classNames("miaixz-navigation-rail-toggle", slotClassNames.toggle)}>
            {toggle}
          </div>
          {expanded && (
            <div className={classNames("miaixz-navigation-rail-brand", slotClassNames.brand)}>
              {brand}
            </div>
          )}
        </div>
        <div className={classNames("miaixz-navigation-rail-body", slotClassNames.body)}>
          {navigation}
        </div>
        {utility !== undefined && utility !== null && (
          <div className={classNames("miaixz-navigation-rail-utility", slotClassNames.utility)}>
            {utility}
          </div>
        )}
      </div>
    );
  },
);
