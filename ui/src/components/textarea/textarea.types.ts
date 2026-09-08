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

import type { TextareaHTMLAttributes } from "react";

import type { MiaixzFormPreviewProps } from "../shared.types.js";

/**
 * Defines the supported multiline control sizes.
 *
 * @public
 */
export type TextareaSize = "small" | "medium" | "large";

/**
 * Defines the browser resize directions enabled for a textarea.
 *
 * @public
 */
export type TextareaResize = "none" | "vertical" | "horizontal" | "both";

/**
 * Configures a multiline native text control.
 *
 * @public
 */
export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement>, MiaixzFormPreviewProps {
  /**
   * Selects the control size.
   *
   * @defaultValue `"medium"`
   */
  size?: TextareaSize;
  /**
   * Applies the invalid state independently of `aria-invalid`.
   *
   * @defaultValue `false`
   */
  invalid?: boolean;
  /**
   * Selects the browser resize directions.
   *
   * @defaultValue `"vertical"`
   */
  resize?: TextareaResize;
}
