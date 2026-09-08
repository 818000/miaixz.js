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

import type { HTMLAttributes, ReactElement } from "react";

import type { MetricProps } from "../metric/index.js";

/**
 * Configures a framed group of strip metrics.
 *
 * @public
 */
export interface MetricGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /**
   * Selects the default strip or a directly composed metric collection.
   *
   * @defaultValue `"default"`
   */
  variant?: "default" | "tiles" | "stats" | "summary";
  /**
   * Supplies the metrics rendered inside the group.
   */
  readonly children: ReactElement<MetricProps> | readonly ReactElement<MetricProps>[];
  /**
   * Selects the desktop column count. The group responds with four, two, and one
   * columns across the public desktop, compact desktop/tablet, and mobile ranges.
   *
   * @defaultValue `4`
   */
  readonly columns?: 3 | 4 | 5;
  /**
   * Selects the default response, a mobile-only collapse, or a fixed column count.
   *
   * @defaultValue `"default"`
   */
  readonly responsive?: "default" | "mobile" | "none";
  /**
   * Selects forced strip items or preserves supplied Metric variants.
   *
   * @defaultValue `"strip"`
   */
  readonly itemVariant?: "strip" | "preserve";
  /**
   * Selects a filled or transparent group surface.
   */
  readonly surface?: "default" | "transparent";
  /**
   * Selects the standard or dense information-strip geometry.
   */
  readonly density?: "default" | "compact";
  /**
   * Adds token-backed separation after the metric strip.
   */
  readonly spacingAfter?: "none" | "compact";
}
