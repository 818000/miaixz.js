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
 * Describes an organization within a tenant.
 *
 * @public
 */
export interface MiaixzOrganizationSummary {
  /**
   * Unique identifier of the organization.
   */
  id: MiaixzIdentifier;

  /**
   * Identifier of the tenant that owns the organization.
   */
  tenantId: MiaixzIdentifier;

  /**
   * Display name of the organization.
   */
  name: string;

  /**
   * Optional human-readable organization code.
   */
  code?: string;
}

/**
 * Describes a department within an organization.
 *
 * @public
 */
export interface MiaixzDepartmentSummary {
  /**
   * Unique identifier of the department.
   */
  id: MiaixzIdentifier;

  /**
   * Identifier of the tenant that owns the department.
   */
  tenantId: MiaixzIdentifier;

  /**
   * Identifier of the organization that contains the department.
   */
  organizationId: MiaixzIdentifier;

  /**
   * Display name of the department.
   */
  name: string;

  /**
   * Optional human-readable department code.
   */
  code?: string;

  /**
   * Optional identifier of the parent department.
   */
  parentId?: MiaixzIdentifier;
}
