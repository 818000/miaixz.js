import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

import { classNames } from "../../internal/class-names.js";
import type { CheckboxProps } from "./checkbox.types.js";

/**
 * Renders a labeled native checkbox with shared visual treatment.
 *
 * @public
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, description, indeterminate = false, className, disabled, ...props },
  forwardedRef,
) {
  const inputRef = useRef<HTMLInputElement>(null);

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
        className,
      )}
    >
      <input
        {...props}
        ref={inputRef}
        type="checkbox"
        disabled={disabled}
        aria-checked={indeterminate ? "mixed" : props.checked}
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
