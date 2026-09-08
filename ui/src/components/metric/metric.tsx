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

import { forwardRef, type Ref } from "react";

import { classNames } from "../../shared/class-names.js";
import { useVisualizationMotion } from "../../shared/use-visualization-motion.js";
import type { MetricProps, MetricPart } from "./metric.types.js";

/**
 * Resolves a metric text recipe while preserving consumer-owned markup.
 *
 * @param part - Public metric recipe part.
 * @param className - Optional consumer class name.
 * @returns Complete public recipe class name.
 * @public
 */
export function getMetricClassName(part: MetricPart, className?: string): string {
  return classNames(`miaixz-metric-native-${part}`, className);
}

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
    variant !== "tile" && variant !== "stat" && variant !== "entity" && "miaixz-metric",
    `miaixz-metric-${variant}`,
    variant === "strip" && icon != null && "miaixz-metric-strip-with-icon",
    `miaixz-metric-tone-${tone}`,
    interactive && "miaixz-metric-interactive",
    className,
  );
  const content =
    variant === "tile" ? (
      <>
        {icon !== undefined && <span className="miaixz-metric-tile-icon">{icon}</span>}
        <div>
          <small>{label}</small>
          <strong>{value}</strong>
          {hint !== undefined && <p>{hint}</p>}
        </div>
        {trend !== undefined && <b>{trend}</b>}
        {status}
        {visual}
      </>
    ) : variant === "stat" || variant === "entity" ? (
      <>
        <span>{label}</span>
        <strong>{value}</strong>
        {hint !== undefined && <small>{hint}</small>}
        {status}
        {visual}
      </>
    ) : (
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
