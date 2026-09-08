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
import { Icon } from "../icon/index.js";
import type { IconSize } from "../icon/index.js";
import type { MiaixzComponentSize } from "../shared.types.js";
import { Hidden } from "../hidden/index.js";
import type { SpinnerProps } from "./spinner.types.js";

const miaixzSpinnerIconSizes: Record<MiaixzComponentSize, IconSize> = {
  small: "inline",
  medium: "navigation",
  large: "feature",
};

/**
 * Renders an accessible indeterminate loading indicator with reduced-motion fallback.
 *
 * @public
 */
export const Spinner = forwardRef<HTMLSpanElement, SpinnerProps>(function Spinner(
  { size = "medium", label, className, ...props },
  ref,
) {
  return (
    <span
      {...props}
      ref={ref}
      role="status"
      data-size={size}
      className={classNames("miaixz-spinner", `miaixz-spinner-${size}`, className)}
    >
      <Icon name="LoaderCircle" size={miaixzSpinnerIconSizes[size]} />
      <Hidden>{label}</Hidden>
    </span>
  );
});
