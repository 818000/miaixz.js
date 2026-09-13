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

import type { MiaixzHostBridge } from "./host-context.js";
import type { MiaixzModuleManifest } from "./module-manifest.js";

/**
 * Provides the host-owned resources required to mount an integrated module.
 *
 * @public
 */
export interface MiaixzModuleMountContext {
  /**
   * DOM container owned by the host application.
   */
  readonly container: HTMLElement;

  /**
   * Capability-limited bridge supplied by the host.
   */
  readonly bridge: MiaixzHostBridge;

  /**
   * Validated immutable manifest associated with the module.
   */
  readonly manifest: Readonly<MiaixzModuleManifest>;
}

/**
 * Represents the resources returned by a mounted integrated module.
 *
 * @public
 */
export interface MiaixzModuleHandle {
  /**
   * Releases every resource created by the mounted module.
   *
   * @returns Nothing, or a promise resolved after asynchronous cleanup.
   */
  unmount(): void | Promise<void>;
}

/**
 * Defines the only lifecycle entry exposed by an integrated module.
 *
 * @public
 */
export interface MiaixzIntegratedModule {
  /**
   * Mounts the module into its host-owned container.
   *
   * @param context - Validated host resources supplied to the module.
   * @returns Handle used by the host to unmount the module.
   */
  mount(context: MiaixzModuleMountContext): MiaixzModuleHandle | Promise<MiaixzModuleHandle>;
}
