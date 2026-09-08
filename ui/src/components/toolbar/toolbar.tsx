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
import type { ToolbarProps } from "./toolbar.types.js";

/**
 * Renders a labeled toolbar for a related set of controls.
 *
 * @public
 */
export const Toolbar = forwardRef<HTMLDivElement, ToolbarProps>(function Toolbar(
  {
    label,
    orientation = "horizontal",
    leading,
    actions,
    sticky = false,
    variant = "default",
    className,
    children,
    ...props
  },
  ref,
) {
  const structured = leading !== undefined || actions !== undefined;
  return (
    <div
      {...props}
      ref={ref}
      role="toolbar"
      aria-label={label}
      aria-orientation={orientation}
      data-orientation={orientation}
      className={classNames(
        "miaixz-toolbar",
        `miaixz-toolbar-${variant}`,
        sticky && "miaixz-toolbar-sticky",
        className,
      )}
    >
      {structured ? (
        <>
          <div className="miaixz-toolbar-leading">{leading ?? children}</div>
          {actions !== undefined && <div className="miaixz-toolbar-actions">{actions}</div>}
        </>
      ) : (
        children
      )}
    </div>
  );
});
