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
 * Defines runtime-context values and context-store options.
 */

import type { MiaixzIdentifier } from "../../fabric/api/api.types.js";
import type { MiaixzEventBusPort, MiaixzSdkEventMap } from "../../runtime/events/event-types.js";
import type {
  MiaixzKeyValueStorage,
  MiaixzStorageMigration,
} from "../../runtime/storage/storage.js";

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

/**
 * Configures a Miaixz runtime-context store.
 *
 * @public
 */
export interface MiaixzContextStoreOptions {
  /**
   * Identifies the consuming frontend application and its physical storage namespace.
   */
  readonly appId: string;

  /**
   * Optional context merged over persisted state.
   */
  readonly initialContext?: MiaixzRuntimeContext;

  /**
   * Optional key-value storage used for persistence.
   */
  readonly storage?: MiaixzKeyValueStorage;

  /**
   * Indicates whether context should be persisted.
   *
   * @defaultValue true
   */
  readonly persist?: boolean;

  /**
   * Supplies optional sequential migrations for older context schemas.
   */
  readonly migrations?: readonly MiaixzStorageMigration[];

  /**
   * Optional event bus used to synchronize service instances.
   */
  readonly eventBus?: MiaixzEventBusPort<MiaixzSdkEventMap>;
}
