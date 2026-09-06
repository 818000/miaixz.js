import { Children, cloneElement, forwardRef, isValidElement } from "react";

import { classNames } from "../../internal/class-names.js";
import type { MetricProps } from "../metric/index.js";
import type { MetricGroupProps } from "./metric-group.types.js";

/**
 * Groups strip metrics inside one responsive framed surface. @public
 */
export const MetricGroup = forwardRef<HTMLDivElement, MetricGroupProps>(function MetricGroup(
  {
    children,
    className,
    columns,
    surface = "default",
    density = "default",
    spacingAfter = "none",
    ...props
  },
  ref,
) {
  return (
    <div
      {...props}
      ref={ref}
      className={classNames(
        "miaixz-metric-group",
        surface === "transparent" && "miaixz-metric-group-transparent",
        density === "compact" && "miaixz-metric-group-compact",
        spacingAfter === "compact" && "miaixz-metric-group-spacing-compact",
        className,
      )}
      data-columns={columns}
    >
      {Children.map(children, (child) =>
        isValidElement<MetricProps>(child) ? cloneElement(child, { variant: "strip" }) : child,
      )}
    </div>
  );
});
