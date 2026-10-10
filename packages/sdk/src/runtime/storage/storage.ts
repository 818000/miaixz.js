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
 * Provides memory and browser storage adapters for serialized SDK state.
 */

import { MiaixzSdkError } from "../../errors/errors.js";
import type { MiaixzResponseParser } from "../../fabric/api/request.js";
import { VERSION } from "../../version.js";

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
  readonly schemaVersion: typeof VERSION;

  /**
   * Contains the persisted application value.
   */
  readonly value: T;
}

/**
 * Migrates a historical release or legacy numeric envelope toward VERSION.
 *
 * @public
 */
export interface MiaixzStorageMigration {
  /**
   * Identifies the source schema version.
   */
  readonly from: string;

  /**
   * Identifies the target release version.
   */
  readonly to: string;

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
  readonly schemaVersion: typeof VERSION;

  /**
   * Supplies deterministic migration paths that all terminate at VERSION.
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
  return new MiaixzSdkError({
    code: "STORAGE_SCOPE_INVALID",
  });
}

/**
 * Creates the fixed localized error for invalid schema or migration configuration.
 *
 * @returns Stable SDK migration-chain error.
 */
function createMigrationChainError(): MiaixzSdkError {
  return new MiaixzSdkError({ code: "STORAGE_MIGRATION_CHAIN_INVALID" });
}

/**
 * Reports whether a value is a canonical project release version.
 *
 * @param value - Version candidate to inspect.
 * @returns Whether the value follows VERSION's semantic-version format.
 */
function isReleaseVersion(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-(?:0|[1-9]\d*|[0-9]*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|[0-9]*[A-Za-z-][0-9A-Za-z-]*))*)?$/.test(
      value,
    )
  );
}

/**
 * Compares release versions using semantic-version precedence.
 *
 * @param left - Validated release version.
 * @param right - Validated release version.
 * @returns Negative, zero, or positive precedence.
 */
function compareReleaseVersions(left: string, right: string): number {
  const [leftCore = "", ...leftSuffix] = left.split("-");
  const [rightCore = "", ...rightSuffix] = right.split("-");
  const a = leftCore.split(".");
  const b = rightCore.split(".");
  for (let index = 0; index < 3; index++) {
    const x = BigInt(a[index] ?? "0");
    const y = BigInt(b[index] ?? "0");
    if (x !== y) return x < y ? -1 : 1;
  }
  if (!leftSuffix.length || !rightSuffix.length) {
    return leftSuffix.length === rightSuffix.length ? 0 : leftSuffix.length ? -1 : 1;
  }
  const ap = leftSuffix.join("-").split(".");
  const bp = rightSuffix.join("-").split(".");
  for (let index = 0; index < Math.max(ap.length, bp.length); index++) {
    const x = ap[index];
    const y = bp[index];
    if (x === undefined || y === undefined) return x === y ? 0 : x === undefined ? -1 : 1;
    if (x === y) continue;
    const nx = /^\d+$/.test(x);
    const ny = /^\d+$/.test(y);
    if (nx && ny) return BigInt(x) < BigInt(y) ? -1 : 1;
    if (nx !== ny) return nx ? -1 : 1;
    return x < y ? -1 : 1;
  }
  return 0;
}

/**
 * Serializes the storage version guard for inert first-paint scripts without DOM access.
 *
 * The returned expression uses the same release comparator as persistence reads. Legacy
 * numeric versions are read-only compatibility values, never current write targets.
 *
 * @returns Self-contained JavaScript predicate expression bound to VERSION.
 * @public
 */
export function createMiaixzStorageVersionPredicate(): string {
  return `((value) => { const isReleaseVersion = ${isReleaseVersion.toString()}; const compareReleaseVersions = ${compareReleaseVersions.toString()}; return value === 1 || value === 2 || (isReleaseVersion(value) && compareReleaseVersions(value, ${JSON.stringify(VERSION)}) <= 0); })`;
}

/**
 * Validates the sole current target version.
 *
 * @param schemaVersion - Target version to validate.
 * @throws MiaixzSdkError When the target does not match VERSION.
 */
function validateTargetSchemaVersion(schemaVersion: string): void {
  if (schemaVersion !== VERSION) {
    throw createMigrationChainError();
  }
}

/**
 * Validates non-branching forward migration paths terminating at VERSION.
 *
 * @param migrations - Optional migration chain to validate.
 * @throws MiaixzSdkError When a version is invalid, duplicated, or discontinuous.
 */
