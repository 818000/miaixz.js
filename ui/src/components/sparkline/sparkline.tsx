/*
 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
 ~                                                                           ~
 ~ Copyright (c) 2015-2026 miaixz.org and other contributors.                ~
 ~                                                                           ~
 ~ Licensed under the Apache License, Version 2.0 (the "License");           ~
 ~ you may not use this file except in compliance with the License.          ~
 ~ You may obtain a copy of the License at                                   ~
 ~                                                                           ~
 ~      https://www.apache.org/licenses/LICENSE-2.0                          ~
 ~                                                                           ~
 ~ Unless required by applicable law or agreed to in writing, software       ~
 ~ distributed under the License is distributed on an "AS IS" BASIS,         ~
 ~ WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  ~
 ~ See the License for the specific language governing permissions and       ~
 ~ limitations under the License.                                            ~
 ~                                                                           ~
 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
*/

import { forwardRef } from "react";

import { classNames } from "../../shared/class-names.js";
import { useVisualizationMotion } from "../../shared/use-visualization-motion.js";
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
const trendViewBoxWidth = 360;
const trendViewBoxHeight = 82;
const trendViewBoxPadding = 8;
const trendViewBox = `0 0 ${trendViewBoxWidth} ${trendViewBoxHeight}`;
const trendGridPath = "M0 18H360 M0 46H360 M0 74H360";

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
  const chartWidth = variant === "trend" ? trendViewBoxWidth : viewBoxWidth;
  const chartHeight = variant === "trend" ? trendViewBoxHeight : viewBoxHeight;
  const chartPadding = variant === "trend" ? trendViewBoxPadding : viewBoxPadding;
  const inlinePadding = variant === "trend" ? 0 : chartPadding;
  const plotWidth = chartWidth - inlinePadding * 2;
  const plotHeight = chartHeight - chartPadding * 2;
  const baselineRatio = range === 0 ? 0.5 : (0 - minimum) / range;
  const baselineY = chartPadding + plotHeight * (1 - Math.min(1, Math.max(0, baselineRatio)));
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
          ? chartWidth / 2
          : inlinePadding + plotWidth * (index / (values.length - 1));
      const ratio = range === 0 ? 0.5 : (value - minimum) / range;
      activeSegment.push({ x, y: chartPadding + plotHeight * (1 - ratio) });
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
          {!isEmpty &&
            segments.map((segment, index) => {
              const points = segment.map(({ x, y }) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
              const first = segment[0];
              const last = segment.at(-1);
              if (first === undefined || last === undefined) return null;
              return (
                <g key={`trend-segment-${index}`}>
                  {segment.length > 1 && (
                    <>
                      <polygon
                        className="miaixz-sparkline-area"
                        points={`${points} ${last.x.toFixed(2)},${chartHeight - chartPadding} ${first.x.toFixed(2)},${chartHeight - chartPadding}`}
                        aria-hidden="true"
                      />
                      <polyline
                        className="miaixz-sparkline-line"
                        points={points}
                        pathLength={1}
                        aria-hidden="true"
                      />
                    </>
                  )}
                  <g className="miaixz-sparkline-points" aria-hidden="true">
                    {segment.map(({ x, y }) => (
                      <circle
                        key={`${x}-${y}`}
                        className="miaixz-sparkline-point"
                        cx={x}
                        cy={y}
                        r={2.5}
                      />
                    ))}
                  </g>
                </g>
              );
            })}
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
