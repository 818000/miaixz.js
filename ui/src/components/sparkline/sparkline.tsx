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
      viewBox="0 0 120 32"
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
        <g className="miaixz-sparkline-grid" aria-hidden="true">
          {[8, 16, 24].map((y) => (
            <line key={y} x1={inlinePadding} x2={viewBoxWidth - inlinePadding} y1={y} y2={y} />
          ))}
        </g>
      ) : (
        <line
          className="miaixz-sparkline-baseline"
          x1={viewBoxPadding}
          x2={viewBoxWidth - viewBoxPadding}
          y1={baselineY}
          y2={baselineY}
          aria-hidden="true"
        />
      )}
      {!isEmpty &&
        segments.map((segment, index) =>
          segment.length > 1 ? (
            <g key={`segment-${index}`}>
              {variant === "trend" ? (
                <polygon
                  className="miaixz-sparkline-area"
                  points={[
                    `${segment[0]?.x.toFixed(2)},${baselineY.toFixed(2)}`,
                    ...segment.map(({ x, y }) => `${x.toFixed(2)},${y.toFixed(2)}`),
                    `${segment.at(-1)?.x.toFixed(2)},${baselineY.toFixed(2)}`,
                  ].join(" ")}
                  aria-hidden="true"
                />
              ) : null}
              <polyline
                className="miaixz-sparkline-line"
                points={segment.map(({ x, y }) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ")}
                pathLength={1}
                aria-hidden="true"
              />
              {variant === "trend"
                ? segment.map(({ x, y }, pointIndex) => (
                    <circle
                      key={`${x}-${y}-${pointIndex}`}
                      className="miaixz-sparkline-point"
                      cx={x}
                      cy={y}
                      r={1.5}
                      aria-hidden="true"
                    />
                  ))
                : null}
            </g>
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
    </svg>
  );
});
