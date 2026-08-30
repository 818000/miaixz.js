import { forwardRef } from "react";

import { classNames } from "../../internal/class-names.js";
import type { SwitchProps } from "./switch.types.js";

/**
 * Renders an accessible boolean switch backed by a native checkbox input.
 *
 * @public
 */
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  { label, description, className, disabled, ...props },
  ref,
) {
  return (
    <label className={classNames("miaixz-switch", disabled && "miaixz-switch-disabled", className)}>
      <input
        {...props}
        ref={ref}
        type="checkbox"
        role="switch"
        disabled={disabled}
        className="miaixz-switch-input"
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
