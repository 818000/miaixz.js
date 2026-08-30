import { forwardRef } from "react";

import { classNames } from "../../internal/class-names.js";
import { useMiaixzLocale } from "../../i18n/index.js";
import { Button } from "../button/index.js";
import { Icon } from "../icon/index.js";
import type { MiaixzFeedbackTone } from "../shared.types.js";
import type { AlertProps } from "./alert.types.js";

const miaixzAlertIcons: Record<
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
 * Renders a prominent localized feedback message with optional actions and dismissal.
 *
 * @public
 */
export const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(
  { tone = "neutral", title, children, actions, dismissLabel, onDismiss, className, ...props },
  ref,
) {
  const { t } = useMiaixzLocale();
  const resolvedDismissLabel = dismissLabel ?? t("ui.action.dismiss");

  return (
    <div
      {...props}
      ref={ref}
      role={tone === "danger" ? "alert" : "status"}
      data-tone={tone}
      className={classNames("miaixz-alert", `miaixz-alert-${tone}`, className)}
    >
      <Icon name={miaixzAlertIcons[tone]} size="control" className="miaixz-alert-icon" />
      <div className="miaixz-alert-content">
        {title !== undefined && <div className="miaixz-alert-title">{title}</div>}
        <div className="miaixz-alert-message">{children}</div>
        {actions !== undefined && <div className="miaixz-alert-actions">{actions}</div>}
      </div>
      {onDismiss !== undefined && (
        <Button
          iconOnly
          variant="ghost"
          size="small"
          aria-label={resolvedDismissLabel}
          className="miaixz-alert-dismiss"
          onClick={onDismiss}
        >
          <Icon name="X" />
        </Button>
      )}
    </div>
  );
});
