import { miaixzStorageKeys } from "../consts/index.js";
import { MiaixzSdkError } from "../api/errors.js";
import type { MiaixzAuthStatusEvent, MiaixzEventBus, MiaixzSdkEventMap } from "../events/index.js";
import { miaixzDefaultI18n, type MiaixzTranslator } from "../i18n/index.js";
import { readMiaixzJson, writeMiaixzJson, type MiaixzKeyValueStorage } from "../storage/index.js";
import type { MiaixzUserSummary } from "../types/index.js";
import { isRecord } from "../utils/object.js";

/**
 * Describes authentication state managed by the Miaixz SDK.
 *
 * @public
 */
export interface MiaixzAuthSession {
  /**
   * Access token presented to protected services.
   */
  readonly accessToken: string;

  /**
   * Optional token used to renew the session.
   */
  readonly refreshToken?: string;

  /**
   * Optional authorization scheme associated with the access token.
   */
  readonly tokenType?: string;

  /**
   * Optional token expiry as Unix time in milliseconds.
   */
  readonly expiresAt?: number;

  /**
   * Optional summary of the authenticated user.
   */
  readonly user?: MiaixzUserSummary;
}

/**
 * Identifies the only cross-window authentication states exposed by the SDK.
 *
 * @public
 */
export type MiaixzAuthStatus = "authenticated" | "anonymous";

/**
 * Refreshes an expiring authentication session.
 *
 * @public
 */
export type MiaixzSessionRefresher = (
  session: Readonly<MiaixzAuthSession>,
) => MiaixzAuthSession | undefined | Promise<MiaixzAuthSession | undefined>;

/**
 * Marks a storage adapter whose use for Bearer credentials was explicitly acknowledged.
 *
 * Persisting access or refresh tokens in Web Storage increases exposure to script injection.
 * Prefer the default in-memory mode or an HttpOnly Cookie/BFF integration whenever possible.
 *
 * @public
 */
export interface MiaixzPersistentAuthStorage extends MiaixzKeyValueStorage {
  /**
   * Discriminator proving that the adapter was created by the explicit-risk factory.
   */
  readonly kind: "miaixz-persistent-auth-storage";
}

/**
 * Tracks adapters created by the explicit-risk factory without exposing a forgeable public flag.
 */
const persistentAuthStorages = new WeakSet<object>();

/**
 * Creates the only storage adapter accepted for persistent Bearer sessions.
 *
 * Access and refresh tokens stored in localStorage or sessionStorage can be read by scripts
 * running in the same origin. Callers must explicitly acknowledge that security trade-off.
 *
 * @param storage - Underlying storage adapter, such as localStorage or sessionStorage.
 * @param options - Mandatory risk acknowledgement and optional physical storage key.
 * @returns An authentication-specific persistent storage adapter.
 * @throws MiaixzSdkError When the Web Storage risk is not explicitly acknowledged.
 * @public
 */
export function createMiaixzPersistentAuthStorage(
  storage: MiaixzKeyValueStorage,
  options: Readonly<{
    /**
     * Confirms that the caller accepts the security risk of persistent browser token storage.
     */
    acknowledgeWebStorageRisk: true;

    /**
     * Optional physical storage key; defaults to `miaixz-auth`.
     */
    storageKey?: string;
  }>,
): MiaixzPersistentAuthStorage {
  if (options?.acknowledgeWebStorageRisk !== true) {
    throw new MiaixzSdkError(
      miaixzDefaultI18n.t("sdk.error.auth.persistenceAcknowledgementRequired"),
      { code: "AUTH_PERSISTENCE_ACKNOWLEDGEMENT_REQUIRED" },
    );
  }

  const physicalKey = options.storageKey ?? miaixzStorageKeys.auth;
  const persistence: MiaixzPersistentAuthStorage = Object.freeze({
    kind: "miaixz-persistent-auth-storage" as const,
    getItem: (_key: string): string | null => storage.getItem(physicalKey),
    setItem: (_key: string, value: string): void => storage.setItem(physicalKey, value),
    removeItem: (_key: string): void => storage.removeItem(physicalKey),
  });
  persistentAuthStorages.add(persistence);
  return persistence;
}
/**
 * Configures a Miaixz authentication manager.
 *
 * @public
 */
export interface MiaixzAuthManagerOptions {
  /**
   * Explicitly acknowledged storage used to persist Bearer credentials.
   */
  readonly persistence?: MiaixzPersistentAuthStorage;

  /**
   * Optional callback used to refresh an expiring session.
   */
  readonly refresh?: MiaixzSessionRefresher;

  /**
   * Optional safety window in seconds before token expiry.
   */
  readonly expirationLeewaySeconds?: number;

  /**
   * Optional clock returning Unix time in milliseconds.
   */
  readonly now?: () => number;

  /**
   * Optional translator used for authentication errors.
   */
  readonly translate?: MiaixzTranslator;

