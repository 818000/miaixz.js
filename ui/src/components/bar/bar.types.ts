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

/**
 * Defines properties owned by the Miaixz loading bar contract. @public
 */
export interface MiaixzBarOwnProps {
  /**
   * Controls whether the bar is visible.
   */
  readonly active: boolean;
  /**
   * Plays the completion transition before hiding.
   */
  readonly complete?: boolean;
  /**
   * Uses the continuous indeterminate animation.
   */
  readonly indeterminate?: boolean;
  /**
   * Sets determinate completion from zero to one.
   */
  readonly progress?: number;
}

/**
 * Configures fixed page and navigation loading progress. @public
 */
export interface BarProps
  extends Omit<HTMLAttributes<HTMLDivElement>, keyof MiaixzBarOwnProps>, MiaixzBarOwnProps {}
