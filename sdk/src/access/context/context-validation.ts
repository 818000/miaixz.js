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
 * Validates, normalizes, merges, and compares runtime-context values.
 */

import { MiaixzSdkError } from "../../errors/errors.js";
import { isRecord } from "../../shared/object.js";
import type { MiaixzRuntimeContext } from "./context.types.js";

/**
 * Defines the current persisted runtime-context schema version.
 */
export const CONTEXT_SCHEMA_VERSION = 1;

/**
 * Determines whether a value is a valid runtime context.
 *
 * @param value - Value to inspect.
 * @returns Whether `value` is a valid string-valued runtime context.
 * @public
 */
export function isMiaixzRuntimeContext(value: unknown): value is MiaixzRuntimeContext {
  if (!isRecord(value)) return false;
  return Object.values(value).every((entry) => entry === undefined || typeof entry === "string");
}

/**
 * Validates and canonicalizes a runtime context by removing undefined fields.
 *
 * @param value - Runtime value to validate and normalize.
 * @returns A canonical runtime context containing only defined string values.
 * @throws MiaixzSdkError When the value is not a valid runtime context.
 */
export function normalizeContext(value: unknown): MiaixzRuntimeContext {
  if (!isMiaixzRuntimeContext(value)) {
    throw new MiaixzSdkError({ code: "CONTEXT_INVALID" });
  }
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, string] => entry[1] !== undefined),
  ) as MiaixzRuntimeContext;
}

/**
 * Applies explicit context fields over persisted state, treating undefined as deletion.
 *
 * @param persisted - Canonical persisted context state.
 * @param initial - Valid explicit context fields supplied by the host.
 * @returns Canonical merged context state.
 */
export function mergeContext(
  persisted: Readonly<MiaixzRuntimeContext>,
  initial: Readonly<MiaixzRuntimeContext>,
): MiaixzRuntimeContext {
  const merged: Record<string, string | undefined> = { ...persisted };
  for (const [key, value] of Object.entries(initial)) {
    if (value === undefined) delete merged[key];
    else merged[key] = value;
  }
  return normalizeContext(merged);
}

/**
 * Compares string-valued context records to suppress duplicate event delivery.
 *
 * @param first - First context to compare.
 * @param second - Second context to compare.
 * @returns Whether both contexts contain equivalent values.
 */
export function areContextsEqual(
  first: Readonly<MiaixzRuntimeContext>,
  second: Readonly<MiaixzRuntimeContext>,
): boolean {
  const keys = new Set([...Object.keys(first), ...Object.keys(second)]);
  return [...keys].every(
    (key) => first[key as keyof MiaixzRuntimeContext] === second[key as keyof MiaixzRuntimeContext],
  );
}
