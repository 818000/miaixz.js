import { forwardRef, type CSSProperties } from "react";

import { createMiaixzUiError } from "../../errors/index.js";
import { classNames } from "../../internal/class-names.js";
import { useVisualizationMotion } from "../../internal/use-visualization-motion.js";
import { useMiaixzLocale } from "../../i18n/index.js";
import type { ProgressProps } from "./progress.types.js";

/**
 * Extends React styles with the private progress percentage property.
 */
interface MiaixzProgressStyle extends CSSProperties {
  /**
   * Supplies the clamped determinate fill percentage.
   */
  readonly "--miaixz-progress-value"?: string;
}

/**
 * Renders accessible determinate or indeterminate progress feedback.
 *
 * @public
 */
export const Progress = forwardRef<HTMLDivElement, ProgressProps>(function Progress(
  {
    value,
    max = 100,
    label,
    showValue = false,
    tone = "brand",
    size = "default",
    className,
    onPointerEnter,
    onPointerLeave,
    ...props
  },
  forwardedRef,
) {
  const { ref, motionState, handlePointerEnter, handlePointerLeave } =
    useVisualizationMotion<HTMLDivElement>({
      forwardedRef,
      onPointerEnter,
      onPointerLeave,
    });
  const { t } = useMiaixzLocale();
  if (!Number.isFinite(max) || max <= 0) {
    throw createMiaixzUiError(t, {
      code: "UI_PROGRESS_MAX_INVALID",
      messageKey: "ui.error.progress.maxInvalid",
      details: { max },
    });
  }
  if (value !== undefined && !Number.isFinite(value)) {
    throw createMiaixzUiError(t, {
      code: "UI_PROGRESS_VALUE_INVALID",
      messageKey: "ui.error.progress.valueInvalid",
      details: { value },
    });
  }

  const clampedValue = value === undefined ? undefined : Math.min(max, Math.max(0, value));
  const percentage =
    clampedValue === undefined ? undefined : Math.round((clampedValue / max) * 100);
  const progressStyle: MiaixzProgressStyle | undefined =
    percentage === undefined ? undefined : { "--miaixz-progress-value": `${percentage}%` };

  return (
    <div
      {...props}
      ref={ref}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={clampedValue}
      data-state={clampedValue === undefined ? "indeterminate" : "determinate"}
      data-motion-state={motionState}
      data-tone={tone}
      className={classNames(
        "miaixz-progress",
        `miaixz-progress-${size}`,
        `miaixz-progress-tone-${tone}`,
        tone.startsWith("data-") && "miaixz-progress-tone-data",
        clampedValue === undefined && "miaixz-progress-indeterminate",
        className,
      )}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      <span className="miaixz-progress-track" aria-hidden="true">
        <span className="miaixz-progress-indicator" style={progressStyle} />
      </span>
      {showValue && percentage !== undefined && (
        <span className="miaixz-progress-value">{percentage}%</span>
      )}
    </div>
  );
});
