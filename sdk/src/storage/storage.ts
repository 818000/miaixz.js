import { MiaixzSdkError } from "../api/errors.js";
import type { MiaixzResponseParser } from "../api/request.js";
import { translateMiaixzDefaultMessage } from "../i18n/default-translator.js";

/**
 * Defines the browser-compatible storage operations required by the SDK.
 *
 * @public
 */
export interface MiaixzKeyValueStorage {
  /**
   * Reads a serialized value or returns `null` when the key is absent.
   *
   * @param key - Storage key to read.
   * @returns Serialized value or null when the key is absent.
   */
  getItem(key: string): string | null;
  /**
   * Stores a serialized value under the supplied key.
   *
   * @param key - Storage key to write.
   * @param value - Serialized value to store.
   */
  setItem(key: string, value: string): void;
  /**
   * Removes the supplied key.
   *
   * @param key - Storage key to remove.
   */
  removeItem(key: string): void;
}

/**
 * Wraps persisted data with its schema version.
 *
 * @typeParam T - Persisted application value type.
 * @public
 */
export interface MiaixzVersionedValue<T> {
  /**
   * Identifies the schema used to serialize the value.
   */
  readonly schemaVersion: number;

  /**
   * Contains the persisted application value.
   */
  readonly value: T;
}

/**
 * Migrates one persisted schema version to its immediate successor.
 *
 * @public
 */
export interface MiaixzStorageMigration {
  /**
   * Identifies the source schema version.
   */
  readonly from: number;

  /**
   * Identifies the immediate target schema version.
   */
  readonly to: number;

  /**
   * Converts one untrusted persisted value to the next schema.
   *
   * @param value - Value produced by storage or the previous migration.
   * @returns Value represented in the target schema.
   */
  migrate(value: unknown): unknown;
}

/**
 * Identifies the application and optional tenant owning persisted data.
 *
 * @public
 */
export interface MiaixzStorageScope {
  /**
   * Identifies the consuming frontend application.
   */
  readonly appId: string;

  /**
   * Identifies the optional tenant-specific persistence boundary.
   */
  readonly tenantId?: string;
}

/**
 * Configures validated versioned storage reads.
 *
 * @typeParam T - Parsed application value type.
 * @public
 */
export interface MiaixzVersionedStorageOptions<T> {
  /**
   * Supplies the optional physical storage adapter.
   */
  readonly storage?: MiaixzKeyValueStorage;

  /**
   * Selects the application and tenant persistence boundary.
   */
  readonly scope: Readonly<MiaixzStorageScope>;

  /**
   * Selects the fixed persisted data category.
   */
  readonly kind: "appearance" | "context" | "preferences";

  /**
   * Identifies the current target schema version.
   */
  readonly schemaVersion: number;

  /**
   * Supplies an optional continuous sequence of one-version migrations.
   */
  readonly migrations?: readonly MiaixzStorageMigration[];

  /**
   * Parses the current-schema value into its normalized application representation.
   */
  readonly parse: MiaixzResponseParser<T>;
}

const miaixzApplicationIdPattern = /^[a-z][a-z0-9-]{1,63}$/;
const miaixzTenantIdPattern = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const miaixzStorageKinds = new Set(["appearance", "context", "preferences"]);

/**
 * Creates the fixed localized error for an invalid storage scope or kind.
 *
 * @returns Stable SDK storage-scope error.
 */
function createStorageScopeError(): MiaixzSdkError {
  return new MiaixzSdkError(translateMiaixzDefaultMessage("sdk.error.storage.scopeInvalid"), {
    code: "STORAGE_SCOPE_INVALID",
  });
}

/**
 * Creates the fixed localized error for invalid schema or migration configuration.
 *
 * @returns Stable SDK migration-chain error.
 */
function createMigrationChainError(): MiaixzSdkError {
  return new MiaixzSdkError(
    translateMiaixzDefaultMessage("sdk.error.storage.migrationChainInvalid"),
    { code: "STORAGE_MIGRATION_CHAIN_INVALID" },
  );
}

/**
 * Reports whether a number is a non-negative safe schema version.
 *
 * @param value - Version candidate to inspect.
 * @returns Whether the value is a supported persisted or migration version.
 */
function isNonNegativeSchemaVersion(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0;
}

/**
 * Validates a current target schema version.
 *
 * @param schemaVersion - Target version to validate.
 * @throws MiaixzSdkError When the target is not a positive safe integer.
 */
function validateTargetSchemaVersion(schemaVersion: number): void {
  if (!Number.isSafeInteger(schemaVersion) || schemaVersion < 1) {
    throw createMigrationChainError();
  }
}

/**
 * Validates the complete configured migration sequence in caller order.
 *
 * @param migrations - Optional migration chain to validate.
 * @throws MiaixzSdkError When a version is invalid, duplicated, or discontinuous.
 */
