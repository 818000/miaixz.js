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

import { classNames } from "../../shared/class-names.js";
import type { HeatmapLegendProps } from "./heatmap.types.js";

/**
 * Displays the same five activity colors as Heatmap without exposing color recipes.
 * @param props - Semantic tone, endpoint labels and standard span attributes.
 * @returns A noninteractive activity legend.
 * @public
 */
export function HeatmapLegend(props: HeatmapLegendProps) {
  const { tone, lowLabel, highLabel, className, ...attributes } = props;
  return (
    <span
      {...attributes}
      className={classNames("miaixz-heatmap-legend", `miaixz-heatmap-tone-${tone}`, className)}
    >
      {lowLabel}
      {[1, 2, 3, 4, 5].map((level) => (
        <i
          key={level}
          className="miaixz-heatmap-legend-cell"
          aria-hidden="true"
          data-level={level}
        />
      ))}
      {highLabel}
    </span>
  );
}
