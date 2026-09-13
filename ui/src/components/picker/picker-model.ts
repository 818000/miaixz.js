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

import { MiaixzUiError } from "../../errors/ui-error.js";
import { validateMiaixzOptions } from "../combobox/combobox-controller.js";
import type { MiaixzOption } from "../combobox/combobox.types.js";

/**
 * Validates selected values and their optional maximum.
 *
 * @param value - Current selection.
 * @param selectionLimit - Optional maximum selection count.
 */
export function validatePickerValue<Value extends string>(
  value: readonly MiaixzOption<Value>[],
  selectionLimit: number | undefined,
): void {
  validateMiaixzOptions(value, false);
  if (selectionLimit !== undefined && value.length > selectionLimit) {
    throw new MiaixzUiError({ code: "UI_CONTROLLED_VALUE_INVALID" });
  }
}

/**
 * Shared immutable empty Picker value.
 */
export const emptyPickerValue: readonly never[] = Object.freeze([]);