function validateMigrationChain(migrations: readonly MiaixzStorageMigration[] = []): void {
  let previousTarget: number | undefined;
  for (const migration of migrations) {
    if (
      !migration ||
      typeof migration !== "object" ||
      !isNonNegativeSchemaVersion(migration.from) ||
      !isNonNegativeSchemaVersion(migration.to) ||
      migration.to !== migration.from + 1 ||
      (previousTarget !== undefined && migration.from !== previousTarget) ||
      typeof migration.migrate !== "function"
    ) {
      throw createMigrationChainError();
    }
    previousTarget = migration.to;
  }
}

/**
 * Builds a collision-safe physical key for versioned Miaixz data.
 *
 * @param scope - Application and optional tenant persistence boundary.
 * @param kind - Fixed persisted data category.
 * @returns Physical storage key using the Miaixz version-one namespace.
 * @throws MiaixzSdkError When the application, tenant, or kind is invalid.
 * @public
 */
export function createMiaixzStorageKey(
  scope: Readonly<MiaixzStorageScope>,
  kind: "appearance" | "context" | "preferences",
): string {
  if (
    !scope ||
    !miaixzApplicationIdPattern.test(scope.appId) ||
    (scope.tenantId !== undefined &&
      (!miaixzTenantIdPattern.test(scope.tenantId) || scope.tenantId === "global")) ||
    !miaixzStorageKinds.has(kind)
  ) {
    throw createStorageScopeError();
  }
  return `miaixz:v1:${scope.tenantId ?? "global"}:${scope.appId}:${kind}`;
}

/**
 * Reports whether parsed JSON uses the exact versioned-value envelope.
 *
 * @param value - Parsed JSON candidate to inspect.
 * @returns Whether the value contains exactly schemaVersion and value fields.
 */
function isVersionedEnvelope(value: unknown): value is MiaixzVersionedValue<unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const keys = Object.keys(value);
  return (
    keys.length === 2 &&
    keys.includes("schemaVersion") &&
    keys.includes("value") &&
    "schemaVersion" in value &&
    "value" in value
  );
}

/**
 * Removes one physical storage key while swallowing adapter failures.
 *
 * @param storage - Storage adapter to update.
 * @param key - Exact physical key to remove.
 */
function safelyRemoveStorageValue(storage: MiaixzKeyValueStorage, key: string): void {
  try {
    storage.removeItem(key);
  } catch {
    // Persistence failures never change the caller's in-memory state.
  }
}

/**
 * Reads, migrates, validates, and optionally upgrades one versioned value.
 *
 * @typeParam T - Parsed application value type.
 * @param options - Scope, schema, migration, parser, and storage configuration.
 * @returns Parsed normalized value, or undefined when data is absent or unusable.
 * @throws MiaixzSdkError When scope, schema, or migration configuration is invalid.
 * @public
 */
export function readMiaixzVersionedValue<T>(
  options: Readonly<MiaixzVersionedStorageOptions<T>>,
): T | undefined {
  const key = createMiaixzStorageKey(options.scope, options.kind);
  validateTargetSchemaVersion(options.schemaVersion);
  validateMigrationChain(options.migrations);
  if (!options.storage) return undefined;
  let serialized: string | null;
  try {
    serialized = options.storage.getItem(key);
  } catch {
    return undefined;
  }
  if (serialized === null) return undefined;
  try {
    const envelope: unknown = JSON.parse(serialized);
    if (!isVersionedEnvelope(envelope) || !isNonNegativeSchemaVersion(envelope.schemaVersion)) {
      safelyRemoveStorageValue(options.storage, key);
      return undefined;
    }
    if (envelope.schemaVersion > options.schemaVersion) {
      safelyRemoveStorageValue(options.storage, key);
      return undefined;
    }
    let currentVersion = envelope.schemaVersion;
    let migratedValue: unknown = envelope.value;
    while (currentVersion < options.schemaVersion) {
      const migration = options.migrations?.find((candidate) => candidate.from === currentVersion);
      if (!migration) {
        safelyRemoveStorageValue(options.storage, key);
        return undefined;
      }
      migratedValue = migration.migrate(migratedValue);
      currentVersion = migration.to;
    }
    const parsed = options.parse(migratedValue);
    if (envelope.schemaVersion < options.schemaVersion) {
      writeMiaixzVersionedValue(
        {
          storage: options.storage,
          scope: options.scope,
          kind: options.kind,
          schemaVersion: options.schemaVersion,
        },
        parsed,
      );
    }
    return parsed;
  } catch {
    safelyRemoveStorageValue(options.storage, key);
    return undefined;
  }
}

/**
 * Writes or removes one versioned value without affecting caller memory on persistence failure.
 *
 * @typeParam T - Persisted application value type.
 * @param options - Scope, target schema, and optional storage configuration.
 * @param value - Value to persist, or undefined to remove the physical key.
 * @throws MiaixzSdkError When scope, kind, or target schema is invalid.
 * @public
 */
