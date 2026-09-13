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
 * Represents the lifecycle status of a workspace.
 *
 * @public
 */
export type MiaixzSpaceStatus = "active" | "disabled" | "archived";

/**
 * Describes a workspace available within a tenant.
 *
 * @public
 */
export interface MiaixzSpaceSummary {
  /**
   * Unique identifier of the workspace.
   */
  id: MiaixzIdentifier;

  /**
   * Identifier of the tenant that owns the workspace.
   */
  tenantId: MiaixzIdentifier;

  /**
   * Display name of the workspace.
   */
  name: string;

  /**
   * Optional human-readable workspace code.
   */
  code?: string;

  /**
   * Optional description of the workspace purpose.
   */
  description?: string;

  /**
   * Current lifecycle status of the workspace.
   */
  status: MiaixzSpaceStatus;

  /**
   * Optional identifier of the user responsible for the workspace.
   */
  ownerId?: MiaixzIdentifier;
}
