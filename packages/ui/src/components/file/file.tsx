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

/**
 * Implements the shared theme-aware file icon.
 */
import { forwardRef } from "react";
import { Icon } from "@miaixz/icons";
import { classNames } from "../../shared/class-names.js";
import type { FileProps } from "./file.types.js";

/**
 * Renders a file glyph with one semantic foreground and optional badge surface.
 * @public
 */
export const File = forwardRef<HTMLSpanElement, FileProps>(function File(
  { icon, label, tone = "neutral", presentation = "plain", className, ...props },
  ref,
) {
  return (
    <span
      {...props}
      ref={ref}
      className={classNames("miaixz-file", className)}
      data-file-tone={tone}
      data-presentation={presentation}
    >
      <Icon name={icon} label={label} title={label} size="control" />
    </span>
  );
});
