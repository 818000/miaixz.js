import { forwardRef } from "react";

import { useMiaixzLocale } from "../../i18n/index.js";
import { classNames } from "../../internal/class-names.js";
import { Button } from "../button/index.js";
import { Icon } from "../icon/index.js";
import type { ToastProps, ToastTone } from "./toast.types.js";

const toneIcons: Record<ToastTone, "Info" | "CircleCheck" | "TriangleAlert" | "CircleAlert"> = {
  neutral: "Info",
  success: "CircleCheck",
  warning: "TriangleAlert",
  danger: "CircleAlert",
  info: "Info",
};

/**
 * Renders one localized live-region notification. @public
 */
export const Toast = forwardRef<HTMLDivElement, ToastProps>(function Toast(
  { id, title, message, action, tone = "neutral", dismissLabel, onDismiss, className, ...props },
  ref,
) {
  const { t } = useMiaixzLocale();
  const resolvedDismissLabel = dismissLabel ?? t("ui.notification.dismiss");
  return (
    <div
      {...props}
      ref={ref}
      role={tone === "danger" ? "alert" : "status"}
      className={classNames(
        "miaixz-toast",
        tone !== "neutral" && `miaixz-toast-${tone}`,
        className,
      )}
    >
      <Icon name={toneIcons[tone]} size="control" className="miaixz-toast-icon" />
      <div className="miaixz-toast-content">
        <p className="miaixz-toast-title">{title}</p>
        {message !== undefined && <p className="miaixz-toast-message">{message}</p>}
        {action !== undefined && <div className="miaixz-toast-actions">{action}</div>}
      </div>
      {onDismiss && (
        <Button
          iconOnly
          variant="ghost"
          size="small"
          aria-label={resolvedDismissLabel}
          className="miaixz-toast-dismiss"
          onClick={() => onDismiss(id)}
        >
          <Icon name="X" size="control" />
        </Button>
      )}
    </div>
  );
});
