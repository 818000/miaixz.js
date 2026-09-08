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
import type { CSSProperties } from "react";

import { classNames } from "../../shared/class-names.js";
import type { BarProps } from "./bar.types.js";

/**
 * Renders fixed page and navigation progress at the top of the viewport. @public
 */
export const Bar = forwardRef<HTMLDivElement, BarProps>(function Bar(
  { active, complete = false, indeterminate = false, progress = 0, className, style, ...props },
  ref,
) {
  const clampedProgress = Math.min(1, Math.max(0, progress));
  const progressStyle = {
    ...style,
    "--miaixz-bar-progress": clampedProgress,
  } as CSSProperties;

  return (
    <div
      {...props}
      ref={ref}
      aria-hidden="true"
      className={classNames("miaixz-bar", className)}
      data-active={active}
      data-complete={complete}
      data-indeterminate={indeterminate}
      data-miaixz-bar=""
      style={progressStyle}
    >
      <span className="miaixz-bar-fill" />
    </div>
  );
});
