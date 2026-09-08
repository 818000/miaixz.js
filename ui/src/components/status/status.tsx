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
import type { StatusProps } from "./status.types.js";

/**
 * Renders a semantic status as both a visual marker and visible text.
 *
 * @public
 */
export const Status = forwardRef<HTMLSpanElement, StatusProps>(function Status(
  { tone, label, size = "medium", variant = "default", children, className, ...props },
  ref,
) {
  if (variant === "tag") {
    return (
      <span
        {...props}
        ref={ref}
        data-tone={tone}
        className={classNames("miaixz-status-tag", `miaixz-status-tag-${tone}`, className)}
      >
        {label}
      </span>
    );
  }
  return (
    <span
      {...props}
      ref={ref}
      data-tone={tone}
      className={classNames(
        "miaixz-status",
        `miaixz-status-${tone}`,
        `miaixz-status-size-${size}`,
        `miaixz-status-${variant}`,
        className,
      )}
    >
      <span className="miaixz-status-marker" aria-hidden="true" />
      {children !== undefined && <span className="miaixz-status-content">{children}</span>}
      <span className="miaixz-status-label">{label}</span>
    </span>
  );
});
