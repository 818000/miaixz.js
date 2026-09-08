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

import type { ComboboxProps } from "../combobox/index.js";

/**
 * Defines Miaixz-owned Picker properties before native div attributes are merged.
 *
 * @typeParam Value - Stable string value type selected by the control.
 * @public
 */
export interface MiaixzPickerOwnProps<Value extends string = string> extends Omit<
  ComboboxProps<Value>,
  "value" | "defaultValue" | "onValueChange"
> {
  /**
   * Controls the ordered selected-value collection.
   */
  value?: readonly Value[];

  /**
   * Sets the initial uncontrolled selected-value collection.
   */
  defaultValue?: readonly Value[];

  /**
   * Receives requested selected-value changes.
   */
  onValueChange?: (value: readonly Value[]) => void;

  /**
   * Limits the number of simultaneously selected values.
   */
  selectionLimit?: number;
}

/**
 * Configures a searchable multiple-value WAI-ARIA combobox.
 *
 * @typeParam Value - Stable string value type selected by the control.
 * @public
 */
export interface PickerProps<Value extends string = string>
  extends
    Omit<HTMLAttributes<HTMLDivElement>, keyof MiaixzPickerOwnProps<Value>>,
    MiaixzPickerOwnProps<Value> {}
