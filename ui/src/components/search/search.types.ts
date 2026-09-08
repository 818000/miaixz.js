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

import type { ChangeEventHandler, ReactNode } from "react";

import type { InputProps } from "../input/index.js";

/**
 * Configures a controlled or uncontrolled localized search field.
 *
 * @public
 */
export interface SearchProps extends Omit<
  InputProps,
  "type" | "startAdornment" | "endAdornment" | "value" | "defaultValue" | "onChange"
> {
  /**
   * Selects the standard field or header-only presentation.
   *
   * @defaultValue `"default"`
   */
  variant?: "default" | "header";
  /**
   * Selects fill-width or fixed directory-toolbar geometry.
   */
  width?: "fill" | "medium";
  /**
   * Displays a keyboard shortcut after the editable input area.
   */
  shortcut?: ReactNode;
  /**
   * Controls the current search value.
   */
  value?: string;
  /**
   * Sets the initial uncontrolled search value.
   *
   * @defaultValue An empty string.
   */
  defaultValue?: string;
  /**
   * Receives native input change events.
   */
  onChange?: ChangeEventHandler<HTMLInputElement>;
  /**
   * Receives the normalized current search value.
   */
  onValueChange?: (value: string) => void;
  /**
   * Displays a clear action while the field contains text.
   *
   * @defaultValue `true`
   */
  clearable?: boolean;
  /**
   * Overrides the localized clear-action label.
   */
  clearLabel?: string;
}
