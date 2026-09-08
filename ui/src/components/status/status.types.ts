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

import type { HTMLAttributes, ReactNode } from "react";

import type { MiaixzFeedbackTone } from "../shared.types.js";

/**
 * Defines properties owned by the Miaixz Status contract.
 *
 * @public
 */
export interface MiaixzStatusOwnProps {
  /**
   * Selects the semantic text and marker size.
   *
   * @defaultValue `"medium"`
   */
  readonly size?: "small" | "medium";
  /**
   * Selects a reusable status composition without changing its semantic tone.
   *
   * @defaultValue `"default"`
   */
  readonly variant?: "default" | "badge" | "compact" | "metric" | "split" | "tag" | "inline";
  /**
   * Selects the required semantic status tone, including the product brand status.
   */
  readonly tone: MiaixzFeedbackTone | "brand";

  /**
   * Supplies the required visible status label. The label remains present for every variant.
   */
  readonly label: ReactNode;
}

/**
 * Configures a status marker that never relies on color alone.
 *
 * @public
 */
export interface StatusProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, keyof MiaixzStatusOwnProps>, MiaixzStatusOwnProps {}
