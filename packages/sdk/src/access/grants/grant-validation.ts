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
 * Validates grant snapshots and matches wildcard permission grants.
 */

import { isRecord } from "../../shared/object.js";
import type { MiaixzGrantSnapshot, MiaixzPermissionCode } from "./grant.types.js";

/**
 * Checks that a value is an array of non-empty permission or role strings.
 *
 * @param value - Value to inspect.
 * @returns Whether the value is an array of non-empty strings.
 */
function isNonEmptyStringList(value: unknown): value is readonly string[] {
  return (
    Array.isArray(value) &&
    value.every((entry) => typeof entry === "string" && entry.trim().length > 0)
  );
}

/**
 * Determines whether a value is a usable grant snapshot.
 *
 * @param value - Value to inspect.
 * @returns Whether `value` is a complete, usable grant snapshot.
 * @public
 */
export function isMiaixzGrantSnapshot(value: unknown): value is MiaixzGrantSnapshot {
  if (!isRecord(value) || !isNonEmptyStringList(value.allowed)) return false;
  if (value.denied !== undefined && !isNonEmptyStringList(value.denied)) return false;
  if (value.roles !== undefined && !isNonEmptyStringList(value.roles)) return false;
  return true;
}

/**
 * Matches exact, global, and namespace wildcard permission grants.
 *
 * @param grant - Granted permission or wildcard pattern.
 * @param permission - Permission required by the operation.
 * @returns Whether the grant satisfies the required permission.
 */
export function matchesGrant(
  grant: MiaixzPermissionCode,
  permission: MiaixzPermissionCode,
): boolean {
  if (grant === "*" || grant === permission) return true;
  if (!grant.endsWith(":*")) return false;
  const namespace = grant.slice(0, -1);
  return permission.startsWith(namespace);
}
