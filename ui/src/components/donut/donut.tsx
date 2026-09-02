import { forwardRef, type CSSProperties } from "react";

import { classNames } from "../../internal/class-names.js";
import { useVisualizationMotion } from "../../internal/use-visualization-motion.js";
import type { DonutProps } from "./donut.types.js";

/**
 * Extends React styles with private normalized donut geometry.
 */
interface MiaixzDonutSegmentStyle extends CSSProperties {
  /**
   * Supplies normalized visible and remaining arc percentages.
   */
  readonly "--miaixz-donut-segment": string;
  /**
   * Supplies the accumulated normalized arc offset.
   */
  readonly "--miaixz-donut-offset": string;
}

/**
 * Renders a normalized donut with a shared legend and center slot.
 *
 * @public
 */
export const Donut = forwardRef<HTMLDivElement, DonutProps>(function Donut(
  { segments, center, size = "large", legend = "inline", className, onPointerEnter, "aria-label": ariaLabel, ...props },
  forwardedRef,
) {
  const { ref, motionState, handlePointerEnter } = useVisualizationMotion<HTMLDivElement>({
    forwardedRef,
    onPointerEnter,
  });
  if (segments.some(({ value }) => !Number.isFinite(value) || value < 0)) {
    throw new TypeError("Donut segment values must be finite non-negative numbers");
  }
  const total = segments.reduce((sum, { value }) => sum + value, 0);
  let offset = 0;
  const normalized = segments.map((segment) => {
    const percentage = total === 0 ? 0 : (segment.value / total) * 100;
    const result = { ...segment, offset, percentage };
    offset += percentage;
    return result;
  });

  return (
    <div
      {...props}
      ref={ref}
      role="img"
      aria-label={ariaLabel}
      data-state={total === 0 ? "empty" : "ready"}
      data-motion-state={motionState}
      className={classNames(
        "miaixz-donut",
        `miaixz-donut-${size}`,
        legend === "hidden" && "miaixz-donut-legend-hidden",
        className,
      )}
      onPointerEnter={handlePointerEnter}
    >
      <span className="miaixz-donut-visual" aria-hidden="true">
        <svg className="miaixz-donut-svg" viewBox="0 0 100 100">
          <circle className="miaixz-donut-track" cx="50" cy="50" r="40" pathLength="100" />
          {total > 0 &&
            normalized.map(({ label, tone, percentage, offset: segmentOffset }, index) => {
              const style: MiaixzDonutSegmentStyle = {
                "--miaixz-donut-segment": `${percentage} ${100 - percentage}`,
                "--miaixz-donut-offset": `${-segmentOffset}`,
              };
              return (
                <circle
                  key={`${label}-${index}`}
                  className={`miaixz-donut-segment miaixz-donut-tone-${tone}`}
                  cx="50"
                  cy="50"
                  r="40"
                  pathLength="100"
                  style={style}
                />
              );
            })}
        </svg>
        {center !== undefined && <span className="miaixz-donut-center">{center}</span>}
      </span>
      {legend === "inline" && (
        <ul className="miaixz-donut-legend" aria-hidden="true">
          {normalized.map(({ label, value, tone }, index) => (
            <li key={`${label}-${index}`} className="miaixz-donut-legend-item">
              <span className={`miaixz-donut-dot miaixz-donut-tone-${tone}`} />
              <span className="miaixz-donut-label">{label}</span>
              <span className="miaixz-donut-value">{value}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});
