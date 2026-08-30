import { miaixzHeaders } from "../consts/index.js";
import { MiaixzSdkError } from "../api/errors.js";
import type { MiaixzEventBus, MiaixzSdkEventMap } from "../events/index.js";
import { miaixzDefaultI18n, type MiaixzTranslator } from "../i18n/index.js";
import {
  getMiaixzBrowserStorage,
  readMiaixzVersionedValue,
  writeMiaixzVersionedValue,
  type MiaixzKeyValueStorage,
  type MiaixzStorageMigration,
} from "../storage/index.js";
import type { MiaixzRuntimeContext } from "../types/index.js";
import { isRecord } from "../utils/object.js";

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
   * Supplies optional sequential migrations for older Context schemas.
   */
  readonly migrations?: readonly MiaixzStorageMigration[];

  /**
   * Optional event bus used to synchronize service instances.
   */
  readonly events?: MiaixzEventBus<MiaixzSdkEventMap>;

  /**
   * Optional translator used for context errors.
   */
  readonly translate?: MiaixzTranslator;
}

const miaixzContextSchemaVersion = 1;

/**
 * Determines whether a value is a valid runtime context.
 *
 * @param value - Value to inspect.
 * @returns Whether `value` is a valid string-valued runtime context.
 * @public
 */
export function isMiaixzRuntimeContext(value: unknown): value is MiaixzRuntimeContext {
  if (!isRecord(value)) return false;
  return Object.values(value).every((entry) => entry === undefined || typeof entry === "string");
}

/**
 * Parses and canonicalizes a runtime context by removing undefined fields.
 *
 * @param value - Runtime value to validate and normalize.
 * @param translate - Translator used for explicit invalid Context errors.
 * @returns A canonical runtime context containing only defined string values.
 * @throws MiaixzSdkError When the value is not a valid runtime context.
 */
function parseRuntimeContext(value: unknown, translate: MiaixzTranslator): MiaixzRuntimeContext {
  if (!isMiaixzRuntimeContext(value)) {
    throw new MiaixzSdkError(translate("sdk.error.context.invalid"), {
      code: "CONTEXT_INVALID",
    });
  }
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, string] => entry[1] !== undefined),
  ) as MiaixzRuntimeContext;
}

/**
 * Applies explicit Context fields over persisted state, treating undefined as deletion.
 *
 * @param persisted - Canonical persisted Context state.
 * @param initial - Valid explicit Context fields supplied by the host.
 * @param translate - Translator used to normalize the merged state.
 * @returns Canonical merged Context state.
 */
function mergeInitialContext(
  persisted: Readonly<MiaixzRuntimeContext>,
  initial: Readonly<MiaixzRuntimeContext>,
  translate: MiaixzTranslator,
): MiaixzRuntimeContext {
  const merged: Record<string, string | undefined> = { ...persisted };
  for (const [key, value] of Object.entries(initial)) {
    if (value === undefined) delete merged[key];
    else merged[key] = value;
  }
  return parseRuntimeContext(merged, translate);
}

/**
 * Converts tenant, organization, space, locale, and trace context into request headers.
 *
 * @param context - Runtime context to convert.
 * @returns Headers containing all defined runtime-context values.
 * @public
 */
export function miaixzContextToHeaders(context: Readonly<MiaixzRuntimeContext>): Headers {
  const headers = new Headers();
  const mapping: readonly [keyof MiaixzRuntimeContext, string][] = [
    ["userId", miaixzHeaders.userId],
    ["tenantId", miaixzHeaders.tenantId],
    ["organizationId", miaixzHeaders.organizationId],
    ["departmentId", miaixzHeaders.departmentId],
    ["spaceId", miaixzHeaders.spaceId],
    ["locale", miaixzHeaders.locale],
    ["timezone", miaixzHeaders.timezone],
    ["traceId", miaixzHeaders.traceId],
  ];
  for (const [key, header] of mapping) {
    const value = context[key];
    if (value) headers.set(header, value);
  }
  return headers;
}

/**
 * Compares string-valued context records to suppress duplicate event delivery.
 *
 * @param first - First context to compare.
 * @param second - Second context to compare.
 * @returns Whether both contexts contain equivalent values.
 */
