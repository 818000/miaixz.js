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
 * One label/value pair.
 *
 * @public
 */
export interface DescriptionsItem {
  /**
   * Supplies an optional stable identity for rendering.
   */
  readonly id?: string | number;
  /**
   * Supplies the term content.
   */
  readonly label: ReactNode;
  /**
   * Supplies the definition content.
   */
  readonly value: ReactNode;
}

/**
 * Semantic facts, supplied as items or native dt/dd row children.
 *
 * @public
 */
export interface DescriptionsProps extends HTMLAttributes<HTMLDListElement> {
  /**
   * Selects the bounded fact-column count.
   *
   * @defaultValue `1`
   */
  readonly columns?: 1 | 2 | 3;
  /**
   * Selects the standard or compact fact spacing.
   *
   * @defaultValue `"default"`
   */
  readonly density?: "default" | "compact";
  /**
   * Selects the value scale in metric compositions.
   *
   * @defaultValue `"default"`
   */
  readonly valueSize?: "default" | "compact";
  /**
   * Selects a reusable label/value composition.
   *
   * @defaultValue `"default"`
   */
  readonly variant?:
    "default" | "stacked" | "key-value" | "binding" | "matrix" | "statistics" | "metrics";
  /**
   * Supplies ordered facts; omit to render native grouped `dt`/`dd` children.
   */
  readonly items?: readonly DescriptionsItem[];
}
