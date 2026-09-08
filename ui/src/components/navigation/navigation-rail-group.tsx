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
import type { NavigationRailGroupProps } from "./navigation-rail-group.types.js";

/**
 * Groups direct rail destinations and morphs its compact divider into a label when expanded.
 *
 * @public
 */
export const NavigationRailGroup = forwardRef<HTMLElement, NavigationRailGroupProps>(
  function NavigationRailGroup({ label, separated = false, className, children, ...props }, ref) {
    return (
      <section
        {...props}
        ref={ref}
        data-separated={separated || undefined}
        className={classNames("miaixz-navigation-rail-group", className)}
      >
        {separated && (
          <div aria-hidden="true" className="miaixz-navigation-rail-group-marker">
            <span className="miaixz-navigation-rail-group-marker-line" />
            <span className="miaixz-navigation-rail-group-marker-label">{label}</span>
          </div>
        )}
        {children}
      </section>
    );
  },
);
