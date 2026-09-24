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
 * Stores, persists, and synchronizes the active runtime context.
 */

import {
  getMiaixzBrowserStorage,
  readMiaixzVersionedValue,
  writeMiaixzVersionedValue,
  type MiaixzKeyValueStorage,
  type MiaixzStorageMigration,
} from "../../runtime/storage/storage.js";
import { miaixzContextToHeaders } from "./context-headers.js";
import type { MiaixzContextStoreOptions, MiaixzRuntimeContext } from "./context.types.js";
import {
  areContextsEqual,
  CONTEXT_SCHEMA_VERSION,
  isMiaixzRuntimeContext,
  mergeContext,
  normalizeContext,
} from "./context-validation.js";

/**
 * Stores request context independently of URL route parameters.
 *
 * @public
 */
export class MiaixzContextStore {
  readonly #storage: MiaixzKeyValueStorage | undefined;
  readonly #appId: string;
  readonly #persist: boolean;
  readonly #migrations: readonly MiaixzStorageMigration[] | undefined;
  readonly #contextListeners = new Set<(context: Readonly<MiaixzRuntimeContext>) => void>();
  readonly #eventBus: MiaixzContextStoreOptions["eventBus"];
  #currentContext: MiaixzRuntimeContext;
  #unsubscribeContextEvent: (() => void) | undefined;

  /**
   * Creates a runtime-context store.
   *
   * @param options - Initial state plus persistence and event adapters.
   * @throws MiaixzSdkError When app, migration, or explicit context configuration is invalid.
   */
  constructor(options: MiaixzContextStoreOptions) {
    readMiaixzVersionedValue({
      scope: { appId: options.appId },
      kind: "context",
      schemaVersion: CONTEXT_SCHEMA_VERSION,
      ...(options.migrations === undefined ? {} : { migrations: options.migrations }),
      parse: normalizeContext,
    });
    if (options.initialContext !== undefined) normalizeContext(options.initialContext);
    this.#storage = options.storage ?? getMiaixzBrowserStorage();
    this.#appId = options.appId;
    this.#persist = options.persist ?? true;
    this.#migrations = options.migrations;
    this.#eventBus = options.eventBus;
    const persisted = this.#persist
      ? readMiaixzVersionedValue({
          ...(this.#storage === undefined ? {} : { storage: this.#storage }),
          scope: { appId: this.#appId },
          kind: "context",
          schemaVersion: CONTEXT_SCHEMA_VERSION,
          ...(this.#migrations === undefined ? {} : { migrations: this.#migrations }),
          parse: normalizeContext,
        })
      : undefined;
    this.#currentContext =
      options.initialContext === undefined
        ? { ...persisted }
        : mergeContext(persisted ?? {}, options.initialContext);
    if (this.#persist && options.initialContext !== undefined) this.#persistSnapshot();
    this.#unsubscribeContextEvent = this.#eventBus?.on("context:changed", (context) => {
      if (isMiaixzRuntimeContext(context)) this.#replaceContext(context, false);
    });
  }

  /**
   * Returns the active request context.
   *
   * @returns An immutable copy of the current request context.
   */
  getSnapshot(): Readonly<MiaixzRuntimeContext> {
    return Object.freeze({ ...this.#currentContext });
  }

  /**
   * Replaces, persists, and broadcasts the full runtime context.
   *
   * @param context - Complete runtime context to activate.
   * @throws MiaixzSdkError When the supplied context contains an invalid value.
   */
  set(context: MiaixzRuntimeContext): void {
    this.#replaceContext(context, true);
  }

  /**
   * Commits validated context and optionally broadcasts it.
   *
   * @param context - Complete runtime context to commit.
   * @param publish - Whether to publish the change through the event bus.
   */
  #replaceContext(context: MiaixzRuntimeContext, publish: boolean): void {
    const normalized = normalizeContext(context);
    if (areContextsEqual(this.#currentContext, normalized)) return;
    this.#currentContext = normalized;
    this.#commitSnapshot();
    if (publish) this.#eventBus?.emit("context:changed", this.getSnapshot());
  }

  /**
   * Merges a partial update into the current runtime context.
   *
   * @param context - Partial context values to merge.
   * @throws MiaixzSdkError When the merged context contains an invalid value.
   */
  patch(context: Partial<MiaixzRuntimeContext>): void {
    this.set({ ...this.#currentContext, ...context });
  }

  /**
   * Clears all runtime context values.
   */
  clear(): void {
    this.#replaceContext({}, true);
  }

  /**
   * Registers a context listener and returns its unsubscribe function.
   *
   * @param listener - Callback invoked with each context snapshot.
   * @returns Function that unregisters the listener.
   */
  subscribe(listener: (context: Readonly<MiaixzRuntimeContext>) => void): () => void {
    this.#contextListeners.add(listener);
    return () => this.#contextListeners.delete(listener);
  }

  /**
   * Request-client provider that returns headers for the latest context.
   *
   * @returns Headers for the active runtime context.
   */
  readonly headersProvider = (): Headers => miaixzContextToHeaders(this.#currentContext);

  /**
   * Releases event subscriptions and local listeners.
   */
  destroy(): void {
    this.#unsubscribeContextEvent?.();
    this.#contextListeners.clear();
  }

  /**
   * Persists the current context and notifies local listeners.
   */
  #commitSnapshot(): void {
    if (this.#persist) this.#persistSnapshot();
    const snapshot = this.getSnapshot();
    for (const listener of this.#contextListeners) listener(snapshot);
  }

  /**
   * Writes the current context through the shared versioned storage primitive.
   */
  #persistSnapshot(): void {
    writeMiaixzVersionedValue(
      {
        ...(this.#storage === undefined ? {} : { storage: this.#storage }),
        scope: { appId: this.#appId },
        kind: "context",
        schemaVersion: CONTEXT_SCHEMA_VERSION,
      },
      this.#currentContext,
    );
  }
}

/**
 * Creates a context store with optional browser persistence.
 *
 * @param options - Application identity, optional initial state, and runtime adapters.
 * @returns Configured runtime-context store.
 * @throws MiaixzSdkError When app, migration, or explicit context configuration is invalid.
 * @public
 */
export function createMiaixzContextStore(options: MiaixzContextStoreOptions): MiaixzContextStore {
  return new MiaixzContextStore(options);
}
