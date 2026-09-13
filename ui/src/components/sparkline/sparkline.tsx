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

/* eslint-disable jsdoc/require-jsdoc -- Public Sparkline contract lives in its type module.
 */
import { forwardRef, useId } from "react";

import { useMiaixzLocale } from "../../i18n/i18n.js";
import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import type { SparklineOwnerState, SparklineProps } from "./sparkline.types.js";
import { withMiaixzThemeComponent } from "../../theme/themed-component.js";

interface SparklinePoint {
  readonly x: number;
  readonly y: number;
}

const dimensions = {
  small: { width: 120, height: 32, padding: 2 },
  medium: { width: 120, height: 32, padding: 2 },
  large: { width: 360, height: 82, padding: 8 },
} as const;

export const Sparkline = withMiaixzThemeComponent(
  "Sparkline",
  forwardRef<SVGSVGElement, SparklineProps>(function Sparkline(
    {
      values,
      tone = "brand",
      variant = "line",
      size = "small",
      showGrid = false,
      valueFormatter,
      description,
      slotProps,
      "aria-label": ariaLabel,
      ...props
    },
    ref,
  ) {
    const { locale, t } = useMiaixzLocale();
    const titleId = useId();
    const descriptionId = useId();
    const finiteValues = values.filter(Number.isFinite);
    const state = finiteValues.length === 0 ? "empty" : "ready";
    const ownerState: SparklineOwnerState = { variant, size, tone, showGrid, state };
    const format =
      valueFormatter ?? ((value: number) => new Intl.NumberFormat(locale).format(value));
    const resolvedDescription =
      description ??
      (finiteValues.length === 0
        ? t("ui.sparkline.empty")
        : t("ui.sparkline.summary", {
            first: format(finiteValues[0]!),
            last: format(finiteValues[finiteValues.length - 1]!),
            minimum: format(Math.min(...finiteValues)),
            maximum: format(Math.max(...finiteValues)),
          }));
    const { width, height, padding } = dimensions[size];
    const minimum = finiteValues.length === 0 ? 0 : Math.min(...finiteValues);
    const maximum = finiteValues.length === 0 ? 1 : Math.max(...finiteValues);
    const range = maximum - minimum;
    const plotWidth = width - padding * 2;
    const plotHeight = height - padding * 2;
    const segments: SparklinePoint[][] = [];
    let current: SparklinePoint[] = [];
    if (finiteValues.length === 1) {
      segments.push([{ x: width / 2, y: height / 2 }]);
    } else if (finiteValues.length > 1) {
      values.forEach((value, index) => {
        if (!Number.isFinite(value)) {
          if (current.length > 0) segments.push(current);
          current = [];
          return;
        }
        const x = padding + plotWidth * (index / Math.max(1, values.length - 1));
        const ratio = range === 0 ? 0.5 : (value - minimum) / range;
        current.push({ x, y: padding + plotHeight * (1 - ratio) });
      });
      if (current.length > 0) segments.push(current);
    }
    const gridY = [18, 46, 74].map((value) => (value * height) / 82);
    return (
      <svg
        {...mergeMiaixzSlotProps({
          ownerState,
          defaultProps: { className: "miaixz-sparkline" },
          componentProps: props,
          slotProps: slotProps?.root,
          forwardedRef: ref,
          internalProps: {
            role: "img",
            "aria-labelledby": titleId,
            "aria-describedby": descriptionId,
            viewBox: `0 0 ${width} ${height}`,
            preserveAspectRatio: size === "large" ? "none" : undefined,
            "data-state": state,
            "data-tone": tone,
            "data-variant": variant,
            "data-size": size,
          },
          ownedProps: ["role", "aria-labelledby", "aria-describedby", "viewBox"],
        })}
      >
        <title
          {...mergeMiaixzSlotProps({
            ownerState,
            slotProps: slotProps?.title,
            internalProps: { id: titleId },
            ownedProps: ["id"],
          })}
        >
          {ariaLabel}
        </title>
        <desc
          {...mergeMiaixzSlotProps({
            ownerState,
            slotProps: slotProps?.description,
            internalProps: { id: descriptionId },
            ownedProps: ["id"],
          })}
        >
          {resolvedDescription}
        </desc>
        {showGrid && state === "ready" && (
          <path
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-sparkline-grid" },
              slotProps: slotProps?.grid,
              internalProps: {
                d: gridY.map((y) => `M0 ${y}H${width}`).join(" "),
                "aria-hidden": true,
              },
              ownedProps: ["d", "aria-hidden"],
            })}
          />
        )}
        {segments.map((segment, index) => {
          const points = segment.map(({ x, y }) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
          const first = segment[0];
          const last = segment[segment.length - 1];
          return (
            <g key={`${index}-${points}`}>
              {variant === "area" &&
                segment.length > 1 &&
                first !== undefined &&
                last !== undefined && (
                  <polygon
                    {...mergeMiaixzSlotProps({
                      ownerState,
                      defaultProps: { className: "miaixz-sparkline-area" },
                      slotProps: slotProps?.area,
                      internalProps: {
                        points: `${points} ${last.x.toFixed(2)},${height - padding} ${first.x.toFixed(2)},${height - padding}`,
                        "aria-hidden": true,
                      },
                      ownedProps: ["points", "aria-hidden"],
                    })}
                  />
                )}
              {segment.length > 1 && (
                <polyline
                  {...mergeMiaixzSlotProps({
                    ownerState,
                    defaultProps: { className: "miaixz-sparkline-line" },
                    slotProps: slotProps?.line,
                    internalProps: { points, pathLength: 1, "aria-hidden": true },
                    ownedProps: ["points", "pathLength", "aria-hidden"],
                  })}
                />
              )}
              <g
                {...mergeMiaixzSlotProps({
                  ownerState,
                  defaultProps: { className: "miaixz-sparkline-points" },
                  slotProps: slotProps?.points,
                  internalProps: { "aria-hidden": true },
                  ownedProps: ["aria-hidden"],
                })}
              >
                {segment.map(({ x, y }, pointIndex) => (
                  <circle
                    key={`${pointIndex}-${x}-${y}`}
                    className="miaixz-sparkline-point"
                    cx={x}
                    cy={y}
                    r={size === "large" ? 2.5 : 1.5}
                  />
                ))}
              </g>
            </g>
          );
        })}
      </svg>
    );
  }),
);
