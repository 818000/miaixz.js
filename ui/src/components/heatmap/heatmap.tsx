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

/* eslint-disable jsdoc/require-jsdoc -- Public Heatmap contract lives in its type module.
 */
import { forwardRef, useId } from "react";

import { MiaixzUiError } from "../../errors/ui-error.js";
import { useMiaixzLocale } from "../../i18n/i18n.js";
import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import { useOverflowFocus } from "../scroll/use-overflow-focus.js";
import { HeatmapLegend } from "./heatmap-legend.js";
import type { HeatmapCellContext, HeatmapOwnerState, HeatmapProps } from "./heatmap.types.js";
import { withMiaixzThemeComponent } from "../../theme/themed-component.js";

export const Heatmap = withMiaixzThemeComponent(
  "Heatmap",
  forwardRef<HTMLDivElement, HeatmapProps>(function Heatmap(
    {
      rowLabels,
      columnLabels,
      levels,
      levelLabels,
      tone,
      density = "standard",
      getCellLabel,
      slotProps,
      "aria-label": ariaLabel,
      ...props
    },
    ref,
  ) {
    const { t } = useMiaixzLocale();
    const legendId = useId();
    if (
      levels.length !== rowLabels.length ||
      levels.some((row) => row.length !== columnLabels.length)
    ) {
      throw new MiaixzUiError({
        code: "UI_HEATMAP_DIMENSIONS_INVALID",
      });
    }
    if (
      levels.some((row) => row.some((level) => !Number.isInteger(level) || level < 0 || level > 5))
    ) {
      throw new MiaixzUiError({
        code: "UI_HEATMAP_LEVEL_INVALID",
      });
    }
    const state = rowLabels.length === 0 || columnLabels.length === 0 ? "empty" : "ready";
    const ownerState: HeatmapOwnerState = { density, tone, state };
    const { elementRef: viewportRef, overflowing } = useOverflowFocus(true);
    const formatCell = (context: HeatmapCellContext) =>
      getCellLabel?.(context) ??
      t("ui.heatmap.cellLabel", {
        row: context.rowLabel,
        column: context.columnLabel,
        level: levelLabels[context.level],
      });
    const legendRootSlot =
      typeof slotProps?.legend === "function" ? slotProps.legend(ownerState) : slotProps?.legend;
    return (
      <div
        {...mergeMiaixzSlotProps({
          ownerState,
          defaultProps: { className: "miaixz-heatmap" },
          componentProps: props,
          slotProps: slotProps?.root,
          forwardedRef: ref,
          internalProps: { "data-tone": tone, "data-density": density, "data-state": state },
        })}
      >
        <div
          {...mergeMiaixzSlotProps({
            ownerState,
            defaultProps: { className: "miaixz-heatmap-viewport" },
            slotProps: slotProps?.viewport,
            internalRef: viewportRef,
            internalProps: {
              role: "region",
              "aria-label": ariaLabel,
              "aria-describedby": legendId,
              ...(overflowing ? { tabIndex: 0 } : {}),
            },
            ownedProps: ["role", "aria-label", "aria-describedby", "tabIndex"],
          })}
        >
          <table
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-heatmap-table" },
              slotProps: slotProps?.table,
            })}
          >
            <caption
              {...mergeMiaixzSlotProps({
                ownerState,
                defaultProps: { className: "miaixz-hidden" },
                slotProps: slotProps?.caption,
              })}
            >
              {ariaLabel}
            </caption>
            <thead>
              <tr>
                <th className="miaixz-heatmap-corner" aria-hidden="true" />
                {columnLabels.map((label, index) => (
                  <th
                    {...mergeMiaixzSlotProps({
                      ownerState,
                      defaultProps: { className: "miaixz-heatmap-column-label" },
                      slotProps: slotProps?.columnHeader,
                      internalProps: { scope: "col" },
                      ownedProps: ["scope"],
                    })}
                    key={`${index}-${label}`}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rowLabels.map((rowLabel, rowIndex) => (
                <tr key={`${rowIndex}-${rowLabel}`}>
                  <th
                    {...mergeMiaixzSlotProps({
                      ownerState,
                      defaultProps: { className: "miaixz-heatmap-row-label" },
                      slotProps: slotProps?.rowHeader,
                      internalProps: { scope: "row" },
                      ownedProps: ["scope"],
                    })}
                  >
                    {rowLabel}
                  </th>
                  {levels[rowIndex]!.map((level, columnIndex) => {
                    const cellText = formatCell({
                      rowLabel,
                      columnLabel: columnLabels[columnIndex]!,
                      level,
                      rowIndex,
                      columnIndex,
                    });
                    return (
                      <td
                        {...mergeMiaixzSlotProps({
                          ownerState,
                          defaultProps: { className: "miaixz-heatmap-cell" },
                          slotProps: slotProps?.cell,
                          internalProps: { "data-level": level },
                        })}
                        key={columnIndex}
                      >
                        <span aria-hidden="true">{level}</span>
                        <span
                          {...mergeMiaixzSlotProps({
                            ownerState,
                            defaultProps: { className: "miaixz-hidden miaixz-heatmap-cell-text" },
                            slotProps: slotProps?.cellText,
                          })}
                        >
                          {cellText}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <HeatmapLegend
          id={legendId}
          tone={tone}
          levelLabels={levelLabels}
          {...(legendRootSlot === undefined ? {} : { slotProps: { root: legendRootSlot } })}
        />
      </div>
    );
  }),
);
