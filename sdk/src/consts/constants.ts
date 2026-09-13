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
 * Defines canonical HTTP header names used by Miaixz services.
 *
 * @public
 */
export const miaixzHeaders = Object.freeze({
  authorization: "Authorization",
  csrfToken: "X-CSRF-Token",
  requestId: "X-Request-Id",
  traceId: "X-Miaixz-Trace-Id",
  userId: "X-Miaixz-User-Id",
  tenantId: "X-Miaixz-Tenant-Id",
  organizationId: "X-Miaixz-Organization-Id",
  departmentId: "X-Miaixz-Department-Id",
  spaceId: "X-Miaixz-Space-Id",
  locale: "X-Miaixz-Locale",
  timezone: "X-Miaixz-Timezone",
} as const);

/**
 * Defines canonical browser storage keys used by Miaixz applications.
 *
 * @public
 */
export const miaixzStorageKeys = Object.freeze({
  auth: "miaixz-auth",
  context: "miaixz-context",
  appearance: "miaixz-appearance",
} as const);

/**
 * Defines the default SDK request timeout in milliseconds.
 *
 * @public
 */
export const miaixzDefaultRequestTimeoutMs = 30_000;
