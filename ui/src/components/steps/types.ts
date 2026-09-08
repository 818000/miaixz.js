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

/**
 * One workflow step whose state remains owned by the consumer. @public
 */
export interface StepsItem {
  /**
   * Supplies an optional stable identity for rendering and selection.
   */
  readonly id?: string | number;
  /**
   * Supplies the required visible step label.
   */
  readonly label: ReactNode;
  /**
   * Supplies optional supporting text.
   */
  readonly description?: ReactNode;
  /**
   * Replaces the default one-based numeric marker.
   */
  readonly marker?: ReactNode;
  /**
   * Selects the consumer-owned semantic workflow state.
   *
   * @defaultValue `"pending"`
   */
  readonly status?: "pending" | "current" | "complete" | "error" | "disabled";
}

/**
 * A labeled workflow; business logic supplies the state. @public
 */
export interface StepsProps extends HTMLAttributes<HTMLOListElement> {
  /**
   * Selects a connected strip or individually framed stages.
   *
   * @defaultValue `"default"`
   */
  readonly variant?: "default" | "cards";
  /**
   * Supplies the required accessible workflow name.
   */
  readonly label: string;
  /**
   * Supplies ordered workflow steps.
   */
  readonly items: readonly StepsItem[];
  /**
   * Enables native-button selection when supplied. Omit it for a display-only workflow.
   */
  readonly onStepChange?: (item: StepsItem, index: number) => void;
}
