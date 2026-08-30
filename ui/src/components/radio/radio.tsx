import { forwardRef } from "react";

import { classNames } from "../../internal/class-names.js";
import type { RadioProps } from "./radio.types.js";

/**
 * Renders a labeled native radio control.
 *
 * @public
 */
export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  { label, description, className, disabled, ...props },
  ref,
) {
  return (
    <label
      className={classNames(
        "miaixz-choice",
        "miaixz-radio",
        disabled && "miaixz-choice-disabled",
        className,
      )}
    >
      <input
        {...props}
        ref={ref}
        type="radio"
        disabled={disabled}
        className="miaixz-choice-input"
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