function validateMigrationChain(migrations: readonly MiaixzStorageMigration[] = []): void {
  const paths = new Map<string, MiaixzStorageMigration>();
  for (const migration of migrations) {
    if (
      !migration ||
      typeof migration !== "object" ||
      (migration.from !== "legacy" && !isReleaseVersion(migration.from)) ||
      !isReleaseVersion(migration.to) ||
      (migration.from !== "legacy" && compareReleaseVersions(migration.from, migration.to) >= 0) ||
      compareReleaseVersions(migration.to, VERSION) > 0 ||
      paths.has(migration.from) ||
      typeof migration.migrate !== "function"
    ) {
      throw createMigrationChainError();
    }
    paths.set(migration.from, migration);
  }
  for (const migration of paths.values()) {
    let target = migration.to;
    while (target !== VERSION) {
      const next = paths.get(target);
      if (!next) throw createMigrationChainError();
      target = next.to;
    }
  }
}

/**
 * Builds a collision-safe physical key for versioned Miaixz data.
 *
 * @param scope - Application and optional tenant persistence boundary.
 * @param kind - Fixed persisted data category.
 * @returns Stable physical storage key independent of release changes.
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
  return `miaixz:${scope.tenantId ?? "global"}:${scope.appId}:${kind}`;
}

/**
 * Reports whether parsed JSON uses the exact versioned-value envelope.
 *
 * @param value - Parsed JSON candidate to inspect.
 * @returns Whether the value contains exactly schemaVersion and value fields.
 */
function isVersionedEnvelope(value: unknown): value is { schemaVersion: unknown; value: unknown } {
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
    /**
     * Persistence failures never change the caller's in-memory state.
     */
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
  const legacyKey = key.replace(/^miaixz:/, "miaixz:v1:");
  let sourceKey = key;
  try {
    serialized = options.storage.getItem(key);
    if (serialized === null) {
      sourceKey = legacyKey;
      serialized = options.storage.getItem(legacyKey);
    }
  } catch {
    return undefined;
  }
  if (serialized === null) return undefined;
  let envelope: unknown;
  try {
    envelope = JSON.parse(serialized);
  } catch {
    safelyRemoveStorageValue(options.storage, sourceKey);
    return undefined;
  }
  try {
    if (!isVersionedEnvelope(envelope)) {
      safelyRemoveStorageValue(options.storage, sourceKey);
      return undefined;
    }
    const legacy = envelope.schemaVersion === 1 || envelope.schemaVersion === 2;
    if (!legacy && !isReleaseVersion(envelope.schemaVersion)) {
      safelyRemoveStorageValue(options.storage, sourceKey);
      return undefined;
    }
    if (!legacy && compareReleaseVersions(envelope.schemaVersion as string, VERSION) > 0) {
      return undefined;
    }
    let currentVersion = legacy ? "legacy" : (envelope.schemaVersion as string);
    let migratedValue: unknown = envelope.value;
    while (currentVersion !== VERSION) {
      const migration = options.migrations?.find((candidate) => candidate.from === currentVersion);
      if (!migration) {
        /**
         * Structurally compatible historical releases use the current parser.
         */
        break;
      }
      migratedValue = migration.migrate(migratedValue);
      currentVersion = migration.to;
    }
    const parsed = options.parse(migratedValue);
    if (envelope.schemaVersion !== VERSION || sourceKey !== key) {
      writeMiaixzVersionedValue(
        {
          storage: options.storage,
          scope: options.scope,
          kind: options.kind,
          schemaVersion: options.schemaVersion,
        },
        parsed,
      );
      const expected = JSON.stringify({ schemaVersion: VERSION, value: parsed });
      if (sourceKey !== key) {
        try {
          if (options.storage.getItem(key) === expected)
            safelyRemoveStorageValue(options.storage, sourceKey);
        } catch {
          /**
           * Failed confirmation preserves the legacy key and the parsed in-memory value.
           */
        }
      }
    }
    return parsed;
  } catch {
    /**
     * Keep incompatible historical data available for a subsequent explicit migration.
     */
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
    safelyRemoveStorageValue(options.storage, key.replace(/^miaixz:/, "miaixz:v1:"));
    return;
  }
  try {
    const envelope: MiaixzVersionedValue<T> = {
      schemaVersion: VERSION,
      value,
    };
    options.storage.setItem(key, JSON.stringify(envelope));
  } catch {
    /**
     * Serialization and adapter failures intentionally degrade to non-persistence.
     */
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
