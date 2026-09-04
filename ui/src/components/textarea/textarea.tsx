import { forwardRef, useState } from "react";

import { classNames } from "../../internal/class-names.js";
import { hasMiaixzControlValue } from "../../internal/control-state.js";
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
