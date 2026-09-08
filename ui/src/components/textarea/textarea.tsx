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
import type { TextareaProps } from "./textarea.types.js";

/**
 * Renders a multiline text control using the shared form appearance.
 *
 * @public
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    size = "medium",
    invalid = false,
    resize = "vertical",
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
      data-size={size}
      data-invalid={isInvalid || undefined}
      data-disabled={disabled || undefined}
      data-readonly={readOnly || undefined}
      data-filled={isFilled || undefined}
      data-preview-state={previewState}
      className={classNames(
        "miaixz-control",
        "miaixz-textarea-frame",
        `miaixz-control-${size}`,
        isInvalid && "miaixz-textarea-invalid",
        disabled && "miaixz-textarea-disabled",
        readOnly && "miaixz-textarea-readonly",
        className,
      )}
    >
      <textarea
        {...props}
        ref={ref}
        disabled={disabled}
        readOnly={readOnly}
        value={value}
        defaultValue={defaultValue}
        aria-invalid={isInvalid || undefined}
        data-resize={resize}
        className={classNames("miaixz-textarea", `miaixz-textarea-${size}`)}
        onChange={(event) => {
          if (value === undefined)
            setUncontrolledFilled(hasMiaixzControlValue(event.currentTarget.value));
          onChange?.(event);
        }}
      />
    </span>
  );
});
