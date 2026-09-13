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

import type { RefObject } from "react";

import { useControlValueState } from "./use-control-value-state.js";

/**
 * Configures the shared native checkbox-like visual state.
 */
export interface MiaixzChoiceControlStateOptions {
  /**
   * References the checkbox or radio input that owns uncontrolled state.
   */
  readonly inputRef: RefObject<HTMLInputElement | null>;
  /**
   * Supplies controlled checked state.
   */
  readonly checked: boolean | undefined;
  /**
   * Supplies initial unchecked or checked state.
   */
  readonly defaultChecked: boolean;
}

/**
 * Mirrors checked state from the actual native input and form reset lifecycle.
 *
 * @param options - Native input and checked-state inputs.
 * @returns Current checked value and its event synchronization callback.
 * @internal
 */
export function useChoiceControlState(options: MiaixzChoiceControlStateOptions) {
  return useControlValueState({
    controlRef: options.inputRef,
    value: options.checked,
    defaultValue: options.defaultChecked,
    read: (control) => control.checked,
  });
}
