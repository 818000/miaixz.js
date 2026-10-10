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
 * Implements ownership and lazy loading for format drivers.
 */

import type { ViewerDriver } from "../shared/contracts/driver.js";
import type { FormatDescriptor, FormatDriverId } from "../shared/contracts/format.js";
import { ViewerError } from "../shared/errors/viewer-error.js";

/**
 * Owns the single default driver for every registered format family.
 */
export class DriverRegistry {
  readonly #loaders = new Map<FormatDriverId, () => Promise<ViewerDriver>>();
  readonly #descriptors = new Map<FormatDriverId, FormatDescriptor>();

  /**
   * Registers one lazy default driver and rejects duplicate ownership.
   *
   * @param id - Stable format family owned by the loader.
   * @param loader - Lazy loader that resolves the family driver.
   */
  register(id: FormatDriverId, loader: () => Promise<ViewerDriver>): void {
    if (this.#loaders.has(id)) throw new ViewerError("INVALID_CONFIGURATION", "detect");
    this.#loaders.set(id, loader);
  }

  /**
   * Registers one detectable custom format and its lazy driver.
   *
   * @param descriptor - Extensions, MIME types, state, and identity of the custom format.
   * @param loader - Lazy loader that resolves the custom driver.
   */
  registerFormat(descriptor: FormatDescriptor, loader: () => Promise<ViewerDriver>): void {
    this.register(descriptor.id, loader);
    this.#descriptors.set(descriptor.id, descriptor);
  }

  /**
   * Returns detection descriptions owned by this registry.
   *
   * @returns Immutable snapshot of registered format descriptions.
   */
  getFormatDescriptors(): readonly FormatDescriptor[] {
    return [...this.#descriptors.values()];
  }

  /**
   * Loads the unique driver selected by format detection.
   *
   * @param id - Stable format family selected by detection.
   * @returns Loaded driver for the requested family.
   */
  async load(id: FormatDriverId): Promise<ViewerDriver> {
    const loader = this.#loaders.get(id);
    if (loader === undefined) throw new ViewerError("FORMAT_UNSUPPORTED", "detect", true);
    return loader();
  }

  /**
   * Reports whether a default driver exists without importing it.
   *
   * @param id - Stable format family queried by the caller.
   * @returns True when the registry owns a loader for the family.
   */
  has(id: FormatDriverId): boolean {
    return this.#loaders.has(id);
  }
}
