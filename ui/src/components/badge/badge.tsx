import { forwardRef } from "react";

import { classNames } from "../../internal/class-names.js";
import type { BadgeProps } from "./badge.types.js";

/**
 * Renders a compact semantic status or category label.
 *
 * @public
 */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { tone = "neutral", outline = false, dot = false, icon, className, children, ...props },
  ref,
) {
  return (
    <span
      {...props}
      ref={ref}
      data-tone={tone}
      className={classNames(
        "miaixz-badge",
        tone !== "neutral" && `miaixz-badge-${tone}`,
        outline && "miaixz-badge-outline",
        className,
      )}
    >
      {dot && <span className="miaixz-badge-dot" aria-hidden="true" />}
      {icon && <span className="miaixz-badge-icon">{icon}</span>}
      <span className="miaixz-badge-label">{children}</span>
    </span>
  );
});
