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
import type { HeatmapProps } from "./heatmap.types.js";

/**
 * Renders a labeled heatmap with an internally scrolling table viewport.
 *
 * @public
 */
export const Heatmap = forwardRef<HTMLDivElement, HeatmapProps>(function Heatmap(
  {
    rowLabels,
    columnLabels,
    levels,
    tone,
    density = "default",
    className,
    onPointerEnter,
    onPointerLeave,
    "aria-label": ariaLabel,
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
  if (levels.length !== rowLabels.length) {
    throw new TypeError("Heatmap levels must contain one row for every row label");
  }
  if (levels.some((row) => row.length !== columnLabels.length)) {
    throw new TypeError("Heatmap rows must contain one level for every column label");
  }
  if (
    levels.some((row) => row.some((level) => !Number.isInteger(level) || level < 0 || level > 5))
  ) {
    throw new TypeError("Heatmap levels must be integers from zero through five");
  }

  return (
    <div
      {...props}
      ref={ref}
      data-tone={tone}
      data-state={rowLabels.length === 0 || columnLabels.length === 0 ? "empty" : "ready"}
      data-motion-state={motionState}
      className={classNames(
        "miaixz-heatmap",
        `miaixz-heatmap-${density}`,
        `miaixz-heatmap-tone-${tone}`,
        className,
      )}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      <div className="miaixz-heatmap-viewport" role="region" aria-label={ariaLabel} tabIndex={0}>
        <table className="miaixz-heatmap-table">
          <thead>
            <tr>
              <th className="miaixz-heatmap-corner" aria-hidden="true" />
              {columnLabels.map((label, index) => (
                <th key={`${label}-${index}`} className="miaixz-heatmap-column-label" scope="col">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowLabels.map((rowLabel, rowIndex) => (
              <tr key={`${rowLabel}-${rowIndex}`}>
                <th className="miaixz-heatmap-row-label" scope="row">
                  {rowLabel}
                </th>
                {levels[rowIndex]?.map((level, columnIndex) => (
                  <td
                    key={`${columnLabels[columnIndex] ?? "column"}-${columnIndex}`}
                    className="miaixz-heatmap-cell"
                    data-level={level}
                    aria-label={`${rowLabel}, ${columnLabels[columnIndex]}: ${level}`}
                  >
                    {level}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});
