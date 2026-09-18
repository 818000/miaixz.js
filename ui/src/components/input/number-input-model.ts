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

/**
 * Raw text states that are valid while a number is being edited.
 */
export const numberInputIntermediateValues = new Set(["", "-", ".", "-."]);

/**
 * Validates the public numeric contract.
 *
 * @param min - Optional inclusive minimum.
 * @param max - Optional inclusive maximum.
 * @param step - Positive step size.
 * @param precision - Supported decimal precision.
 */
export function validateNumberInputOptions(
  min: number | undefined,
  max: number | undefined,
  step: number,
  precision: number,
): void {
  if (!Number.isFinite(step) || step <= 0) {
    throw new MiaixzUiError({ code: "UI_NUMBER_INPUT_STEP_INVALID" });
  }
  if (!Number.isInteger(precision) || precision < 0 || precision > 12) {
    throw new MiaixzUiError({ code: "UI_NUMBER_INPUT_PRECISION_INVALID" });
  }
  if (
    (min !== undefined && !Number.isFinite(min)) ||
    (max !== undefined && !Number.isFinite(max)) ||
    (min !== undefined && max !== undefined && min > max)
  ) {
    throw new MiaixzUiError({ code: "UI_NUMBER_INPUT_RANGE_INVALID" });
  }
}

/**
 * Parses one editable raw value without coercing incomplete text.
 *
 * @param rawValue - Current text input.
 * @returns A number, null for empty, or undefined for incomplete text.
 */
export function parseNumberInput(rawValue: string): number | null | undefined {
  if (rawValue === "") return null;
  if (numberInputIntermediateValues.has(rawValue)) return undefined;
  if (!/^-?(?:\d+(?:\.\d*)?|\.\d+)$/.test(rawValue)) return undefined;
  const value = Number(rawValue);
  return Number.isFinite(value) ? value : undefined;
}

/**
 * Rounds a number without exposing binary floating point artifacts.
 *
 * @param value - Number to round.
 * @param precision - Decimal precision.
 * @returns Rounded number.
 */
export function roundNumberInput(value: number, precision: number): number {
  const factor = 10 ** precision;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/**
 * Constrains a number to optional inclusive bounds.
 *
 * @param value - Number to constrain.
 * @param min - Optional inclusive minimum.
 * @param max - Optional inclusive maximum.
 * @returns Constrained number.
 */
export function clampNumberInput(
  value: number,
  min: number | undefined,
  max: number | undefined,
): number {
  return Math.min(
    max ?? Number.POSITIVE_INFINITY,
    Math.max(min ?? Number.NEGATIVE_INFINITY, value),
  );
}

/**
 * Applies a signed count of steps and clamps the result.
 *
 * @param value - Current nullable value.
 * @param delta - Signed number of steps.
 * @param step - Step size.
 * @param precision - Decimal precision.
 * @param min - Optional inclusive minimum.
 * @param max - Optional inclusive maximum.
 * @returns The next constrained value.
 */
export function stepNumberInput(
  value: number | null,
  delta: number,
  step: number,
  precision: number,
  min: number | undefined,
  max: number | undefined,
): number {
  const origin = value ?? (delta > 0 ? (min ?? 0) : (max ?? 0));
  return clampNumberInput(roundNumberInput(origin + delta * step, precision), min, max);
}

/**
 * Formats a nullable value for the text input.
 *
 * @param value - Nullable numeric value.
 * @param precision - Decimal precision.
 * @returns Editable text.
 */
export function formatNumberInput(value: number | null, precision: number): string {
  if (value === null) return "";
  return String(roundNumberInput(value, precision));
}
