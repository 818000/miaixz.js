import { forwardRef, type Ref } from "react";

import { classNames } from "../../internal/class-names.js";
import type { MetricProps } from "./metric.types.js";

/**
 * Renders a reusable value summary with optional status, trend, and visual content.
 *
 * @public
 */
export const Metric = forwardRef<HTMLElement, MetricProps>(function Metric(
  {
    label,
    value,
    hint,
    icon,
    status,
    trend,
    visual,
    tone = "neutral",
    variant = "default",
    href,
    onAction,
    className,
    ...props
  },
  ref,
) {
  const interactive = href !== undefined || onAction !== undefined;
  const metricClassName = classNames(
    "miaixz-metric",
    `miaixz-metric-${variant}`,
    `miaixz-metric-tone-${tone}`,
    interactive && "miaixz-metric-interactive",
    className,
  );
  const content = (
    <>
      <span className="miaixz-metric-heading">
        {icon !== undefined && <span className="miaixz-metric-icon">{icon}</span>}
        <span className="miaixz-metric-label">{label}</span>
        {status !== undefined && <span className="miaixz-metric-status">{status}</span>}
      </span>
      <span className="miaixz-metric-reading">
        <span className="miaixz-metric-value">{value}</span>
        {trend !== undefined && <span className="miaixz-metric-trend">{trend}</span>}
      </span>
      {hint !== undefined && <span className="miaixz-metric-hint">{hint}</span>}
      {visual !== undefined && <span className="miaixz-metric-visual">{visual}</span>}
    </>
  );

  if (href !== undefined) {
    return (
      <a
        {...props}
        ref={ref as Ref<HTMLAnchorElement>}
        className={metricClassName}
        href={href}
        data-tone={tone}
      >
        {content}
      </a>
    );
  }
  if (onAction !== undefined) {
    return (
      <button
        {...props}
        ref={ref as Ref<HTMLButtonElement>}
        className={metricClassName}
        type="button"
        data-tone={tone}
        onClick={onAction}
      >
        {content}
      </button>
    );
  }
  return (
    <article {...props} ref={ref} className={metricClassName} data-tone={tone}>
      {content}
    </article>
  );
});