export function writeMiaixzVersionedValue<T>(
  options: Readonly<Omit<MiaixzVersionedStorageOptions<T>, "migrations" | "parse">>,
  value: T | undefined,
): void {
  const key = createMiaixzStorageKey(options.scope, options.kind);
  validateTargetSchemaVersion(options.schemaVersion);
  if (!options.storage) return;
  if (value === undefined) {
    safelyRemoveStorageValue(options.storage, key);
    return;
  }
  try {
    const envelope: MiaixzVersionedValue<T> = {
      schemaVersion: options.schemaVersion,
      value,
    };
    options.storage.setItem(key, JSON.stringify(envelope));
  } catch {
    // Serialization and adapter failures intentionally degrade to non-persistence.
  }
}

/**
 * In-memory storage adapter suitable for tests, SSR, and isolated runtimes.
 *
 * @public
 */
export class MiaixzMemoryStorage implements MiaixzKeyValueStorage {
  readonly #values = new Map<string, string>();

  /**
   * Reads a value from memory.
   *
   * @param key - Storage key to read.
   * @returns Serialized value or null when the key is absent.
   */
  getItem(key: string): string | null {
    return this.#values.get(key) ?? null;
  }

  /**
   * Stores a value in memory.
   *
   * @param key - Storage key to write.
   * @param value - Serialized value to store.
   */
  setItem(key: string, value: string): void {
    this.#values.set(key, value);
  }

  /**
   * Removes one in-memory value.
   *
   * @param key - Storage key to remove.
   */
  removeItem(key: string): void {
    this.#values.delete(key);
  }

  /**
   * Removes every in-memory value.
   */
  clear(): void {
    this.#values.clear();
  }
}

/**
 * Prefixes storage keys so multiple services can safely share one backend.
 *
 * @public
 */
export class MiaixzNamespacedStorage implements MiaixzKeyValueStorage {
  /**
   * Underlying storage adapter receiving the namespaced keys.
   */
  readonly storage: MiaixzKeyValueStorage;

  /**
   * Prefix applied to every logical storage key.
   */
  readonly namespace: string;

  /**
   * Creates a namespaced storage adapter.
   *
   * @param storage - Underlying adapter.
   * @param namespace - Key prefix.
   */
  constructor(storage: MiaixzKeyValueStorage, namespace: string) {
    this.storage = storage;
    this.namespace = namespace;
  }

  /**
   * Builds the physical key used by the underlying adapter.
   *
   * @param key - Logical storage key.
   * @returns Namespaced physical storage key.
   */
  #key(key: string): string {
    return `${this.namespace}:${key}`;
  }

  /**
   * Reads a namespaced value.
   *
   * @param key - Logical storage key to read.
   * @returns Serialized value or null when the key is absent.
   */
  getItem(key: string): string | null {
    return this.storage.getItem(this.#key(key));
  }

  /**
   * Stores a namespaced value.
   *
   * @param key - Logical storage key to write.
   * @param value - Serialized value to store.
   */
  setItem(key: string, value: string): void {
    this.storage.setItem(this.#key(key), value);
  }

  /**
   * Removes a namespaced value.
   *
   * @param key - Logical storage key to remove.
   */
  removeItem(key: string): void {
    this.storage.removeItem(this.#key(key));
  }
}

/**
 * Safely obtains local or session storage when running in a browser.
 *
 * @param type - Browser storage area to obtain.
 * @returns `undefined` during SSR or when browser storage is blocked.
 * @public
 */
export function getMiaixzBrowserStorage(
  type: "local" | "session" = "local",
): MiaixzKeyValueStorage | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    return type === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return undefined;
  }
}

/**
 * Parses and optionally validates JSON stored by a key-value adapter.
 *
 * @param storage - Optional storage adapter to read.
 * @param key - Storage key containing JSON.
 * @param validate - Optional type guard for parsed data.
 * @returns Parsed and validated value when available.
 * @public
 */
export function readMiaixzJson<T>(
  storage: MiaixzKeyValueStorage | undefined,
  key: string,
  validate?: (value: unknown) => value is T,
): T | undefined {
  const serialized = storage?.getItem(key);
  if (!serialized) return undefined;
  try {
    const value: unknown = JSON.parse(serialized);
    return validate && !validate(value) ? undefined : (value as T);
  } catch {
    return undefined;
  }
}

/**
 * Serializes a value as JSON, or removes the key for `undefined`.
 *
 * @param storage - Optional storage adapter to update.
 * @param key - Storage key to write or remove.
 * @param value - Value to serialize, or undefined to remove the key.
 * @public
 */
export function writeMiaixzJson<T>(
  storage: MiaixzKeyValueStorage | undefined,
  key: string,
  value: T | undefined,
): void {
  if (!storage) return;
  if (value === undefined) storage.removeItem(key);
  else storage.setItem(key, JSON.stringify(value));
}
