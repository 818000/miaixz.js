import { forwardRef } from "react";

import { classNames } from "../../internal/class-names.js";
import { Spinner } from "../spinner/index.js";
import type { OverlayProps } from "./overlay.types.js";

/**
 * Renders a loading surface without unmounting the underlying content.
 *
 * @public
 */
export const Overlay = forwardRef<HTMLDivElement, OverlayProps>(function Overlay(
  { active, label, children, className, ...props },
  ref,
) {
  return (
    <div
      {...props}
      ref={ref}
      aria-busy={active || undefined}
      data-loading={active || undefined}
      className={classNames("miaixz-overlay", className)}
    >
      <div className="miaixz-overlay-content">{children}</div>
      {active && (
        <div className="miaixz-overlay-surface">
          <Spinner label={label} />
        </div>
      )}
    </div>
  );
});
