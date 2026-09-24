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
 * Creates explicitly acknowledged persistent storage for Bearer sessions.
 */

import { MiaixzSdkError } from "../../errors/errors.js";
import { miaixzStorageKeys } from "../../runtime/storage/storage-keys.js";
import type { MiaixzKeyValueStorage } from "../../runtime/storage/storage.js";
import type { MiaixzPersistentSessionStorage } from "./session.types.js";

/**
 * Tracks adapters created by the explicit-risk factory without exposing a forgeable public flag.
 */
const PERSISTENT_SESSION_STORAGES = new WeakSet<object>();

/**
 * Creates the only storage adapter accepted for persistent Bearer sessions.
 *
 * Access and refresh tokens stored in localStorage or sessionStorage can be read by scripts
 * running in the same origin. Callers must explicitly acknowledge that security trade-off.
 *
 * @param storage - Underlying storage adapter, such as localStorage or sessionStorage.
 * @param options - Mandatory risk acknowledgement and optional physical storage key.
 * @returns A session-specific persistent storage adapter.
 * @throws MiaixzSdkError When the Web Storage risk is not explicitly acknowledged.
 * @public
 */
export function createMiaixzPersistentSessionStorage(
  storage: MiaixzKeyValueStorage,
  options: Readonly<{
    /**
     * Confirms that the caller accepts the security risk of persistent browser token storage.
     */
    acknowledgeWebStorageRisk: true;

    /**
     * Optional physical storage key; defaults to `miaixz-session`.
     */
    storageKey?: string;
  }>,
): MiaixzPersistentSessionStorage {
  if (options?.acknowledgeWebStorageRisk !== true) {
    throw new MiaixzSdkError({ code: "SESSION_PERSISTENCE_ACKNOWLEDGEMENT_REQUIRED" });
  }

  const storageKey = options.storageKey ?? miaixzStorageKeys.session;
  const persistence: MiaixzPersistentSessionStorage = Object.freeze({
    kind: "miaixz-persistent-session-storage" as const,
    getItem: (_key: string): string | null => storage.getItem(storageKey),
    setItem: (_key: string, value: string): void => storage.setItem(storageKey, value),
    removeItem: (_key: string): void => storage.removeItem(storageKey),
  });
  PERSISTENT_SESSION_STORAGES.add(persistence);
  return persistence;
}

/**
 * Determines whether a persistent-session adapter came from the risk-acknowledgement factory.
 *
 * @param storage - Storage adapter to inspect.
 * @returns Whether the adapter was registered by the session-storage factory.
 */
export function isPersistentSessionStorage(storage: object): boolean {
  return PERSISTENT_SESSION_STORAGES.has(storage);
}
