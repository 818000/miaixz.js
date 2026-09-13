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

import { useCallback, useState, type RefObject } from "react";

import { useFormReset, type MiaixzFormControl } from "./use-form-reset.js";

/**
 * Configures state derived from a native control's actual value.
 */
export interface MiaixzControlValueStateOptions<Control extends MiaixzFormControl, Value> {
  /**
   * References the native control that owns uncontrolled state.
   */
  readonly controlRef: RefObject<Control | null>;

  /**
   * Supplies a derived controlled value; undefined selects native uncontrolled state.
   */
  readonly value: Value | undefined;

  /**
   * Supplies deterministic initial state until the native control mounts.
   */
  readonly defaultValue: Value;

  /**
   * Reads the current derived value from the native control.
   */
  readonly read: (control: Control) => Value;
}

/**
 * Describes derived control state and the event synchronization callback.
 */
export interface MiaixzControlValueStateResult<Value> {
  /**
   * Contains the current controlled or native-derived value.
   */
  readonly value: Value;

  /**
   * Synchronizes uncontrolled state after native input or change events.
   */
  readonly sync: () => void;
}

/**
 * Mirrors only derived visual state while retaining the native control as uncontrolled owner.
 *
 * @typeParam Control - Native form-associated control type.
 * @typeParam Value - Derived visual value type.
 * @param options - Native control, controlled value, initial value, and reader.
 * @returns Derived value and event synchronization callback.
 * @internal
 */
export function useControlValueState<Control extends MiaixzFormControl, Value>(
  options: MiaixzControlValueStateOptions<Control, Value>,
): MiaixzControlValueStateResult<Value> {
  const [uncontrolledValue, setUncontrolledValue] = useState(options.defaultValue);
  const { controlRef, read } = options;
  const sync = useCallback(() => {
    const control = controlRef.current;
    if (control !== null) setUncontrolledValue(read(control));
  }, [controlRef, read]);
  useFormReset(controlRef, sync);
  return { value: options.value === undefined ? uncontrolledValue : options.value, sync };
}
