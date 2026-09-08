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

import type { MiaixzVisualTone } from "../shared.types.js";

/**
 * Defines one labeled donut segment.
 *
 * @public
 */
export interface DonutSegment {
  /**
   * Supplies the segment label.
   */
  readonly label: string;
  /**
   * Supplies the finite non-negative source value.
   */
  readonly value: number;
  /**
   * Selects the segment's theme-resolved visual tone.
   */
  readonly tone: MiaixzVisualTone;
}

/**
 * Configures an accessible normalized donut visualization.
 *
 * @public
 */
export interface DonutProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "color"> {
  /**
   * Selects the semantic visualization diameter.
   *
   * @defaultValue `"large"`
   */
  readonly size?: "small" | "medium" | "large";
  /**
   * Selects a reusable dashboard composition.
   *
   * @defaultValue `"default"`
   */
  readonly variant?: "completion" | "default" | "token" | "distribution";
  /**
   * Selects whether the shared legend is rendered.
   *
   * @defaultValue `"inline"`
   */
  readonly legend?: "hidden" | "inline";
  /**
   * Supplies source segments without requiring pre-normalization.
   */
  readonly segments: readonly DonutSegment[];
  /**
   * Supplies optional content displayed in the ring center.
   */
  readonly center?: ReactNode;
  /**
   * Supplies the required accessible visualization description.
   */
  readonly "aria-label": string;
}
