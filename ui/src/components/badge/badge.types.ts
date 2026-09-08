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
 * Defines the semantic color treatment of a badge.
 *
 * @public
 */
export type BadgeTone = "neutral" | "brand" | "success" | "warning" | "danger" | "info";

/**
 * Configures a compact semantic badge.
 *
 * @public
 */
export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /**
   * Selects the semantic color treatment.
   *
   * @defaultValue `"neutral"`
   */
  tone?: BadgeTone;
  /**
   * Uses an outlined rather than filled presentation.
   *
   * @defaultValue `false`
   */
  outline?: boolean;
  /**
   * Displays a leading status dot.
   *
   * @defaultValue `false`
   */
  dot?: boolean;
  /**
   * Displays optional leading icon content.
   */
  icon?: ReactNode;
}
