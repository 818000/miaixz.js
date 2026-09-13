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

import type { ComponentPropsWithoutRef } from "react";

import type { MiaixzIconName } from "../../icons/icon-names.js";

/**
 * Defines semantic icon sizes managed by the design system.
 *
 * @public
 */
export type IconSize = "indicator" | "inline" | "control" | "navigation" | "feature" | "display";

/**
 * Defines the supported semantic icon stroke weights.
 *
 * @public
 */
export type IconStroke = "regular" | "strong";

/**
 * Configures an icon selected from the Miaixz icon catalog.
 *
 * The public contract is provider-neutral so business code remains unchanged if the underlying
 * icon library is replaced.
 *
 * @public
 */
export interface IconProps extends Omit<
  ComponentPropsWithoutRef<"svg">,
  "children" | "name" | "size" | "stroke"
> {
  /**
   * Selects an icon from the complete Miaixz icon catalog.
   */
  readonly name: MiaixzIconName;
  /**
   * Selects a semantic size or supplies a native SVG size.
   *
   * @defaultValue `"inline"`
   */
  readonly size?: IconSize | number | string;
  /**
   * Selects the semantic stroke weight.
   *
   * @defaultValue `"regular"`
   */
  readonly stroke?: IconStroke;
  /**
   * Provides an accessible name for a meaningful icon.
   */
  readonly label?: string;
}
