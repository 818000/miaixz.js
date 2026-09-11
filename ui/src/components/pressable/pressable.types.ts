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

import type { ButtonHTMLAttributes } from "react";

/**
 * Configures a semantic button with only shared interaction behavior.
 *
 * Use this for custom list rows, navigation labels and other composite
 * surfaces whose visual layout belongs to the consuming product.
 *
 * @public
 */
export interface PressableProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Selects a reusable selection or composite interaction surface.
   */
  variant?: "default" | "row" | "pill" | "card";
  /**
   * Selects a shared row density.
   */
  density?: "compact" | "standard" | "comfortable";
  /**
   * Selects a row separator without business-owned control CSS.
   */
  separator?: "solid" | "dashed" | "none";
}
