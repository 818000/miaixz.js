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

/**
 * Provides bounded JSON field normalization for untrusted structured data.
 */

/**
 * Narrows an unknown JSON value to a finite number.
 *
 * @param value - Unknown JSON value being normalized.
 * @param fallback - Number returned when the value is not finite.
 * @returns Finite numeric value or the supplied fallback.
 */
export function numberField(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/**
 * Narrows an unknown JSON value to a non-empty string.
 *
 * @param value - Unknown JSON value being normalized.
 * @returns Non-empty string, or undefined for other values.
 */
export function stringField(value: unknown): string | undefined {
  return typeof value === "string" && value !== "" ? value : undefined;
}

/**
 * Narrows an unknown JSON value to a non-array object record.
 *
 * @param value - Unknown JSON value being normalized.
 * @returns Read-only object record, or undefined for other values.
 */
export function objectField(value: unknown): Readonly<Record<string, unknown>> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Readonly<Record<string, unknown>>)
    : undefined;
}

/**
 * Normalizes an unknown JSON value to a read-only array.
 *
 * @param value - Unknown JSON value being normalized.
 * @returns Original array or an empty fallback array.
 */
export function arrayField(value: unknown): readonly unknown[] {
  return Array.isArray(value) ? value : [];
}
