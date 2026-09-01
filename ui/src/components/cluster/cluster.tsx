import { forwardRef } from "react";

import { classNames } from "../../internal/class-names.js";
import type { ClusterProps } from "./cluster.types.js";

/**
 * Arranges wrapping inline content with controlled alignment and spacing. @public
 */
export const Cluster = forwardRef<HTMLDivElement, ClusterProps>(function Cluster(
  { justify = "start", className, ...props },
  ref,
) {
  return (
    <div
      {...props}
      ref={ref}
      data-justify={justify}
      className={classNames("miaixz-cluster", className)}
    />
  );
});
