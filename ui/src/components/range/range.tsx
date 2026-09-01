import { forwardRef } from "react";

import { classNames } from "../../internal/class-names.js";
import type { RangeProps } from "./range.types.js";

/**
 * Renders a branded native range input with the shared form-state contract.
 *
 * @public
 */
export const Range = forwardRef<HTMLInputElement, RangeProps>(function Range(
  { className, disabled, invalid = false, previewState, readOnly, ...props },
  ref,
) {
  return (
    <input
      {...props}
      aria-invalid={invalid || undefined}
      className={classNames("miaixz-range", className)}
      data-disabled={disabled || undefined}
      data-invalid={invalid || undefined}
      data-preview-state={previewState}
      data-readonly={readOnly || undefined}
      disabled={disabled}
      readOnly={readOnly}
      ref={ref}
      type="range"
    />
  );
});
