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

import type { SVGAttributes } from "react";

import type { MiaixzVisualTone } from "../shared.types.js";

/**
 * Configures a compact, theme-aware line visualization.
 *
 * @public
 */
export interface SparklineProps extends Omit<
  SVGAttributes<SVGSVGElement>,
  "children" | "color" | "values"
> {
  /**
   * Selects the standard chart or the compact metric-card geometry.
   *
   * @defaultValue `"default"`
   */
  readonly variant?: "default" | "metric" | "trend";
  /**
   * Supplies ordered numeric samples. Non-finite samples produce visible gaps.
   */
  readonly values: readonly number[];
  /**
   * Selects a theme-resolved semantic or categorical visual tone.
   *
   * @defaultValue `"brand"`
   */
  readonly tone?: MiaixzVisualTone;
  /**
   * Supplies the required accessible visualization name.
   */
  readonly "aria-label": string;
}
