import { forwardRef } from "react";

import { classNames } from "../../internal/class-names.js";
import type { StatusProps } from "./status.types.js";

/**
 * Renders a semantic status as both a visual marker and visible text.
 *
 * @public
 */
export const Status = forwardRef<HTMLSpanElement, StatusProps>(function Status(
  { tone, label, size = "medium", className, ...props },
  ref,
) {
  return (
    <span
      {...props}
      ref={ref}
      data-tone={tone}
      className={classNames(
        "miaixz-status",
        `miaixz-status-${tone}`,
        `miaixz-status-size-${size}`,
        className,
      )}
    >
      <span className="miaixz-status-marker" aria-hidden="true" />
      <span className="miaixz-status-label">{label}</span>
    </span>
  );
});
