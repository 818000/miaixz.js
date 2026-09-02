import { forwardRef, type CSSProperties } from "react";

import { classNames } from "../../internal/class-names.js";
import { useVisualizationMotion } from "../../internal/use-visualization-motion.js";
import type { ColumnsProps } from "./columns.types.js";

/**
 * Extends React styles with the private normalized datum value.
 */
interface MiaixzColumnsDatumStyle extends CSSProperties {
  /**
   * Supplies one clamped zero-to-one-hundred percentage.
   */
  readonly "--miaixz-columns-value": string;
}

/**
 * Renders a compact one- or two-series column chart.
 *
 * @public
 */
export const Columns = forwardRef<HTMLDivElement, ColumnsProps>(function Columns(
  {
    labels,
    series,
    maximum: suppliedMaximum,
    tone,
    variant = "default",
    className,
    onPointerEnter,
    onPointerLeave,
    "aria-label": ariaLabel,
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
  if (series.length > 2) throw new TypeError("Columns accepts at most two series");
  if (series.some(({ values }) => values.length !== labels.length)) {
    throw new TypeError("Columns labels and series values must have equal lengths");
  }
  if (series.some(({ values }) => values.some((value) => !Number.isFinite(value)))) {
    throw new TypeError("Columns series values must be finite numbers");
  }
  if (
    suppliedMaximum !== undefined &&
    (!Number.isFinite(suppliedMaximum) || suppliedMaximum <= 0)
  ) {
    throw new TypeError("Columns maximum must be a finite positive number");
  }

  const isEmpty = labels.length === 0 || series.length === 0;
  const dataMaximum = isEmpty
    ? 0
    : Math.max(0, ...series.flatMap(({ values }) => values.map((value) => Math.max(0, value))));
  const maximum = suppliedMaximum ?? dataMaximum;

  return (
    <div
      {...props}
      ref={ref}
      role="img"
      aria-label={ariaLabel}
      data-state={isEmpty ? "empty" : "ready"}
      data-motion-state={motionState}
      data-tone={tone}
      className={classNames(
        "miaixz-columns",
        `miaixz-columns-${variant}`,
        `miaixz-columns-tone-${tone}`,
        className,
      )}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      <span className="miaixz-columns-plot" aria-hidden="true">
        {!isEmpty &&
          labels.map((label, labelIndex) => (
            <span key={`${label}-${labelIndex}`} className="miaixz-columns-group">
              <span className="miaixz-columns-bars">
                {series.map(({ label: seriesLabel, values }, seriesIndex) => {
                  const value = values[labelIndex] ?? 0;
                  const percentage =
                    maximum === 0 ? 0 : Math.min(100, (Math.max(0, value) / maximum) * 100);
                  const style: MiaixzColumnsDatumStyle = {
                    "--miaixz-columns-value": `${percentage}%`,
                  };
                  return (
                    <span
                      key={`${seriesLabel}-${seriesIndex}`}
                      className={classNames(
                        "miaixz-columns-bar",
                        seriesIndex === 1 && "miaixz-columns-bar-secondary",
                      )}
                      style={style}
                      title={`${seriesLabel}, ${label}: ${value}`}
                    />
                  );
                })}
              </span>
              <span className="miaixz-columns-label">{label}</span>
            </span>
          ))}
      </span>
    </div>
  );
});
