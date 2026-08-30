import { forwardRef } from "react";

import { classNames } from "../../internal/class-names.js";
import type { SkeletonProps } from "./skeleton.types.js";

/**
 * Renders a non-interactive placeholder while content is loading.
 *
 * @public
 */
export const Skeleton = forwardRef<HTMLSpanElement, SkeletonProps>(function Skeleton(
  { variant = "text", width, height, className, style, ...props },
  ref,
) {
  return (
    <span
      {...props}
      ref={ref}
      aria-hidden="true"
      className={classNames(
        "miaixz-skeleton",
        variant !== "custom" && `miaixz-skeleton-${variant}`,
        className,
      )}
      style={{ ...style, width, height }}
    />
  );
});
