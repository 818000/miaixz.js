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

import type { InputHTMLAttributes, ReactNode } from "react";

import type { MiaixzFormPreviewProps } from "../shared.types.js";

/**
 * Configures an accessible native boolean switch.
 *
 * @public
 */
export interface SwitchProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "type">, MiaixzFormPreviewProps {
  /**
   * Selects the regular control or a compact track without changing checkbox semantics.
   *
   * @defaultValue `"default"`
   */
  variant?: "default" | "compact";
  /**
   * Displays the primary switch label.
   */
  label?: ReactNode;
  /**
   * Displays supporting descriptive content.
   */
  description?: ReactNode;
  /**
   * Applies the invalid state independently of `aria-invalid`.
   *
   * @defaultValue `false`
   */
  invalid?: boolean;
}