  /**
   * Optional event bus used to synchronize service instances.
   */
  readonly events?: MiaixzEventBus<MiaixzSdkEventMap>;
}

/**
 * Determines whether a value is a valid user summary for a session.
 *
 * @param value - Value to inspect.
 * @returns Whether `value` is a valid immutable user summary for a session.
 */
function isMiaixzUserSummary(value: unknown): value is MiaixzUserSummary {
  if (!isRecord(value) || typeof value.id !== "string" || !value.id.trim()) return false;
  if (typeof value.displayName !== "string" || !value.displayName.trim()) return false;
  if (value.username !== undefined && typeof value.username !== "string") return false;
  if (value.avatarUrl !== undefined && typeof value.avatarUrl !== "string") return false;
  return true;
}

/**
 * Determines whether a value is a usable authentication session.
 *
 * @param value - Value to inspect.
 * @returns Whether `value` is a usable authentication session.
 * @public
 */
export function isMiaixzAuthSession(value: unknown): value is MiaixzAuthSession {
  if (!isRecord(value) || typeof value.accessToken !== "string" || !value.accessToken.trim())
    return false;
  if (value.refreshToken !== undefined && typeof value.refreshToken !== "string") return false;
  if (value.tokenType !== undefined && typeof value.tokenType !== "string") return false;
  if (
    value.expiresAt !== undefined &&
    (typeof value.expiresAt !== "number" || !Number.isFinite(value.expiresAt))
  )
    return false;
  if (value.user !== undefined && !isMiaixzUserSummary(value.user)) return false;
  return true;
}

/**
 * Checks token expiry with a configurable refresh safety window.
 * @param session - Session to inspect.
 * @param now - Current Unix time in milliseconds.
 * @param leewaySeconds - Seconds before expiry that count as expired.
 * @returns Whether the session has expired within the safety window.
 * @public
 */
export function isMiaixzSessionExpired(
  session: Readonly<MiaixzAuthSession>,
  now = Date.now(),
  leewaySeconds = 30,
): boolean {
  return session.expiresAt !== undefined && session.expiresAt <= now + leewaySeconds * 1000;
}

/**
 * Compares persisted authentication values to suppress duplicate event delivery.
 *
 * @param first - First session to compare.
 * @param second - Second session to compare.
 * @returns Whether both session values contain equivalent data.
 */
function sessionsEqual(
  first: Readonly<MiaixzAuthSession> | undefined,
  second: Readonly<MiaixzAuthSession> | undefined,
): boolean {
  return JSON.stringify(first) === JSON.stringify(second);
}

/**
 * Determines whether an untrusted event is a supported authentication status signal.
 *
 * @param value - Event payload to inspect.
 * @returns Whether the payload contains only a recognized authentication status.
 */
function isMiaixzAuthStatusEvent(value: unknown): value is MiaixzAuthStatusEvent {
  return (
    isRecord(value) &&
    (value.status === "authenticated" || value.status === "anonymous") &&
    Object.keys(value).length === 1
  );
}

/**
 * Persists authentication state, refreshes tokens, and synchronizes service instances.
 *
 * @public
 */
export class MiaixzAuthManager {
  readonly #persistence: MiaixzPersistentAuthStorage | undefined;
  readonly #refresh: MiaixzSessionRefresher | undefined;
  readonly #expirationLeewaySeconds: number;
  readonly #now: () => number;
  readonly #translate: MiaixzTranslator;
  readonly #events: MiaixzEventBus<MiaixzSdkEventMap> | undefined;
  readonly #listeners = new Set<(session: Readonly<MiaixzAuthSession> | undefined) => void>();
  #session: MiaixzAuthSession | undefined;
  #refreshPromise: Promise<MiaixzAuthSession | undefined> | undefined;
  #stopEventListener: (() => void) | undefined;
  #publishingStatus = false;

