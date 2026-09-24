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
 * Manages Bearer session state, refresh, persistence, and event synchronization.
 */

import { MiaixzSdkError } from "../../errors/errors.js";
import { miaixzStorageKeys } from "../../runtime/storage/storage-keys.js";
import { readMiaixzJson, writeMiaixzJson } from "../../runtime/storage/storage.js";
import { isPersistentSessionStorage } from "./session-storage.js";
import type {
  MiaixzPersistentSessionStorage,
  MiaixzSession,
  MiaixzSessionManagerOptions,
  MiaixzSessionRefresher,
  MiaixzSessionStatus,
} from "./session.types.js";
import {
  areSessionsEqual,
  DEFAULT_SESSION_EXPIRATION_LEEWAY_SECONDS,
  isMiaixzSession,
  isMiaixzSessionExpired,
  isSessionStatusEvent,
} from "./session-validation.js";

/**
 * Persists session state, refreshes tokens, and synchronizes service instances.
 *
 * @public
 */
export class MiaixzSessionManager {
  readonly #persistence: MiaixzPersistentSessionStorage | undefined;
  readonly #refreshSession: MiaixzSessionRefresher | undefined;
  readonly #expirationLeewaySeconds: number;
  readonly #now: () => number;
  readonly #eventBus: MiaixzSessionManagerOptions["eventBus"];
  readonly #sessionListeners = new Set<(session: Readonly<MiaixzSession> | undefined) => void>();
  #currentSession: MiaixzSession | undefined;
  #sessionRefresh: Promise<MiaixzSession | undefined> | undefined;
  #unsubscribeSessionEvent: (() => void) | undefined;
  #publishingSessionStatus = false;

