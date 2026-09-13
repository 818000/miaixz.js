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

import type { MiaixzIdentifier } from "./api.js";

/**
 * Represents the lifecycle status of a platform tenant.
 *
 * @public
 */
export type MiaixzTenantStatus = "active" | "suspended" | "disabled";

/**
 * Platform tenant and security-boundary summary.
 *
 * @public
 */
export interface MiaixzTenantSummary {
  /**
   * Unique identifier of the tenant.
   */
  id: MiaixzIdentifier;

  /**
   * Display name of the tenant.
   */
  name: string;

  /**
   * Optional human-readable tenant code.
   */
  code?: string;

  /**
   * Current lifecycle status of the tenant.
   */
  status: MiaixzTenantStatus;
}
