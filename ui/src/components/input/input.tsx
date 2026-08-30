import { forwardRef } from "react";

import { classNames } from "../../internal/class-names.js";
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
    "aria-invalid": ariaInvalid,
    ...props
  },
  ref,
) {
  const isInvalid = invalid || ariaInvalid === true || ariaInvalid === "true";

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
    >
      {startAdornment && <span className="miaixz-input-adornment">{startAdornment}</span>}
      <input
        {...props}
        ref={ref}
        disabled={disabled}
        readOnly={readOnly}
        aria-invalid={isInvalid || undefined}
        className="miaixz-input-element"
      />
      {endAdornment && <span className="miaixz-input-adornment">{endAdornment}</span>}
    </span>
  );
});