  /**
   * Creates a session manager.
   *
   * @param options - Storage, refresh, clock, and event adapters.
   */
  constructor(options: MiaixzSessionManagerOptions = {}) {
    if (options.persistence && !isPersistentSessionStorage(options.persistence)) {
      throw new MiaixzSdkError({ code: "SESSION_PERSISTENCE_ACKNOWLEDGEMENT_REQUIRED" });
    }
    this.#persistence = options.persistence;
    this.#refreshSession = options.refresh;
    this.#expirationLeewaySeconds =
      options.expirationLeewaySeconds ?? DEFAULT_SESSION_EXPIRATION_LEEWAY_SECONDS;
    this.#now = options.now ?? Date.now;
    this.#eventBus = options.eventBus;
    this.#currentSession = readMiaixzJson(
      this.#persistence,
      miaixzStorageKeys.session,
      isMiaixzSession,
    );
    this.#unsubscribeSessionEvent = this.#eventBus?.on("session:changed", (event) => {
      if (!this.#publishingSessionStatus && isSessionStatusEvent(event)) this.#resetSession(false);
    });
  }

  /**
   * Returns the active session.
   *
   * @returns An immutable copy of the active session, when signed in.
   */
  getSession(): Readonly<MiaixzSession> | undefined {
    return this.#currentSession === undefined
      ? undefined
      : Object.freeze({
          ...this.#currentSession,
          ...(this.#currentSession.user
            ? { user: Object.freeze({ ...this.#currentSession.user }) }
            : {}),
        });
  }

  /**
   * Validates, persists, broadcasts, and publishes a new session.
   *
   * @param session - Session to activate.
   */
  setSession(session: MiaixzSession): void {
    this.#commitSession(session, true);
  }

  /**
   * Commits a session and optionally publishes it to other service instances.
   *
   * @param session - Session to commit.
   * @param publish - Whether to publish the change through the event bus.
   */
  #commitSession(session: MiaixzSession, publish: boolean): void {
    if (!isMiaixzSession(session)) {
      throw new MiaixzSdkError({ code: "SESSION_INVALID" });
    }
    if (areSessionsEqual(this.#currentSession, session)) return;
    this.#currentSession = {
      ...session,
      ...(session.user ? { user: { ...session.user } } : {}),
    };
    writeMiaixzJson(this.#persistence, miaixzStorageKeys.session, this.#currentSession);
    this.#notifySessionListeners();
    if (publish) this.#publishSessionStatus("authenticated");
  }

  /**
   * Removes the active session from memory and persistent storage.
   */
  clearSession(): void {
    this.#resetSession(true);
  }

  /**
   * Clears session state and optionally publishes the change.
   *
   * @param publish - Whether to publish the change through the event bus.
   */
  #resetSession(publish: boolean): void {
    if (this.#currentSession === undefined) return;
    this.#currentSession = undefined;
    writeMiaixzJson(this.#persistence, miaixzStorageKeys.session, undefined);
    this.#notifySessionListeners();
    if (publish) this.#publishSessionStatus("anonymous");
  }

  /**
   * Registers a session listener and returns its unsubscribe function.
   *
   * @param listener - Callback invoked with each session snapshot.
   * @returns Function that unregisters the listener.
   */
  subscribe(listener: (session: Readonly<MiaixzSession> | undefined) => void): () => void {
    this.#sessionListeners.add(listener);
    return () => this.#sessionListeners.delete(listener);
  }

  /**
   * Returns a valid access token, refreshing an expired session once when possible.
   * Concurrent callers share the same refresh operation.
   *
   * @returns Active access token when a valid session is available.
   */
  async getAccessToken(): Promise<string | undefined> {
    const session = this.#currentSession;
    if (!session) return undefined;
    if (!isMiaixzSessionExpired(session, this.#now(), this.#expirationLeewaySeconds)) {
      return session.accessToken;
    }
    if (!this.#refreshSession) return undefined;

    this.#sessionRefresh ??= Promise.resolve()
      .then(() => this.#refreshSession?.(Object.freeze({ ...session })))
      .then((refreshed) => {
        if (refreshed) this.setSession(refreshed);
        else this.clearSession();
        return refreshed;
      })
      .catch(() => {
        this.clearSession();
        throw new MiaixzSdkError({ code: "SESSION_REFRESH_FAILED" });
      })
      .finally(() => {
        this.#sessionRefresh = undefined;
      });

    return (await this.#sessionRefresh)?.accessToken;
  }

  /**
   * Fetch-compatible token provider bound to this manager.
   *
   * @returns Active access token when a valid session is available.
   */
  readonly tokenProvider = (): Promise<string | undefined> => this.getAccessToken();

  /**
   * Returns a complete Authorization header value using the session token type.
   * Bearer remains the default when the session does not declare a token type.
   *
   * @returns Complete Authorization header value when signed in.
   */
  readonly authorizationProvider = async (): Promise<string | undefined> => {
    const accessToken = await this.getAccessToken();
    if (!accessToken) return undefined;
    const tokenType = this.#currentSession?.tokenType?.trim() || "Bearer";
    return `${tokenType} ${accessToken}`;
  };

  /**
   * Releases event subscriptions and local listeners owned by this manager.
   */
  destroy(): void {
    this.#unsubscribeSessionEvent?.();
    this.#sessionListeners.clear();
  }

  /**
   * Publishes an immutable session snapshot to local subscribers.
   */
  #notifySessionListeners(): void {
    const snapshot = this.getSession();
    for (const listener of this.#sessionListeners) listener(snapshot);
  }

  /**
   * Publishes a non-sensitive session status without consuming its local echo.
   *
   * @param status - Session status to deliver locally and across configured windows.
   */
  #publishSessionStatus(status: MiaixzSessionStatus): void {
    if (!this.#eventBus) return;
    this.#publishingSessionStatus = true;
    try {
      this.#eventBus.emit("session:changed", Object.freeze({ status }));
    } finally {
      this.#publishingSessionStatus = false;
    }
  }
}

/**
 * Creates a Bearer session manager with in-memory-only defaults.
 *
 * @param options - Optional persistence, refresh, clock, and event adapters.
 * @returns Configured session manager.
 * @public
 */
export function createMiaixzSessionManager(
  options?: MiaixzSessionManagerOptions,
): MiaixzSessionManager {
  return new MiaixzSessionManager(options);
}
