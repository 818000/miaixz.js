import { forwardRef } from "react";

import { classNames } from "../../internal/class-names.js";
import { useVisualizationMotion } from "../../internal/use-visualization-motion.js";
import type { SparklineProps } from "./sparkline.types.js";

/**
 * Represents one normalized SVG point.
 */
interface SparklinePoint {
  /**
   * Horizontal coordinate in the fixed view box.
   */
  readonly x: number;
  /**
   * Vertical coordinate in the fixed view box.
   */
  readonly y: number;
}

const viewBoxWidth = 120;
const viewBoxHeight = 32;
const viewBoxPadding = 2;
const trendViewBox = "0 0 360 82";
const trendGridPath = "M0 18H360 M0 46H360 M0 74H360";
const trendAreaPath =
  "M0 67 C24 63 34 53 60 55 S95 48 120 42 S156 48 180 35 S216 39 240 29 S276 33 300 20 S336 18 360 11 L360 74 L0 74Z";
const trendLinePath =
  "M0 67 C24 63 34 53 60 55 S95 48 120 42 S156 48 180 35 S216 39 240 29 S276 33 300 20 S336 18 360 11";
const trendPoints = Object.freeze([
  { x: 0, y: 67 },
  { x: 60, y: 55 },
  { x: 120, y: 42 },
  { x: 180, y: 35 },
  { x: 240, y: 29 },
  { x: 300, y: 20 },
  { x: 360, y: 11 },
]);

/**
 * Renders a compact line visualization without inferring missing samples.
 *
 * @public
 */
export const Sparkline = forwardRef<SVGSVGElement, SparklineProps>(function Sparkline(
  {
    values,
    tone = "brand",
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
    useVisualizationMotion<SVGSVGElement>({
      forwardedRef,
      onPointerEnter,
      onPointerLeave,
    });
  const finiteValues = values.filter(Number.isFinite);
  const isEmpty = finiteValues.length < 2;
  const minimum = isEmpty ? 0 : Math.min(...finiteValues);
  const maximum = isEmpty ? 1 : Math.max(...finiteValues);
  const range = maximum - minimum;
  const inlinePadding = variant === "trend" ? 0 : viewBoxPadding;
  const plotWidth = viewBoxWidth - inlinePadding * 2;
  const plotHeight = viewBoxHeight - viewBoxPadding * 2;
  const baselineRatio = range === 0 ? 0.5 : (0 - minimum) / range;
  const baselineY = viewBoxPadding + plotHeight * (1 - Math.min(1, Math.max(0, baselineRatio)));
  const segments: SparklinePoint[][] = [];
  let activeSegment: SparklinePoint[] = [];

  if (!isEmpty) {
    values.forEach((value, index) => {
      if (!Number.isFinite(value)) {
        if (activeSegment.length > 0) segments.push(activeSegment);
        activeSegment = [];
        return;
      }
      const x =
        values.length === 1
          ? viewBoxWidth / 2
          : inlinePadding + plotWidth * (index / (values.length - 1));
      const ratio = range === 0 ? 0.5 : (value - minimum) / range;
      activeSegment.push({ x, y: viewBoxPadding + plotHeight * (1 - ratio) });
    });
    if (activeSegment.length > 0) segments.push(activeSegment);
  }

  return (
    <svg
      {...props}
      ref={ref}
      role="img"
      aria-label={ariaLabel}
      viewBox={variant === "trend" ? trendViewBox : "0 0 120 32"}
      preserveAspectRatio={variant === "trend" ? "none" : undefined}
      data-state={isEmpty ? "empty" : "ready"}
      data-motion-state={motionState}
      data-tone={tone}
      className={classNames(
        "miaixz-sparkline",
        `miaixz-sparkline-${variant}`,
        `miaixz-sparkline-tone-${tone}`,
        className,
      )}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      {variant === "trend" ? (
        <>
          <path className="miaixz-sparkline-grid" d={trendGridPath} aria-hidden="true" />
          <path className="miaixz-sparkline-area" d={trendAreaPath} aria-hidden="true" />
          <path
            className="miaixz-sparkline-line"
            d={trendLinePath}
            pathLength={1}
            aria-hidden="true"
          />
          <g className="miaixz-sparkline-points" aria-hidden="true">
            {trendPoints.map(({ x, y }) => (
              <circle key={`${x}-${y}`} className="miaixz-sparkline-point" cx={x} cy={y} r={2.5} />
            ))}
          </g>
        </>
      ) : (
        <>
          <line
            className="miaixz-sparkline-baseline"
            x1={viewBoxPadding}
            x2={viewBoxWidth - viewBoxPadding}
            y1={baselineY}
            y2={baselineY}
            aria-hidden="true"
          />
          {!isEmpty &&
            segments.map((segment, index) =>
              segment.length > 1 ? (
                <polyline
                  key={`segment-${index}`}
                  className="miaixz-sparkline-line"
                  points={segment.map(({ x, y }) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ")}
                  pathLength={1}
                  aria-hidden="true"
                />
              ) : (
                <circle
                  key={`point-${index}`}
                  className="miaixz-sparkline-point"
                  cx={segment[0]?.x}
                  cy={segment[0]?.y}
                  r={1.5}
                  aria-hidden="true"
                />
              ),
            )}
        </>
      )}
    </svg>
  );
});
