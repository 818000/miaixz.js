import { forwardRef } from "react";

import { classNames } from "../../internal/class-names.js";
import { Icon } from "../icon/index.js";
import type { MiaixzFeedbackTone } from "../shared.types.js";
import type { NoticeProps } from "./notice.types.js";

const miaixzNoticeIcons: Record<
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
export const Notice = forwardRef<HTMLDivElement, NoticeProps>(function Notice(
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
      className={classNames("miaixz-notice", `miaixz-notice-${tone}`, className)}
    >
      <Icon name={miaixzNoticeIcons[tone]} size="inline" className="miaixz-notice-icon" />
      <span>{children}</span>
    </div>
  );
});
