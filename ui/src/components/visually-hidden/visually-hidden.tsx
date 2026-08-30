import { forwardRef } from "react";

import { classNames } from "../../internal/class-names.js";
import type { VisuallyHiddenProps } from "./visually-hidden.types.js";

/**
 * Renders assistive content with the shared Miaixz visually-hidden layout primitive.
 *
 * @public
 */
export const VisuallyHidden = forwardRef<HTMLSpanElement, VisuallyHiddenProps>(
  function VisuallyHidden({ className, ...props }, ref) {
    return (
      <span {...props} ref={ref} className={classNames("miaixz-visually-hidden", className)} />
    );
  },
);
