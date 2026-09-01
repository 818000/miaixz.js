import { forwardRef } from "react";

import { classNames } from "../../internal/class-names.js";
import type { GridProps } from "./grid.types.js";

/**
 * Creates a responsive auto-fit grid with configurable minimum width. @public
 */
export const Grid = forwardRef<HTMLDivElement, GridProps>(function Grid(
  { minItemWidth = "standard", className, ...props },
  ref,
) {
  return (
    <div
      {...props}
      ref={ref}
      className={classNames(
        "miaixz-grid",
        minItemWidth === "wide" && "miaixz-grid-wide",
        className,
      )}
    />
  );
});
