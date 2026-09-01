import { forwardRef } from "react";

import { classNames } from "../../internal/class-names.js";
import type { SplitProps } from "./split.types.js";

/**
 * Creates a responsive primary-secondary split layout. @public
 */
export const Split = forwardRef<HTMLDivElement, SplitProps>(function Split(
  { ratio = "equal", className, ...props },
  ref,
) {
  return (
    <div
      {...props}
      ref={ref}
      data-ratio={ratio}
      className={classNames("miaixz-split", className)}
    />
  );
});
