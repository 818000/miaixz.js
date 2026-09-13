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

import { useCallback, useEffect, useRef, useState } from "react";

import { MiaixzUiError, reportMiaixzUiWarning } from "../errors/ui-error.js";

/**
 * Configures the sole controlled and uncontrolled value state machine.
 */
export interface MiaixzControlledOptions<Value> {
  /**
   * Overrides value-based mode detection when undefined is a valid controlled value.
   */
  readonly controlled?: boolean;

  /**
   * Supplies the controlled value; undefined selects uncontrolled mode.
   */
  readonly value: Value | undefined;

  /**
   * Supplies the initial value used only in uncontrolled mode.
   */
  readonly defaultValue: Value;

  /**
   * Reports whether the caller explicitly supplied a default together with a controlled value.
   */
  readonly hasDefaultValue?: boolean;

  /**
   * Receives requested value changes.
   */
  readonly onValueChange?: (value: Value) => void;

  /**
   * Allows an intentionally read-only controlled value without a change callback.
   */
  readonly readOnly?: boolean;
}

/**
 * Describes the current value and the sole change request function.
 */
export interface MiaixzControlledResult<Value> {
  /**
   * Contains the current controlled or uncontrolled value.
   */
  readonly value: Value;

  /**
   * Reports whether the value is controlled by the caller.
   */
  readonly controlled: boolean;

  /**
   * Reports whether user-driven changes must be disabled.
   */
  readonly readOnly: boolean;

  /**
   * Requests one value change through the active state mode.
   */
  readonly setValue: (value: Value) => void;

  /**
   * Restores uncontrolled state without notifying the public change callback.
   */
  readonly resetValue: (value: Value) => void;
}

/**
 * Owns every controlled and uncontrolled component value transition.
 *
 * @typeParam Value - State value type.
 * @param options - Controlled value, default, callback, and read-only contract.
 * @returns Current value and its sole transition function.
 * @internal
 */
export function useControlled<Value>(
  options: MiaixzControlledOptions<Value>,
): MiaixzControlledResult<Value> {
  const controlled = options.controlled ?? options.value !== undefined;
  if (
    controlled &&
    (options.hasDefaultValue === true ||
      (options.onValueChange === undefined && options.readOnly !== true))
  ) {
    throw new MiaixzUiError({
      code: "UI_CONTROLLED_VALUE_INVALID",
    });
  }
  const [initialControlled] = useState(controlled);
  const warnedRef = useRef(false);
  useEffect(() => {
    if (warnedRef.current || initialControlled === controlled) return;
    warnedRef.current = true;
    reportMiaixzUiWarning("UI_CONTROLLED_MODE_CHANGED");
  }, [controlled, initialControlled]);

  const [uncontrolledValue, setUncontrolledValue] = useState(options.defaultValue);
  const currentValue = controlled ? options.value : uncontrolledValue;
  const { onValueChange } = options;
  const setValue = useCallback(
    (nextValue: Value) => {
      if (!controlled) setUncontrolledValue(nextValue);
      onValueChange?.(nextValue);
    },
    [controlled, onValueChange],
  );
  const resetValue = useCallback(
    (nextValue: Value) => {
      if (!controlled) setUncontrolledValue(nextValue);
    },
    [controlled],
  );
  return {
    value: currentValue as Value,
    controlled,
    readOnly: controlled && options.onValueChange === undefined,
    setValue,
    resetValue,
  };
}
