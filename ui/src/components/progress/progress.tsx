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

/* eslint-disable jsdoc/require-jsdoc -- Public contract is declared in the adjacent type module.
 */
import { forwardRef, type CSSProperties } from "react";
import { MiaixzUiError } from "../../errors/ui-error.js";
import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import type { ProgressOwnerState, ProgressProps } from "./progress.types.js";
import { withMiaixzThemeComponent } from "../../theme/themed-component.js";

interface ProgressIndicatorStyle extends CSSProperties {
  readonly "--miaixz-progress-value"?: string;
}

/*
 * Formats determinate progress as a rounded percentage.
 */
function defaultValueFormatter(value: number, max: number): string {
  return `${Math.round((value / max) * 100)}%`;
}

/*
 * Renders validated determinate or indeterminate progress.
 */
export const Progress = withMiaixzThemeComponent(
  "Progress",
  forwardRef<HTMLDivElement, ProgressProps>(function Progress(
    {
      value,
      max = 100,
      label,
      showValue = false,
      valueFormatter = defaultValueFormatter,
      tone = "brand",
      size = "medium",
      slotProps,
      ...props
    },
    ref,
  ) {
    if (!Number.isFinite(max) || max <= 0) {
      throw new MiaixzUiError({
        code: "UI_PROGRESS_MAX_INVALID",
        details: { max },
      });
    }
    if (value !== undefined && (!Number.isFinite(value) || value < 0 || value > max)) {
      throw new MiaixzUiError({
        code: "UI_PROGRESS_VALUE_INVALID",
        details: { max, value },
      });
    }
    const determinate = value !== undefined;
    const formattedValue = determinate && showValue ? valueFormatter(value, max) : undefined;
    const ownerState: ProgressOwnerState = { size, tone, determinate, showValue };
    const indicatorStyle: ProgressIndicatorStyle | undefined = determinate
      ? { "--miaixz-progress-value": `${(value / max) * 100}%` }
      : undefined;
    return (
      <div
        {...mergeMiaixzSlotProps({
          ownerState,
          defaultProps: { className: "miaixz-progress" },
          componentProps: props,
          slotProps: slotProps?.root,
          forwardedRef: ref,
          internalProps: {
            role: "progressbar",
            "aria-label": label,
            "aria-valuemin": 0,
            "aria-valuemax": max,
            ...(determinate ? { "aria-valuenow": value } : {}),
            ...(formattedValue === undefined ? {} : { "aria-valuetext": formattedValue }),
            "data-state": determinate ? "determinate" : "indeterminate",
            "data-tone": tone,
            "data-size": size,
          },
          ownedProps: [
            "role",
            "aria-label",
            "aria-valuemin",
            "aria-valuemax",
            "aria-valuenow",
            "aria-valuetext",
            "data-state",
            "data-tone",
            "data-size",
          ],
        })}
      >
        <span
          {...mergeMiaixzSlotProps({
            ownerState,
            defaultProps: { className: "miaixz-progress-track" },
            slotProps: slotProps?.track,
            internalProps: { "aria-hidden": true },
            ownedProps: ["aria-hidden"],
          })}
        >
          <span
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-progress-indicator" },
              slotProps: slotProps?.indicator,
              internalProps: { style: indicatorStyle },
            })}
          />
        </span>
        {formattedValue !== undefined && (
          <span
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-progress-value" },
              slotProps: slotProps?.value,
            })}
          >
            {formattedValue}
          </span>
        )}
      </div>
    );
  }),
);
