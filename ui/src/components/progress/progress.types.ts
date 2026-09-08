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
 * Defines properties owned by the Miaixz Progress contract.
 *
 * @public
 */
export interface MiaixzProgressOwnProps {
  /**
   * Selects the default or thin track geometry.
   *
   * @defaultValue `"default"`
   */
  readonly size?: "default" | "thin";
  /**
   * Supplies the current value, or leaves progress indeterminate when omitted.
   */
  readonly value?: number;

  /**
   * Supplies the finite positive maximum value.
   *
   * @defaultValue `100`
   */
  readonly max?: number;

  /**
   * Supplies the required localized accessible progress label.
   */
  readonly label: string;

  /**
   * Displays the rounded percentage for determinate progress.
   *
   * @defaultValue `false`
   */
  readonly showValue?: boolean;

  /**
   * Selects a theme-resolved semantic or categorical visual tone.
   *
   * @defaultValue `"brand"`
   */
  readonly tone?: MiaixzVisualTone;
}

/**
 * Configures determinate or indeterminate progress feedback.
 *
 * @public
 */
export interface ProgressProps
  extends
    Omit<HTMLAttributes<HTMLDivElement>, keyof MiaixzProgressOwnProps | "color">,
    MiaixzProgressOwnProps {}
