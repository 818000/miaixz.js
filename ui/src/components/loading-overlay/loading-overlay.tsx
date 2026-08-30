import { forwardRef } from "react";

import { classNames } from "../../internal/class-names.js";
import { Spinner } from "../spinner/index.js";
import type { LoadingOverlayProps } from "./loading-overlay.types.js";

/**
 * Renders a loading surface without unmounting the underlying content.
 *
 * @public
 */
export const LoadingOverlay = forwardRef<HTMLDivElement, LoadingOverlayProps>(
  function LoadingOverlay({ active, label, children, className, ...props }, ref) {
    return (
      <div
        {...props}
        ref={ref}
        aria-busy={active || undefined}
        data-loading={active || undefined}
        className={classNames("miaixz-loading-overlay", className)}
      >
        <div className="miaixz-loading-overlay-content">{children}</div>
        {active && (
          <div className="miaixz-loading-overlay-surface">
            <Spinner label={label} />
          </div>
        )}
      </div>
    );
  },
);
