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
import { Spinner } from "../spinner/index.js";
import type { OverlayProps } from "./overlay.types.js";

/**
 * Renders a loading surface without unmounting the underlying content.
 *
 * @public
 */
export const Overlay = forwardRef<HTMLDivElement, OverlayProps>(function Overlay(
  { active, label, children, className, ...props },
  ref,
) {
  return (
    <div
      {...props}
      ref={ref}
      aria-busy={active || undefined}
      data-loading={active || undefined}
      className={classNames("miaixz-overlay", className)}
    >
      <div className="miaixz-overlay-content">{children}</div>
      {active && (
        <div className="miaixz-overlay-surface">
          <Spinner label={label} />
        </div>
      )}
    </div>
  );
});
