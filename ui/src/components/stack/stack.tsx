import { forwardRef } from "react";

import { classNames } from "../../internal/class-names.js";
import type { StackProps } from "./stack.types.js";

/**
 * Arranges children vertically using a design-token gap. @public
 */
export const Stack = forwardRef<HTMLDivElement, StackProps>(function Stack(
  { className, ...props },
  ref,
) {
  return <div {...props} ref={ref} className={classNames("miaixz-stack", className)} />;
});
