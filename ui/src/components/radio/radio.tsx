import { forwardRef, useState } from "react";

import { classNames } from "../../internal/class-names.js";
import type { RadioProps } from "./radio.types.js";

/**
 * Renders a labeled native radio control.
 *
 * @public
 */
export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  {
    label,
    description,
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
  ref,
) {
  const [uncontrolledChecked, setUncontrolledChecked] = useState(defaultChecked ?? false);
  const isChecked = checked === undefined ? uncontrolledChecked : checked;
  const isInvalid = invalid || ariaInvalid === true || ariaInvalid === "true";

  return (
    <label
      className={classNames(
        "miaixz-choice",
        "miaixz-radio",
        disabled && "miaixz-choice-disabled",
        isInvalid && "miaixz-choice-invalid",
        className,
      )}
      data-disabled={disabled || undefined}
      data-filled={isChecked || undefined}
      data-invalid={isInvalid || undefined}
      data-preview-state={previewState}
    >
      <input
        {...props}
        ref={ref}
        type="radio"
        disabled={disabled}
        checked={checked}
        defaultChecked={defaultChecked}
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
