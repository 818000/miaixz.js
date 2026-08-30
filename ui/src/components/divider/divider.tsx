import { forwardRef } from "react";

import { classNames } from "../../internal/class-names.js";
import type { DividerProps } from "./divider.types.js";

/**
 * Renders a semantic separator along the selected axis.
 *
 * @public
 */
export const Divider = forwardRef<HTMLDivElement, DividerProps>(function Divider(
  { orientation = "horizontal", className, ...props },
  ref,
) {
  return (
    <div
      {...props}
      ref={ref}
      role="separator"
      aria-orientation={orientation === "vertical" ? "vertical" : undefined}
      data-orientation={orientation}
      className={classNames("miaixz-divider", `miaixz-divider-${orientation}`, className)}
    />
  );
});
