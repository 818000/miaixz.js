import { forwardRef } from "react";

import { classNames } from "../../internal/class-names.js";
import type { StatusIndicatorProps } from "./status-indicator.types.js";

/**
 * Renders a semantic status as both a visual marker and visible text.
 *
 * @public
 */
export const StatusIndicator = forwardRef<HTMLSpanElement, StatusIndicatorProps>(
  function StatusIndicator({ tone, label, className, ...props }, ref) {
    return (
      <span
        {...props}
        ref={ref}
        data-tone={tone}
        className={classNames(
          "miaixz-status-indicator",
          `miaixz-status-indicator-${tone}`,
          className,
        )}
      >
        <span className="miaixz-status-indicator-marker" aria-hidden="true" />
        <span className="miaixz-status-indicator-label">{label}</span>
      </span>
    );
  },
);
