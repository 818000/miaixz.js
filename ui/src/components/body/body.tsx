import { forwardRef } from "react";

import { classNames } from "../../internal/class-names.js";
import type { BodyProps } from "./body.types.js";

/**
 * Wraps primary page content with standardized vertical rhythm. @public
 */
export const Body = forwardRef<HTMLDivElement, BodyProps>(function Body(
  { className, ...props },
  ref,
) {
  return <div {...props} ref={ref} className={classNames("miaixz-body", className)} />;
});
