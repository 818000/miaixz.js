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
import type { PressableProps } from "./pressable.types.js";

/**
 * Renders a visually neutral button with consistent keyboard focus behavior.
 *
 * @public
 */
export const Pressable = forwardRef<HTMLButtonElement, PressableProps>(function Pressable(
  {
    className,
    disabled,
    type = "button",
    variant = "default",
    density = "standard",
    separator = "solid",
    ...props
  },
  ref,
) {
  return (
    <button
      {...props}
      className={classNames(
        "miaixz-pressable",
        `miaixz-pressable-${variant}`,
        `miaixz-pressable-density-${density}`,
        `miaixz-pressable-separator-${separator}`,
        className,
      )}
      data-disabled={disabled || undefined}
      disabled={disabled}
      ref={ref}
      type={type}
    />
  );
});
