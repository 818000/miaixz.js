import { forwardRef } from "react";

import { classNames } from "../../internal/class-names.js";
import type { PressableProps } from "./pressable.types.js";

/**
 * Renders a visually neutral button with consistent keyboard focus behavior.
 *
 * @public
 */
export const Pressable = forwardRef<HTMLButtonElement, PressableProps>(function Pressable(
  {
    className,
    disabled,
    type = "button",
    variant = "default",
    density = "standard",
    separator = "solid",
    ...props
  },
  ref,
) {
  return (
    <button
      {...props}
      className={classNames(
        "miaixz-pressable",
        `miaixz-pressable-${variant}`,
        `miaixz-pressable-density-${density}`,
        `miaixz-pressable-separator-${separator}`,
        className,
      )}
      data-disabled={disabled || undefined}
      disabled={disabled}
      ref={ref}
      type={type}
    />
  );
});
