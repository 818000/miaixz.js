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

import type { SelectHTMLAttributes } from "react";

import type { MiaixzFormPreviewProps } from "../shared.types.js";

/**
 * Defines the supported Miaixz select sizes.
 *
 * @public
 */
export type SelectSize = "small" | "medium" | "large";

/**
 * Configures a form-compatible Miaixz select control.
 *
 * Native option children and change-event behavior are retained while the
 * visible trigger and option surface use the shared Miaixz interaction system.
 *
 * @public
 */
export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size">, MiaixzFormPreviewProps {
  /**
   * Selects the control size.
   *
   * @defaultValue `"medium"`
   */
  size?: SelectSize;
  /**
   * Applies the invalid state independently of `aria-invalid`.
   *
   * @defaultValue `false`
   */
  invalid?: boolean;
  /**
   * Prevents selection changes while keeping the trigger discoverable and focusable.
   *
   * @defaultValue `false`
   */
  readOnly?: boolean;
  /**
   * Selects fill-width or compact toolbar geometry.
   */
  widthPreset?: "fill" | "compact";
}