  /**
   * Creates an authentication manager.
   *
   * @param options - Storage, refresh, clock, event, and translation adapters.
   */
  constructor(options: MiaixzAuthManagerOptions = {}) {
    if (options.persistence && !persistentAuthStorages.has(options.persistence)) {
      throw new MiaixzSdkError(
        (options.translate ?? miaixzDefaultI18n.t)(
          "sdk.error.auth.persistenceAcknowledgementRequired",
        ),
        { code: "AUTH_PERSISTENCE_ACKNOWLEDGEMENT_REQUIRED" },
      );
    }
    this.#persistence = options.persistence;
    this.#refresh = options.refresh;
    this.#expirationLeewaySeconds = options.expirationLeewaySeconds ?? 30;
    this.#now = options.now ?? Date.now;
    this.#translate = options.translate ?? miaixzDefaultI18n.t;
    this.#events = options.events;
    this.#session = readMiaixzJson(this.#persistence, miaixzStorageKeys.auth, isMiaixzAuthSession);
    this.#stopEventListener = this.#events?.on("auth:changed", (event) => {
      if (!this.#publishingStatus && isMiaixzAuthStatusEvent(event)) this.#clearSession(false);
    });
  }

  /**
   * Returns the active authentication session.
   *
   * @returns An immutable copy of the active session, when signed in.
   */
  getSession(): Readonly<MiaixzAuthSession> | undefined {
    return this.#session === undefined
      ? undefined
      : Object.freeze({
          ...this.#session,
          ...(this.#session.user ? { user: Object.freeze({ ...this.#session.user }) } : {}),
        });
  }

  /**
   * Validates, persists, broadcasts, and publishes a new session.
   *
   * @param session - Authentication session to activate.
   */
  setSession(session: MiaixzAuthSession): void {
    this.#setSession(session, true);
  }

  /**
   * Commits a session and optionally broadcasts it to other service instances.
   *
   * @param session - Authentication session to commit.
   * @param broadcast - Whether to publish the change through the event bus.
   */
  #setSession(session: MiaixzAuthSession, broadcast: boolean): void {
    if (!isMiaixzAuthSession(session)) {
      throw new MiaixzSdkError(this.#translate("sdk.error.auth.sessionInvalid"), {
        code: "AUTH_SESSION_INVALID",
      });
    }
    if (sessionsEqual(this.#session, session)) return;
    this.#session = {
      ...session,
      ...(session.user ? { user: { ...session.user } } : {}),
    };
    writeMiaixzJson(this.#persistence, miaixzStorageKeys.auth, this.#session);
    this.#notify();
    if (broadcast) this.#publishStatus("authenticated");
  }

  /**
   * Removes the active session from memory and persistent storage.
   */
  clearSession(): void {
    this.#clearSession(true);
  }

  /**
   * Clears session state and optionally broadcasts the change.
   *
   * @param broadcast - Whether to publish the change through the event bus.
   */
  #clearSession(broadcast: boolean): void {
    if (this.#session === undefined) return;
    this.#session = undefined;
    writeMiaixzJson(this.#persistence, miaixzStorageKeys.auth, undefined);
    this.#notify();
    if (broadcast) this.#publishStatus("anonymous");
  }

  /**
   * Registers a session listener and returns its unsubscribe function.
   *
   * @param listener - Callback invoked with each authentication snapshot.
   * @returns Function that unregisters the listener.
   */
  subscribe(listener: (session: Readonly<MiaixzAuthSession> | undefined) => void): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  /**
   * Returns a valid access token, refreshing an expired session once when possible.
   * Concurrent callers share the same refresh operation.
   *
   * @returns Active access token when a valid session is available.
   */
  async getAccessToken(): Promise<string | undefined> {
    const session = this.#session;
    if (!session) return undefined;
    if (!isMiaixzSessionExpired(session, this.#now(), this.#expirationLeewaySeconds)) {
      return session.accessToken;
    }
    if (!this.#refresh) return undefined;

    this.#refreshPromise ??= Promise.resolve()
      .then(() => this.#refresh?.(Object.freeze({ ...session })))
      .then((refreshed) => {
        if (refreshed) this.setSession(refreshed);
        else this.clearSession();
        return refreshed;
      })
      .catch(() => {
        this.clearSession();
        throw new MiaixzSdkError(this.#translate("sdk.error.auth.refreshFailed"), {
          code: "AUTH_REFRESH_FAILED",
        });
      })
      .finally(() => {
        this.#refreshPromise = undefined;
      });

    return (await this.#refreshPromise)?.accessToken;
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
    const tokenType = this.#session?.tokenType?.trim() || "Bearer";
    return `${tokenType} ${accessToken}`;
  };

  /**
   * Releases event subscriptions and local listeners owned by this manager.
   */
  destroy(): void {
    this.#stopEventListener?.();
    this.#listeners.clear();
  }

  /**
   * Publishes an immutable session snapshot to local subscribers.
   */
  #notify(): void {
    const snapshot = this.getSession();
    for (const listener of this.#listeners) listener(snapshot);
  }

  /**
   * Publishes a non-sensitive authentication status without consuming its local echo.
   *
   * @param status - Authentication status to deliver locally and across configured windows.
   */
  #publishStatus(status: MiaixzAuthStatus): void {
    if (!this.#events) return;
    this.#publishingStatus = true;
    try {
      this.#events.emit("auth:changed", Object.freeze({ status }));
    } finally {
      this.#publishingStatus = false;
    }
  }
}

/**
 * Creates a Bearer authentication manager with in-memory-only defaults.
 *
 * @param options - Optional persistence, refresh, clock, event, and translation adapters.
 * @returns Configured authentication manager.
 * @public
 */
export function createMiaixzAuthManager(options?: MiaixzAuthManagerOptions): MiaixzAuthManager {
  return new MiaixzAuthManager(options);
}