function contextsEqual(
  first: Readonly<MiaixzRuntimeContext>,
  second: Readonly<MiaixzRuntimeContext>,
): boolean {
  const keys = new Set([...Object.keys(first), ...Object.keys(second)]);
  return [...keys].every(
    (key) => first[key as keyof MiaixzRuntimeContext] === second[key as keyof MiaixzRuntimeContext],
  );
}

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
  readonly #listeners = new Set<(context: Readonly<MiaixzRuntimeContext>) => void>();
  readonly #events: MiaixzEventBus<MiaixzSdkEventMap> | undefined;
  readonly #translate: MiaixzTranslator;
  #context: MiaixzRuntimeContext;
  #stopEventListener: (() => void) | undefined;

  /**
   * Creates a runtime-context store.
   *
   * @param options - Initial state plus persistence, events, and translation adapters.
   * @throws MiaixzSdkError When app, migration, or explicit Context configuration is invalid.
   */
  constructor(options: MiaixzContextStoreOptions) {
    this.#translate = options.translate ?? miaixzDefaultI18n.t;
    readMiaixzVersionedValue({
      scope: { appId: options.appId },
      kind: "context",
      schemaVersion: miaixzContextSchemaVersion,
      ...(options.migrations === undefined ? {} : { migrations: options.migrations }),
      parse: (value) => parseRuntimeContext(value, this.#translate),
    });
    if (options.initialContext !== undefined) {
      parseRuntimeContext(options.initialContext, this.#translate);
    }
    this.#storage = options.storage ?? getMiaixzBrowserStorage();
    this.#appId = options.appId;
    this.#persist = options.persist ?? true;
    this.#migrations = options.migrations;
    this.#events = options.events;
    const persisted = this.#persist
      ? readMiaixzVersionedValue({
          ...(this.#storage === undefined ? {} : { storage: this.#storage }),
          scope: { appId: this.#appId },
          kind: "context",
          schemaVersion: miaixzContextSchemaVersion,
          ...(this.#migrations === undefined ? {} : { migrations: this.#migrations }),
          parse: (value) => parseRuntimeContext(value, this.#translate),
        })
      : undefined;
    this.#context =
      options.initialContext === undefined
        ? { ...persisted }
        : mergeInitialContext(persisted ?? {}, options.initialContext, this.#translate);
    if (this.#persist && options.initialContext !== undefined) this.#persistSnapshot();
    this.#stopEventListener = this.#events?.on("context:changed", (context) => {
      if (isMiaixzRuntimeContext(context)) this.#set(context, false);
    });
  }

  /**
   * Returns the active request context.
   *
   * @returns An immutable copy of the current request context.
   */
  getSnapshot(): Readonly<MiaixzRuntimeContext> {
    return Object.freeze({ ...this.#context });
  }

  /**
   * Replaces, persists, and broadcasts the full runtime context.
   *
   * @param context - Complete runtime context to activate.
   * @throws MiaixzSdkError When the supplied Context contains an invalid value.
   */
  set(context: MiaixzRuntimeContext): void {
    this.#set(context, true);
  }

  /**
   * Commits validated context and optionally broadcasts it.
   *
   * @param context - Complete runtime context to commit.
   * @param broadcast - Whether to publish the change through the event bus.
   */
  #set(context: MiaixzRuntimeContext, broadcast: boolean): void {
    const normalized = parseRuntimeContext(context, this.#translate);
    if (contextsEqual(this.#context, normalized)) return;
    this.#context = normalized;
    this.#commit();
    if (broadcast) this.#events?.emit("context:changed", this.getSnapshot());
  }

  /**
   * Merges a partial update into the current runtime context.
   *
   * @param context - Partial context values to merge.
   * @throws MiaixzSdkError When the merged Context contains an invalid value.
   */
  patch(context: Partial<MiaixzRuntimeContext>): void {
    this.set({ ...this.#context, ...context });
  }

  /**
   * Clears all runtime context values.
   */
  clear(): void {
    this.#set({}, true);
  }

  /**
   * Registers a context listener and returns its unsubscribe function.
   *
   * @param listener - Callback invoked with each context snapshot.
   * @returns Function that unregisters the listener.
   */
  subscribe(listener: (context: Readonly<MiaixzRuntimeContext>) => void): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  /**
   * Request-client provider that returns headers for the latest context.
   *
   * @returns Headers for the active runtime context.
   */
  readonly headersProvider = (): Headers => miaixzContextToHeaders(this.#context);

  /**
   * Releases event subscriptions and local listeners.
   */
  destroy(): void {
    this.#stopEventListener?.();
    this.#listeners.clear();
  }

  /**
   * Persists the current context and notifies local listeners.
   */
  #commit(): void {
    if (this.#persist) this.#persistSnapshot();
    const snapshot = this.getSnapshot();
    for (const listener of this.#listeners) listener(snapshot);
  }

  /**
   * Writes the current Context through the shared versioned storage primitive.
   */
  #persistSnapshot(): void {
    writeMiaixzVersionedValue(
      {
        ...(this.#storage === undefined ? {} : { storage: this.#storage }),
        scope: { appId: this.#appId },
        kind: "context",
        schemaVersion: miaixzContextSchemaVersion,
      },
      this.#context,
    );
  }
}

/**
 * Creates a context store with optional browser persistence.
 *
 * @param options - Application identity, optional initial state, and runtime adapters.
 * @returns Configured runtime-context store.
 * @throws MiaixzSdkError When app, migration, or explicit Context configuration is invalid.
 * @public
 */
export function createMiaixzContextStore(options: MiaixzContextStoreOptions): MiaixzContextStore {
  return new MiaixzContextStore(options);
}
