import { forwardRef } from "react";

import { classNames } from "../../internal/class-names.js";
import { Icon } from "../icon/index.js";
import type { MiaixzFeedbackTone } from "../shared.types.js";
import type { InlineMessageProps } from "./inline-message.types.js";

const miaixzInlineMessageIcons: Record<
  MiaixzFeedbackTone,
  "Info" | "CircleCheck" | "TriangleAlert" | "CircleAlert"
> = {
  neutral: "Info",
  info: "Info",
  success: "CircleCheck",
  warning: "TriangleAlert",
  danger: "CircleAlert",
};

/**
 * Renders compact status feedback with an explicit visual and semantic tone.
 *
 * @public
 */
export const InlineMessage = forwardRef<HTMLDivElement, InlineMessageProps>(function InlineMessage(
  { tone = "neutral", className, children, ...props },
  ref,
) {
  return (
    <div
      {...props}
      ref={ref}
      role="status"
      aria-live={tone === "danger" ? "assertive" : undefined}
      data-tone={tone}
      className={classNames("miaixz-inline-message", `miaixz-inline-message-${tone}`, className)}
    >
      <Icon
        name={miaixzInlineMessageIcons[tone]}
        size="inline"
        className="miaixz-inline-message-icon"
      />
      <span>{children}</span>
    </div>
  );
});
