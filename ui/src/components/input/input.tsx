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

import { forwardRef, useState } from "react";

import { classNames } from "../../shared/class-names.js";
import { hasMiaixzControlValue } from "../../shared/control-state.js";
import type { InputProps } from "./input.types.js";

/**
 * Renders a single-line native input with shared validation styling.
 *
 * @public
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    size = "medium",
    invalid = false,
    startAdornment,
    endAdornment,
    className,
    disabled,
    readOnly,
    previewState,
    value,
    defaultValue,
    onChange,
    "aria-invalid": ariaInvalid,
    ...props
  },
  ref,
) {
  const isInvalid = invalid || ariaInvalid === true || ariaInvalid === "true";
  const [uncontrolledFilled, setUncontrolledFilled] = useState(() =>
    hasMiaixzControlValue(defaultValue),
  );
  const isFilled = value === undefined ? uncontrolledFilled : hasMiaixzControlValue(value);

  return (
    <span
      className={classNames(
        "miaixz-control",
        "miaixz-input",
        `miaixz-control-${size}`,
        Boolean(startAdornment) && "miaixz-input-with-start",
        Boolean(endAdornment) && "miaixz-input-with-end",
        isInvalid && "miaixz-input-invalid",
        disabled && "miaixz-input-disabled",
        readOnly && "miaixz-input-readonly",
        className,
      )}
      data-size={size}
      data-invalid={isInvalid || undefined}
      data-disabled={disabled || undefined}
      data-readonly={readOnly || undefined}
      data-filled={isFilled || undefined}
      data-preview-state={previewState}
    >
      {startAdornment && <span className="miaixz-input-adornment">{startAdornment}</span>}
      <input
        {...props}
        ref={ref}
        disabled={disabled}
        readOnly={readOnly}
        value={value}
        defaultValue={defaultValue}
        aria-invalid={isInvalid || undefined}
        className="miaixz-input-element"
        onChange={(event) => {
          if (value === undefined)
            setUncontrolledFilled(hasMiaixzControlValue(event.currentTarget.value));
          onChange?.(event);
        }}
      />
      {endAdornment && <span className="miaixz-input-adornment">{endAdornment}</span>}
    </span>
  );
});
