import { forwardRef } from "react";

import { classNames } from "../../internal/class-names.js";
import type { ScrollProps } from "./scroll.types.js";

/**
 * Creates a bounded, keyboard-focusable overflow region. @public
 */
export const Scroll = forwardRef<HTMLDivElement, ScrollProps>(function Scroll(
  { label, className, tabIndex, ...props },
  ref,
) {
  return (
    <div
      {...props}
      ref={ref}
      aria-label={label}
      role={label ? "region" : undefined}
      tabIndex={tabIndex ?? 0}
      className={classNames("miaixz-scroll", className)}
    />
  );
});
