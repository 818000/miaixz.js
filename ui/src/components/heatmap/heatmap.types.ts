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

import type { HTMLAttributes } from "react";

import type { MiaixzVisualTone } from "../shared.types.js";

/**
 * Defines the fixed activity levels supported by Heatmap.
 *
 * @public
 */
export type HeatmapLevel = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * Configures a legend that shares the Heatmap activity scale.
 * @public
 */
export interface HeatmapLegendProps extends Omit<
  HTMLAttributes<HTMLSpanElement>,
  "children" | "color"
> {
  /**
   * Uses the same semantic data tone as the accompanying Heatmap.
   */
  readonly tone: MiaixzVisualTone;
  /**
   * Supplies the localized low-activity endpoint.
   */
  readonly lowLabel: string;
  /**
   * Supplies the localized high-activity endpoint.
   */
  readonly highLabel: string;
}

/**
 * Configures an accessible labeled heatmap.
 *
 * @public
 */
export interface HeatmapProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "color"> {
  /**
   * Selects the default or dense dashboard geometry.
   */
  readonly density?: "default" | "compact";
  /**
   * Supplies one visible label for every data row.
   */
  readonly rowLabels: readonly string[];
  /**
   * Supplies one visible label for every data column.
   */
  readonly columnLabels: readonly string[];
  /**
   * Supplies a rectangular matrix of fixed zero-to-five activity levels.
   */
  readonly levels: readonly (readonly HeatmapLevel[])[];
  /**
   * Selects the theme-resolved visual tone mixed at each activity level.
   */
  readonly tone: MiaixzVisualTone;
  /**
   * Supplies the required accessible heatmap name.
   */
  readonly "aria-label": string;
}
