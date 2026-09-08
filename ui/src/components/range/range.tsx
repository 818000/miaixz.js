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
import type { RangeProps } from "./range.types.js";

/**
 * Renders a branded native range input with the shared form-state contract.
 *
 * @public
 */
export const Range = forwardRef<HTMLInputElement, RangeProps>(function Range(
  { className, disabled, invalid = false, previewState, readOnly, ...props },
  ref,
) {
  return (
    <input
      {...props}
      aria-invalid={invalid || undefined}
      className={classNames("miaixz-range", className)}
      data-disabled={disabled || undefined}
      data-invalid={invalid || undefined}
      data-preview-state={previewState}
      data-readonly={readOnly || undefined}
      disabled={disabled}
      readOnly={readOnly}
      ref={ref}
      type="range"
    />
  );
});
