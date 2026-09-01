import { MiaixzSdkError } from "../api/errors.js";
import type { MiaixzEventBus, MiaixzSdkEventMap } from "../events/index.js";
import { translateMiaixzDefaultMessage } from "../i18n/default-translator.js";
import type { MiaixzTranslator } from "../i18n/index.js";
import {
  createMiaixzStorageKey,
  getMiaixzBrowserStorage,
  readMiaixzVersionedValue,
  type MiaixzKeyValueStorage,
  type MiaixzStorageMigration,
  type MiaixzStorageScope,
} from "../storage/index.js";
import type {
  MiaixzAppearancePayload,
  MiaixzAppearanceSettings,
  MiaixzColorMode,
  MiaixzDensity,
  MiaixzThemeOverrides,
} from "../types/index.js";
import { miaixzAppearanceMigrationV1ToV2 } from "./migration.js";
import {
  miaixzDefaultAppearance,
  parseMiaixzAppearanceSettingsWithTranslator,
} from "./validation.js";

/**
 * Identifies the current Appearance persistence and event schema.
 *
 * @public
 */
export const miaixzAppearanceSchemaVersion = 2 as const;

/**
 * Configures a Miaixz Appearance manager.
 *
 * @public
 */
export interface MiaixzAppearanceManagerOptions {
  /**
   * Identifies the consuming frontend application.
   */
  readonly appId: string;

  /**
   * Identifies the optional initial tenant persistence boundary.
   */
  readonly tenantId?: string;

  /**
   * Supplies complete settings that override restored persistence at construction.
   */
  readonly initialAppearance?: MiaixzAppearanceSettings;

  /**
   * Supplies an optional versioned persistence adapter.
   */
  readonly storage?: MiaixzKeyValueStorage;

  /**
   * Supplies optional migrations that precede the built-in v1-to-v2 migration.
   */
  readonly migrations?: readonly MiaixzStorageMigration[];

  /**
   * Supplies an optional event bus for local or cross-context synchronization.
   */
  readonly events?: MiaixzEventBus<MiaixzSdkEventMap>;

  /**
   * Supplies the translator used for Appearance failures.
   */
  readonly translate?: MiaixzTranslator;
}

/**
 * Manages synchronous, versioned, tenant-scoped Appearance state without DOM access.
 *
 * @public
 */
export class MiaixzAppearanceManager {
  readonly #appId: string;
  readonly #storage: MiaixzKeyValueStorage | undefined;
  readonly #migrations: readonly MiaixzStorageMigration[];
  readonly #events: MiaixzEventBus<MiaixzSdkEventMap> | undefined;
  readonly #translate: MiaixzTranslator;
  readonly #listeners = new Set<(appearance: Readonly<MiaixzAppearanceSettings>) => void>();
  #tenantId: string | undefined;
  #appearance: MiaixzAppearanceSettings;
  #stopEventListener: (() => void) | undefined;
  #destroyed = false;
  #publishingEvent = false;

