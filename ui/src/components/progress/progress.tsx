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

import { forwardRef, type CSSProperties } from "react";

import { createMiaixzUiError } from "../../errors/index.js";
import { classNames } from "../../shared/class-names.js";
import { useVisualizationMotion } from "../../shared/use-visualization-motion.js";
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
