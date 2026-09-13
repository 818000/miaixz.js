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

/* eslint-disable jsdoc/require-jsdoc -- Public HeatmapLegend contract lives in its type module.
 */
import { useMiaixzLocale } from "../../i18n/i18n.js";
import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import type { HeatmapLegendProps } from "./heatmap.types.js";
import { withMiaixzThemeComponent } from "../../theme/themed-component.js";

function HeatmapLegend({ tone, levelLabels, slotProps, ...props }: HeatmapLegendProps) {
  const { t } = useMiaixzLocale();
  const ownerState = { tone };
  const description = t("ui.heatmap.legendDescription", {
    level0: levelLabels[0],
    level1: levelLabels[1],
    level2: levelLabels[2],
    level3: levelLabels[3],
    level4: levelLabels[4],
    level5: levelLabels[5],
  });
  return (
    <span
      {...mergeMiaixzSlotProps({
        ownerState,
        defaultProps: { className: "miaixz-heatmap-legend" },
        componentProps: props,
        slotProps: slotProps?.root,
        internalProps: { "data-tone": tone },
      })}
    >
      <span
        {...mergeMiaixzSlotProps({
          ownerState,
          defaultProps: { className: "miaixz-heatmap-legend-low" },
          slotProps: slotProps?.lowLabel,
        })}
      >
        {levelLabels[0]}
      </span>
      <span
        {...mergeMiaixzSlotProps({
          ownerState,
          defaultProps: { className: "miaixz-heatmap-legend-scale" },
          slotProps: slotProps?.scale,
          internalProps: { "aria-hidden": true },
          ownedProps: ["aria-hidden"],
        })}
      >
        {levelLabels.map((_, level) => (
          <i
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-heatmap-legend-cell" },
              slotProps: slotProps?.swatch,
              internalProps: { "data-level": level },
            })}
            key={level}
          />
        ))}
      </span>
      <span
        {...mergeMiaixzSlotProps({
          ownerState,
          defaultProps: { className: "miaixz-heatmap-legend-high" },
          slotProps: slotProps?.highLabel,
        })}
      >
        {levelLabels[5]}
      </span>
      <ol
        {...mergeMiaixzSlotProps({
          ownerState,
          defaultProps: { className: "miaixz-hidden miaixz-heatmap-legend-description" },
          slotProps: slotProps?.description,
          internalProps: { "aria-label": description },
          ownedProps: ["aria-label"],
        })}
      >
        {levelLabels.map((label, level) => (
          <li key={level}>
            {level}: {label}
          </li>
        ))}
      </ol>
    </span>
  );
}

const ThemedHeatmapLegend = withMiaixzThemeComponent("HeatmapLegend", HeatmapLegend);
export { ThemedHeatmapLegend as HeatmapLegend };
