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

/* eslint-disable jsdoc/require-jsdoc -- Public Donut contract lives in its type module.
 */
import { forwardRef, useEffect, useId, useRef, useState, type CSSProperties } from "react";

import { MiaixzUiError } from "../../errors/ui-error.js";
import { useMiaixzLocale } from "../../i18n/i18n.js";
import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import type { DonutOwnerState, DonutProps } from "./donut.types.js";
import { withMiaixzThemeComponent } from "../../theme/themed-component.js";

interface DonutSegmentStyle extends CSSProperties {
  readonly "--miaixz-donut-segment": string;
  readonly "--miaixz-donut-offset": string;
}

export const Donut = withMiaixzThemeComponent(
  "Donut",
  forwardRef<HTMLDivElement, DonutProps>(function Donut(
    {
      segments,
      center,
      description,
      size = "large",
      variant = "ring",
      legend = "inline",
      animate = false,
      valueFormatter,
      percentageFormatter,
      slotProps,
      "aria-label": ariaLabel,
      ...props
    },
    ref,
  ) {
    const { locale, t } = useMiaixzLocale();
    const descriptionId = useId();
    const ids = new Set<string>();
    for (const segment of segments) {
      if (ids.has(segment.id)) {
        throw new MiaixzUiError({
          code: "UI_DONUT_DUPLICATE_SEGMENT_ID",
          details: { id: segment.id },
        });
      }
      if (!Number.isFinite(segment.value) || segment.value < 0) {
        throw new MiaixzUiError({
          code: "UI_DONUT_VALUE_INVALID",
          details: { id: segment.id },
        });
      }
      ids.add(segment.id);
    }
    const total = segments.reduce((sum, segment) => sum + segment.value, 0);
    let offset = 0;
    const formatValue =
      valueFormatter ??
      ((value: number) =>
        new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value));
    const formatPercentage =
      percentageFormatter ??
      ((ratio: number) =>
        new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 }).format(
          ratio,
        ));
    const normalized = segments.map((segment) => {
      const ratio = total === 0 ? 0 : segment.value / total;
      const currentOffset = offset;
      offset += ratio * 100;
      return {
        segment,
        ratio,
        offset: currentOffset,
        valueText: formatValue(segment.value, segment),
        percentageText: formatPercentage(ratio, segment),
      };
    });
    const [animating, setAnimating] = useState(false);
    const mountedRef = useRef(false);
    const signature = segments.map(({ id, value, tone }) => `${id}:${value}:${tone}`).join("|");
    useEffect(() => {
      if (!mountedRef.current) {
        mountedRef.current = true;
        return;
      }
      const reducedMotion =
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!animate || reducedMotion) return;
      setAnimating(false);
      const timer = window.setTimeout(() => setAnimating(true), 0);
      return () => window.clearTimeout(timer);
    }, [animate, signature]);
    const state = total === 0 ? "empty" : "ready";
    const ownerState: DonutOwnerState = { size, variant, legend, state, animate: animating };
    return (
      <div
        {...mergeMiaixzSlotProps({
          ownerState,
          defaultProps: { className: "miaixz-donut" },
          componentProps: props,
          slotProps: slotProps?.root,
          forwardedRef: ref,
          internalProps: {
            role: "group",
            "aria-label": ariaLabel,
            ...(description === undefined ? {} : { "aria-describedby": descriptionId }),
            "data-size": size,
            "data-variant": variant,
            "data-state": state,
            ...(animating ? { "data-animate": true } : {}),
          },
          ownedProps: ["role", "aria-label", "aria-describedby"],
        })}
      >
        <span
          {...mergeMiaixzSlotProps({
            ownerState,
            defaultProps: { className: "miaixz-donut-visual" },
            slotProps: slotProps?.visual,
            internalProps: { "aria-hidden": true },
            ownedProps: ["aria-hidden"],
          })}
        >
          <svg className="miaixz-donut-svg" viewBox="0 0 100 100">
            <circle className="miaixz-donut-track" cx="50" cy="50" r="40" pathLength="100" />
            {total > 0 &&
              normalized.map(
                ({ segment, ratio, offset: segmentOffset, valueText, percentageText }) => (
                  <circle
                    {...mergeMiaixzSlotProps({
                      ownerState,
                      defaultProps: {
                        className: `miaixz-donut-segment miaixz-donut-tone-${segment.tone}`,
                      },
                      slotProps: slotProps?.segment,
                      internalProps: {
                        cx: 50,
                        cy: 50,
                        r: 40,
                        pathLength: 100,
                        style: {
                          "--miaixz-donut-segment": `${ratio * 100} ${100 - ratio * 100}`,
                          "--miaixz-donut-offset": `${-segmentOffset}`,
                        } as DonutSegmentStyle,
                        "aria-label": `${segment.label}: ${valueText}, ${percentageText}`,
                      },
                      ownedProps: ["cx", "cy", "r", "pathLength", "aria-label"],
                    })}
                    key={segment.id}
                  />
                ),
              )}
          </svg>
          {center !== undefined && <span className="miaixz-donut-center">{center}</span>}
        </span>
        {legend === "inline" && (
          <ul
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-donut-legend" },
              slotProps: slotProps?.legend,
            })}
          >
            {normalized.map(({ segment, valueText, percentageText }) => (
              <li
                {...mergeMiaixzSlotProps({
                  ownerState,
                  defaultProps: { className: "miaixz-donut-legend-item" },
                  slotProps: slotProps?.legendItem,
                })}
                key={segment.id}
              >
                <span
                  className={`miaixz-donut-dot miaixz-donut-tone-${segment.tone}`}
                  aria-hidden="true"
                />
                <span className="miaixz-donut-label">{segment.label}</span>
                <span className="miaixz-donut-value">{valueText}</span>
                <span className="miaixz-donut-percentage">{percentageText}</span>
              </li>
            ))}
          </ul>
        )}
        {description !== undefined && (
          <div
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-donut-description" },
              slotProps: slotProps?.description,
              internalProps: { id: descriptionId },
              ownedProps: ["id"],
            })}
          >
            {description}
          </div>
        )}
        <table
          {...mergeMiaixzSlotProps({
            ownerState,
            defaultProps: { className: "miaixz-hidden miaixz-donut-table" },
            slotProps: slotProps?.table,
          })}
        >
          <caption {...mergeMiaixzSlotProps({ ownerState, slotProps: slotProps?.caption })}>
            {ariaLabel}
          </caption>
          <thead>
            <tr>
              {[t("ui.donut.segment"), t("ui.donut.value"), t("ui.donut.percentage")].map(
                (heading) => (
                  <th
                    {...mergeMiaixzSlotProps({
                      ownerState,
                      slotProps: slotProps?.tableHeader,
                      internalProps: { scope: "col" },
                      ownedProps: ["scope"],
                    })}
                    key={heading}
                  >
                    {heading}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {normalized.map(({ segment, valueText, percentageText }) => (
              <tr key={segment.id}>
                <th
                  {...mergeMiaixzSlotProps({
                    ownerState,
                    slotProps: slotProps?.tableHeader,
                    internalProps: { scope: "row" },
                    ownedProps: ["scope"],
                  })}
                >
                  {segment.label}
                </th>
                <td {...mergeMiaixzSlotProps({ ownerState, slotProps: slotProps?.tableCell })}>
                  {valueText}
                </td>
                <td {...mergeMiaixzSlotProps({ ownerState, slotProps: slotProps?.tableCell })}>
                  {percentageText}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }),
);
