import { forwardRef } from "react";

import { classNames } from "../../internal/class-names.js";
import { Icon } from "../icon/index.js";
import type { IconSize } from "../icon/index.js";
import type { MiaixzComponentSize } from "../shared.types.js";
import { Hidden } from "../hidden/index.js";
import type { SpinnerProps } from "./spinner.types.js";

const miaixzSpinnerIconSizes: Record<MiaixzComponentSize, IconSize> = {
  small: "inline",
  medium: "navigation",
  large: "feature",
};

/**
 * Renders an accessible indeterminate loading indicator with reduced-motion fallback.
 *
 * @public
 */
export const Spinner = forwardRef<HTMLSpanElement, SpinnerProps>(function Spinner(
  { size = "medium", label, className, ...props },
  ref,
) {
  return (
    <span
      {...props}
      ref={ref}
      role="status"
      data-size={size}
      className={classNames("miaixz-spinner", `miaixz-spinner-${size}`, className)}
    >
      <Icon name="LoaderCircle" size={miaixzSpinnerIconSizes[size]} />
      <Hidden>{label}</Hidden>
    </span>
  );
});
