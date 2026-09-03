import { forwardRef, type Ref } from "react";

import { classNames } from "../../internal/class-names.js";
import { useVisualizationMotion } from "../../internal/use-visualization-motion.js";
import type { MetricProps } from "./metric.types.js";

/**
 * Renders a reusable value summary with optional status, trend, and visual content.
 *
 * @public
 */
export const Metric = forwardRef<HTMLElement, MetricProps>(function Metric(
  {
    label,
    emphasized = false,
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
    onPointerEnter,
    onPointerLeave,
    ...props
  },
  forwardedRef,
) {
  const { ref, motionState, handlePointerEnter, handlePointerLeave } =
    useVisualizationMotion<HTMLElement>({
      forwardedRef,
      onPointerEnter,
      onPointerLeave,
    });
  const interactive = href !== undefined || onAction !== undefined;
  const metricClassName = classNames(
    "miaixz-metric",
    `miaixz-metric-${variant}`,
    variant === "strip" && icon != null && "miaixz-metric-strip-with-icon",
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
        data-emphasized={emphasized || undefined}
        href={href}
        data-motion-state={motionState}
        data-tone={tone}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
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
        data-emphasized={emphasized || undefined}
        type="button"
        data-motion-state={motionState}
        data-tone={tone}
        onClick={onAction}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
      >
        {content}
      </button>
    );
  }
  return (
    <article
      {...props}
      ref={ref}
      className={metricClassName}
      data-emphasized={emphasized || undefined}
      data-motion-state={motionState}
      data-tone={tone}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      {content}
    </article>
  );
});
