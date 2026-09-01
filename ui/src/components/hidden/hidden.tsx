import { forwardRef } from "react";

import { classNames } from "../../internal/class-names.js";
import type { HiddenProps } from "./hidden.types.js";

/**
 * Renders assistive content with the shared Miaixz hidden layout primitive.
 *
 * @public
 */
export const Hidden = forwardRef<HTMLSpanElement, HiddenProps>(function Hidden(
  { className, ...props },
  ref,
) {
  return <span {...props} ref={ref} className={classNames("miaixz-hidden", className)} />;
});
