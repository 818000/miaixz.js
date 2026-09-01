import { forwardRef } from "react";

import { classNames } from "../../internal/class-names.js";
import type { StickyProps } from "./sticky.types.js";

/**
 * Keeps content pinned within its scrolling container. @public
 */
export const Sticky = forwardRef<HTMLDivElement, StickyProps>(function Sticky(
  { className, ...props },
  ref,
) {
  return <div {...props} ref={ref} className={classNames("miaixz-sticky", className)} />;
});
