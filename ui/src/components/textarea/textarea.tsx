import { forwardRef } from "react";

import { classNames } from "../../internal/class-names.js";
import type { TextareaProps } from "./textarea.types.js";

/**
 * Renders a multiline text control using the shared form appearance.
 *
 * @public
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    size = "medium",
    invalid = false,
    resize = "vertical",
    className,
    "aria-invalid": ariaInvalid,
    ...props
  },
  ref,
) {
  const isInvalid = invalid || ariaInvalid === true || ariaInvalid === "true";

  return (
    <textarea
      {...props}
      ref={ref}
      aria-invalid={isInvalid || undefined}
      data-size={size}
      data-invalid={isInvalid || undefined}
      data-resize={resize}
      className={classNames(
        "miaixz-textarea",
        `miaixz-textarea-${size}`,
        isInvalid && "miaixz-textarea-invalid",
        className,
      )}
    />
  );
});
