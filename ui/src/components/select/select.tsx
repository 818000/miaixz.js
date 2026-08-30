import { forwardRef } from "react";

import { classNames } from "../../internal/class-names.js";
import { Icon } from "../icon/index.js";
import type { SelectProps } from "./select.types.js";

/**
 * Renders a native select control with consistent Miaixz styling.
 *
 * @public
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { size = "medium", invalid = false, className, disabled, "aria-invalid": ariaInvalid, ...props },
  ref,
) {
  const isInvalid = invalid || ariaInvalid === true || ariaInvalid === "true";

  return (
    <span
      className={classNames(
        "miaixz-control",
        "miaixz-select",
        `miaixz-control-${size}`,
        isInvalid && "miaixz-select-invalid",
        disabled && "miaixz-select-disabled",
        className,
      )}
      data-size={size}
      data-invalid={isInvalid || undefined}
      data-disabled={disabled || undefined}
    >
      <select
        {...props}
        ref={ref}
        disabled={disabled}
        aria-invalid={isInvalid || undefined}
        className="miaixz-select-element"
      />
      <Icon name="ChevronDown" size="control" className="miaixz-select-indicator" />
    </span>
  );
});
