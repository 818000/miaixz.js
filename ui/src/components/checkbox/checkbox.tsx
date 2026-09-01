import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

import { classNames } from "../../internal/class-names.js";
import type { CheckboxProps } from "./checkbox.types.js";

/**
 * Renders a labeled native checkbox with shared visual treatment.
 *
 * @public
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  {
    label,
    description,
    indeterminate = false,
    invalid = false,
    previewState,
    className,
    disabled,
    checked,
    defaultChecked,
    onChange,
    "aria-invalid": ariaInvalid,
    ...props
  },
  forwardedRef,
) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uncontrolledChecked, setUncontrolledChecked] = useState(defaultChecked ?? false);
  const isChecked = checked === undefined ? uncontrolledChecked : checked;
  const isInvalid = invalid || ariaInvalid === true || ariaInvalid === "true";

  useImperativeHandle(forwardedRef, () => inputRef.current as HTMLInputElement, []);
  useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <label
      className={classNames(
        "miaixz-choice",
        "miaixz-checkbox",
        disabled && "miaixz-choice-disabled",
        isInvalid && "miaixz-choice-invalid",
        className,
      )}
      data-disabled={disabled || undefined}
      data-filled={isChecked || indeterminate || undefined}
      data-invalid={isInvalid || undefined}
      data-preview-state={previewState}
    >
      <input
        {...props}
        ref={inputRef}
        type="checkbox"
        disabled={disabled}
        checked={checked}
        defaultChecked={defaultChecked}
        aria-checked={indeterminate ? "mixed" : checked}
        aria-invalid={isInvalid || undefined}
        className="miaixz-choice-input"
        onChange={(event) => {
          if (checked === undefined) setUncontrolledChecked(event.currentTarget.checked);
          onChange?.(event);
        }}
      />
      <span className="miaixz-choice-mark" aria-hidden="true" />
      {(label || description) && (
        <span className="miaixz-choice-content">
          {label && <span className="miaixz-choice-label">{label}</span>}
          {description && <span className="miaixz-choice-description">{description}</span>}
        </span>
      )}
    </label>
  );
});
