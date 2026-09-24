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
 * Converts runtime-context fields to canonical Miaixz request headers.
 */

import { miaixzHeaders } from "../../fabric/api/constants.js";
import type { MiaixzRuntimeContext } from "./context.types.js";

/**
 * Maps runtime-context fields to their canonical HTTP headers.
 */
const CONTEXT_HEADER_MAP: readonly [keyof MiaixzRuntimeContext, string][] = [
  ["userId", miaixzHeaders.userId],
  ["tenantId", miaixzHeaders.tenantId],
  ["organizationId", miaixzHeaders.organizationId],
  ["departmentId", miaixzHeaders.departmentId],
  ["spaceId", miaixzHeaders.spaceId],
  ["locale", miaixzHeaders.locale],
  ["timezone", miaixzHeaders.timezone],
  ["traceId", miaixzHeaders.traceId],
];

/**
 * Converts tenant, organization, space, locale, and trace context into request headers.
 *
 * @param context - Runtime context to convert.
 * @returns Headers containing all defined runtime-context values.
 * @public
 */
export function miaixzContextToHeaders(context: Readonly<MiaixzRuntimeContext>): Headers {
  const headers = new Headers();
  for (const [key, header] of CONTEXT_HEADER_MAP) {
    const value = context[key];
    if (value) headers.set(header, value);
  }
  return headers;
}
