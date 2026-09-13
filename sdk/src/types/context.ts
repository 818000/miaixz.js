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
 * Describes the execution context propagated across Miaixz services.
 *
 * @public
 */
export interface MiaixzRuntimeContext {
  /**
   * Identifier of the authenticated user.
   */
  userId?: MiaixzIdentifier;

  /**
   * Security and data-isolation boundary for every tenant-owned resource.
   */
  tenantId?: MiaixzIdentifier;
  /**
   * Optional organization selected inside the active tenant.
   */
  organizationId?: MiaixzIdentifier;

  /**
   * Optional department selected inside the active organization.
   */
  departmentId?: MiaixzIdentifier;

  /**
   * Optional workspace selected by the user.
   */
  spaceId?: MiaixzIdentifier;

  /**
   * Locale used for translated messages and regional formatting.
   */
  locale?: string;

  /**
   * IANA timezone used for date and time presentation.
   */
  timezone?: string;

  /**
   * Optional trace identifier propagated for diagnostics.
   */
  traceId?: string;
}
