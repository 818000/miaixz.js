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
 * Defines the supported skeleton placeholder shapes.
 *
 * @public
 */
export type SkeletonVariant = "text" | "heading" | "avatar" | "button" | "row" | "custom";

/**
 * Configures a non-interactive loading placeholder.
 *
 * @public
 */
export interface SkeletonProps extends HTMLAttributes<HTMLSpanElement> {
  /**
   * Selects the semantic placeholder shape.
   *
   * @defaultValue `"text"`
   */
  variant?: SkeletonVariant;
  /**
   * Overrides the placeholder width.
   */
  width?: number | string;
  /**
   * Overrides the placeholder height.
   */
  height?: number | string;
}