  /**
   * Creates one validated Appearance manager.
   *
   * @param options - Application identity and optional runtime adapters.
   * @throws MiaixzSdkError When scope, migrations, initial settings, or storage are invalid.
   */
  constructor(options: Readonly<MiaixzAppearanceManagerOptions>) {
    this.#appId = options.appId;
    this.#tenantId = options.tenantId;
    this.#storage = options.storage ?? getMiaixzBrowserStorage();
    this.#migrations = Object.freeze([
      ...(options.migrations ?? []),
      miaixzAppearanceMigrationV1ToV2,
    ]);
    this.#events = options.events;
    this.#translate = options.translate ?? translateMiaixzDefaultMessage;

    const scope = this.#createScope(this.#tenantId);
    this.#validateStorageConfiguration(scope);
    const persisted = this.#read(scope);
    this.#appearance =
      options.initialAppearance === undefined
        ? (persisted ?? miaixzDefaultAppearance)
        : parseMiaixzAppearanceSettingsWithTranslator(options.initialAppearance, this.#translate);
    this.#stopEventListener = this.#events?.on("appearance:changed", (payload) => {
      if (this.#publishingEvent) return;
      try {
        const appearance = this.#parsePayload(payload);
        if (appearance !== undefined) this.#commit(appearance, false);
      } catch {
        // Invalid external events and local adapter failures never escape the event boundary.
      }
    });
  }

  /**
   * Returns the current deeply frozen Appearance snapshot.
   *
   * @returns Current normalized settings.
   */
  getSnapshot(): Readonly<MiaixzAppearanceSettings> {
    return this.#appearance;
  }

  /**
   * Replaces the complete Appearance snapshot transactionally.
   *
   * @param appearance - Complete settings to commit.
   * @throws MiaixzSdkError When validation or persistence fails.
   */
  set(appearance: MiaixzAppearanceSettings): void {
    this.#commit(parseMiaixzAppearanceSettingsWithTranslator(appearance, this.#translate), true);
  }

  /**
   * Shallowly merges and commits top-level Appearance fields.
   *
   * Passing `overrides` replaces the complete previous override object.
   *
   * @param appearance - Top-level settings fields to replace.
   * @throws MiaixzSdkError When validation or persistence fails.
   */
  patch(appearance: Partial<MiaixzAppearanceSettings>): void {
    const next = { ...this.#appearance, ...appearance };
    if (Object.hasOwn(appearance, "overrides") && appearance.overrides === undefined) {
      delete next.overrides;
    }
    this.set(next);
  }

  /**
   * Commits a new theme identifier.
   *
   * @param theme - Valid theme identifier.
   * @throws MiaixzSdkError When validation or persistence fails.
   */
  setTheme(theme: string): void {
    this.patch({ theme });
  }

  /**
   * Commits a light, dark, or system color-mode preference.
   *
   * @param colorMode - Color-mode preference.
   * @throws MiaixzSdkError When validation or persistence fails.
   */
  setColorMode(colorMode: MiaixzColorMode): void {
    this.patch({ colorMode });
  }

  /**
   * Commits an interface density preference.
   *
   * @param density - Density preference.
   * @throws MiaixzSdkError When validation or persistence fails.
   */
  setDensity(density: MiaixzDensity): void {
    this.patch({ density });
  }

  /**
   * Replaces or removes all mode-specific color overrides.
   *
   * @param overrides - Complete override object, or undefined to remove overrides.
   * @throws MiaixzSdkError When validation or persistence fails.
   */
  setOverrides(overrides?: MiaixzThemeOverrides): void {
    if (overrides === undefined) {
      this.set({
        theme: this.#appearance.theme,
        colorMode: this.#appearance.colorMode,
        density: this.#appearance.density,
      });
      return;
    }
    this.patch({ overrides });
  }

  /**
   * Restores the default Appearance snapshot within the current scope.
   *
   * @throws MiaixzSdkError When persistence fails.
   */
  reset(): void {
    this.set(miaixzDefaultAppearance);
  }

  /**
   * Reloads Appearance state from another validated tenant scope.
   *
   * @param tenantId - Optional tenant identifier, or undefined for global scope.
   * @throws MiaixzSdkError When the scope or migration chain is invalid.
   */
  setScope(tenantId?: string): void {
    const scope = this.#createScope(tenantId);
    this.#validateStorageConfiguration(scope);
    const appearance = this.#read(scope) ?? miaixzDefaultAppearance;
    this.#tenantId = tenantId;
    this.#appearance = appearance;
    this.#notify();
  }

  /**
   * Registers a synchronous listener for committed snapshots.
   *
   * @param listener - Callback invoked after each successful commit.
   * @returns Idempotent unsubscribe function.
   */
  subscribe(listener: (appearance: Readonly<MiaixzAppearanceSettings>) => void): () => void {
    this.#listeners.add(listener);
    let subscribed = true;
    return () => {
      if (!subscribed) return;
      subscribed = false;
      this.#listeners.delete(listener);
    };
  }

  /**
   * Releases the event subscription and all local listeners.
   */
  destroy(): void {
    if (this.#destroyed) return;
    this.#destroyed = true;
    this.#stopEventListener?.();
    this.#stopEventListener = undefined;
    this.#listeners.clear();
  }

  /**
   * Creates the current versioned-storage scope.
   *
   * @param tenantId - Optional tenant identifier.
   * @returns Application and tenant storage scope.
   */
  #createScope(tenantId: string | undefined): MiaixzStorageScope {
    return tenantId === undefined ? { appId: this.#appId } : { appId: this.#appId, tenantId };
  }

  /**
   * Validates scope and the continuous migration chain before physical access.
   *
   * @param scope - Candidate persistence scope.
   * @throws MiaixzSdkError When scope or migrations are invalid.
   */
  #validateStorageConfiguration(scope: Readonly<MiaixzStorageScope>): void {
    readMiaixzVersionedValue({
      scope,
      kind: "appearance",
      schemaVersion: miaixzAppearanceSchemaVersion,
      migrations: this.#migrations,
      parse: (value) => parseMiaixzAppearanceSettingsWithTranslator(value, this.#translate),
    });
  }

  /**
   * Reads and normalizes one scoped persisted snapshot.
   *
   * @param scope - Validated persistence scope.
   * @returns Normalized settings, or undefined when absent or unusable.
   */
  #read(scope: Readonly<MiaixzStorageScope>): MiaixzAppearanceSettings | undefined {
    return readMiaixzVersionedValue({
      ...(this.#storage === undefined ? {} : { storage: this.#storage }),
      scope,
      kind: "appearance",
      schemaVersion: miaixzAppearanceSchemaVersion,
      migrations: this.#migrations,
      parse: (value) => parseMiaixzAppearanceSettingsWithTranslator(value, this.#translate),
    });
  }

  /**
   * Parses a complete v2 event payload without surfacing untrusted failures.
   *
   * @param value - Untrusted event payload.
   * @returns Normalized settings, or undefined for an invalid payload.
   */
  #parsePayload(value: unknown): MiaixzAppearanceSettings | undefined {
    if (value === null || typeof value !== "object" || Array.isArray(value)) return undefined;
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record);
    if (
      keys.length !== 2 ||
      !Object.hasOwn(record, "schemaVersion") ||
      !Object.hasOwn(record, "value") ||
      record.schemaVersion !== miaixzAppearanceSchemaVersion
    ) {
      return undefined;
    }
    try {
      return parseMiaixzAppearanceSettingsWithTranslator(record.value, this.#translate);
    } catch {
      return undefined;
    }
  }

  /**
   * Persists then commits one already-normalized snapshot.
   *
   * @param appearance - Deeply frozen settings to commit.
   * @param broadcast - Whether to publish a complete v2 event payload.
   * @throws MiaixzSdkError When persistence fails before the in-memory commit.
   */
  #commit(appearance: MiaixzAppearanceSettings, broadcast: boolean): void {
    this.#persist(appearance);
    this.#appearance = appearance;
    this.#notify();
    if (!broadcast) return;
    const payload: MiaixzAppearancePayload = Object.freeze({
      schemaVersion: miaixzAppearanceSchemaVersion,
      value: appearance,
    });
    this.#publishingEvent = true;
    try {
      this.#events?.emit("appearance:changed", payload);
    } catch {
      // The committed transaction is not rolled back by observer or transport failures.
    } finally {
      this.#publishingEvent = false;
    }
  }

  /**
   * Performs the single atomic storage write before mutating manager memory.
   *
   * @param appearance - Normalized settings to serialize.
   * @throws MiaixzSdkError When serialization or the adapter write fails.
   */
  #persist(appearance: MiaixzAppearanceSettings): void {
    if (this.#storage === undefined) return;
    const key = createMiaixzStorageKey(this.#createScope(this.#tenantId), "appearance");
    try {
      const payload: MiaixzAppearancePayload = {
        schemaVersion: miaixzAppearanceSchemaVersion,
        value: appearance,
      };
      this.#storage.setItem(key, JSON.stringify(payload));
    } catch (cause) {
      throw new MiaixzSdkError(this.#translate("sdk.error.appearance.invalid"), {
        code: "APPEARANCE_PERSIST_FAILED",
        cause,
      });
    }
  }

  /**
   * Delivers the current snapshot while isolating every listener failure.
   */
  #notify(): void {
    for (const listener of this.#listeners) {
      try {
        listener(this.#appearance);
      } catch {
        // One consumer cannot prevent delivery to later consumers.
      }
    }
  }
}

/**
 * Creates a tenant-aware Appearance manager without DOM side effects.
 *
 * @param options - Application identity and optional runtime adapters.
 * @returns Configured Appearance manager.
 * @throws MiaixzSdkError When configuration or persisted data is invalid.
 * @public
 */
export function createMiaixzAppearanceManager(
  options: Readonly<MiaixzAppearanceManagerOptions>,
): MiaixzAppearanceManager {
  return new MiaixzAppearanceManager(options);
}
