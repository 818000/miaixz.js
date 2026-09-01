import { forwardRef, useState } from "react";

import { classNames } from "../../internal/class-names.js";
import type { SwitchProps } from "./switch.types.js";

/**
 * Renders an accessible boolean switch backed by a native checkbox input.
 *
 * @public
 */
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
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
        "miaixz-switch",
        disabled && "miaixz-switch-disabled",
        isInvalid && "miaixz-switch-invalid",
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
        type="checkbox"
        role="switch"
        disabled={disabled}
        checked={checked}
        defaultChecked={defaultChecked}
        aria-invalid={isInvalid || undefined}
        className="miaixz-switch-input"
        onChange={(event) => {
          if (checked === undefined) setUncontrolledChecked(event.currentTarget.checked);
          onChange?.(event);
        }}
      />
      <span className="miaixz-switch-track" aria-hidden="true">
        <span className="miaixz-switch-thumb" />
      </span>
      {(label || description) && (
        <span className="miaixz-switch-content">
          {label && <span className="miaixz-switch-label">{label}</span>}
          {description && <span className="miaixz-switch-description">{description}</span>}
        </span>
      )}
    </label>
  );
});
