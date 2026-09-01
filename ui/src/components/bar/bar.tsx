import { forwardRef } from "react";
import type { CSSProperties } from "react";

import { classNames } from "../../internal/class-names.js";
import type { BarProps } from "./bar.types.js";

/**
 * Renders fixed page and navigation progress at the top of the viewport. @public
 */
export const Bar = forwardRef<HTMLDivElement, BarProps>(function Bar(
  { active, complete = false, indeterminate = false, progress = 0, className, style, ...props },
  ref,
) {
  const clampedProgress = Math.min(1, Math.max(0, progress));
  const progressStyle = {
    ...style,
    "--miaixz-bar-progress": clampedProgress,
  } as CSSProperties;

  return (
    <div
      {...props}
      ref={ref}
      aria-hidden="true"
      className={classNames("miaixz-bar", className)}
      data-active={active}
      data-complete={complete}
      data-indeterminate={indeterminate}
      data-miaixz-bar=""
      style={progressStyle}
    >
      <span className="miaixz-bar-fill" />
    </div>
  );
});
