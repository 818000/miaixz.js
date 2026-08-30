import { MiaixzSdkError } from "../api/errors.js";
import type { MiaixzEventBus, MiaixzSdkEventMap } from "../events/index.js";
import { translateMiaixzDefaultMessage } from "../i18n/default-translator.js";
import type { MiaixzTranslator } from "../i18n/index.js";
import {
  getMiaixzBrowserStorage,
  readMiaixzVersionedValue,
  writeMiaixzVersionedValue,
  type MiaixzKeyValueStorage,
  type MiaixzStorageMigration,
  type MiaixzStorageScope,
} from "../storage/index.js";
import {
  miaixzColorModes,
  miaixzDensities,
  miaixzThemeColorTokens,
  type MiaixzAppearancePayload,
  type MiaixzAppearanceSettings,
  type MiaixzColorMode,
  type MiaixzDensity,
  type MiaixzThemeColors,
  type MiaixzThemeColorToken,
} from "../types/index.js";

/**
 * Identifies the current appearance persistence and event schema.
 */
const miaixzAppearanceSchemaVersion = 1;

/**
 * Lists color tokens that may include an alpha channel.
 */
const miaixzAlphaThemeColorTokens = new Set<MiaixzThemeColorToken>([
  "backdrop",
  "shadow",
  "shadow-strong",
  "selection",
]);

/**
 * Lists the exact top-level keys accepted by appearance settings.
 */
const miaixzAppearanceKeys = new Set(["colorMode", "density", "colors"]);

/**
 * Lists all configurable color tokens for runtime membership checks.
 */
const miaixzThemeColorTokenSet = new Set<string>(miaixzThemeColorTokens);

/**
 * Lists foreground and background pairs that require normal-text contrast.
 */
const miaixzNormalContrastPairs = [
  ["text-primary", "background"],
  ["text-secondary", "background"],
  ["text-muted", "background"],
  ["on-brand", "brand"],
  ["success", "success-soft"],
  ["warning", "warning-soft"],
  ["danger", "danger-soft"],
  ["info", "info-soft"],
] as const satisfies readonly (readonly [MiaixzThemeColorToken, MiaixzThemeColorToken])[];

/**
 * Lists graphical-object pairs that require non-text contrast.
 */
const miaixzGraphicalContrastPairs = [
  ["focus", "background"],
  ["focus", "surface"],
  ["border-strong", "background"],
  ["border-strong", "surface"],
] as const satisfies readonly (readonly [MiaixzThemeColorToken, MiaixzThemeColorToken])[];

/**
 * Defines the complete built-in light theme used for validation and CSS mirroring.
 *
 * @public
 */
export const miaixzLightThemeColors: Readonly<Record<MiaixzThemeColorToken, string>> =
  Object.freeze({
    brand: "#58B832",
    "on-brand": "#10160D",
    background: "#F8FAF7",
    surface: "#FFFFFF",
    "surface-secondary": "#F3F6F1",
    "surface-hover": "#EEF3EB",
    "surface-active": "#E6EDE2",
    "surface-selected": "#EBF8E7",
    "text-primary": "#1D211B",
    "text-secondary": "#667061",
    "text-muted": "#6B7567",
    "text-disabled": "#9DA69A",
    "text-inverse": "#F8FAF7",
    border: "#DCE4D8",
    "border-strong": "#74806F",
    focus: "#3F8F22",
    success: "#267A39",
    "success-soft": "#EEF8F0",
    warning: "#8A5500",
    "warning-soft": "#FFF6E5",
    danger: "#B03030",
    "danger-soft": "#FCEEEE",
    info: "#2568B5",
    "info-soft": "#EDF5FD",
    backdrop: "#11180F7A",
    shadow: "#1D211B1A",
    "shadow-strong": "#1D211B2E",
    selection: "#E1F2DA",
  });

/**
 * Defines the complete built-in dark theme used for validation and CSS mirroring.
 *
 * @public
 */
export const miaixzDarkThemeColors: Readonly<Record<MiaixzThemeColorToken, string>> = Object.freeze(
  {
    brand: "#6BC548",
    "on-brand": "#10160D",
    background: "#121510",
    surface: "#191D17",
    "surface-secondary": "#20251E",
    "surface-hover": "#272D24",
    "surface-active": "#30372C",
    "surface-selected": "#233A1C",
    "text-primary": "#EDF1EB",
    "text-secondary": "#B6C0B2",
    "text-muted": "#929D8E",
    "text-disabled": "#6F796C",
    "text-inverse": "#161A14",
    border: "#343C31",
    "border-strong": "#697A64",
    focus: "#8ADB69",
    success: "#7AD18C",
    "success-soft": "#18321F",
    warning: "#E5B45F",
    "warning-soft": "#382A16",
    danger: "#F08A8A",
    "danger-soft": "#3A1F1F",
    info: "#8ABCF2",
    "info-soft": "#192C40",
    backdrop: "#000000A3",
    shadow: "#00000047",
    "shadow-strong": "#00000070",
    selection: "#294A20",
  },
);

/**
 * Defines the default Miaixz appearance settings.
 *
 * @public
 */
export const miaixzDefaultAppearance: Readonly<MiaixzAppearanceSettings> = Object.freeze({
  colorMode: "system",
  density: "standard",
});

/**
 * Configures a Miaixz appearance manager.
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
   * Supplies complete settings merged over persisted settings at construction.
   */
  readonly initialAppearance?: MiaixzAppearanceSettings;

  /**
   * Supplies an optional versioned persistence adapter.
   */
  readonly storage?: MiaixzKeyValueStorage;

  /**
   * Supplies an optional continuous appearance migration chain.
   */
  readonly migrations?: readonly MiaixzStorageMigration[];

  /**
   * Supplies an optional event bus for local or cross-service synchronization.
   */
  readonly events?: MiaixzEventBus<MiaixzSdkEventMap>;

  /**
   * Supplies the translator used for appearance validation errors.
   */
  readonly translate?: MiaixzTranslator;
}

/**
 * Determines whether a value is a supported Miaixz color mode.
 *
 * @param value - Value to inspect.
 * @returns Whether the value is a supported color mode.
 * @public
 */
export function isMiaixzColorMode(value: unknown): value is MiaixzColorMode {
  return typeof value === "string" && miaixzColorModes.includes(value as MiaixzColorMode);
}

/**
 * Determines whether a value is a supported Miaixz density.
 *
 * @param value - Value to inspect.
 * @returns Whether the value is a supported density.
 * @public
 */
export function isMiaixzDensity(value: unknown): value is MiaixzDensity {
  return typeof value === "string" && miaixzDensities.includes(value as MiaixzDensity);
}

/**
 * Parses, normalizes, validates, and freezes appearance settings.
 *
 * @param value - Untrusted appearance settings to parse.
 * @returns A deeply frozen settings snapshot with uppercase custom colors.
 * @throws MiaixzSdkError When object shape, values, colors, or contrast are invalid.
 * @public
 */
export function parseMiaixzAppearanceSettings(value: unknown): MiaixzAppearanceSettings {
  return parseAppearanceSettings(value, translateMiaixzDefaultMessage);
}

/**
 * Determines whether a value satisfies the complete appearance contract.
 *
 * @param value - Untrusted appearance settings to inspect.
 * @returns Whether parsing and contrast validation both succeed.
 * @public
 */
export function isMiaixzAppearanceSettings(value: unknown): value is MiaixzAppearanceSettings {
  try {
    parseMiaixzAppearanceSettings(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates all frozen WCAG contrast pairs for an appearance.
 *
 * @param appearance - Appearance settings whose merged themes are validated.
 * @throws MiaixzSdkError When a custom color is invalid or a pair misses its threshold.
 * @public
 */
export function validateMiaixzThemeContrast(appearance: Readonly<MiaixzAppearanceSettings>): void {
  const normalized = normalizeAppearanceSettings(appearance, translateMiaixzDefaultMessage);
  validateNormalizedThemeContrast(normalized, translateMiaixzDefaultMessage);
}

/**
 * Manages versioned, tenant-scoped appearance state without accessing the DOM.
 *
 * @public
 */
export class MiaixzAppearanceManager {
  readonly #appId: string;
  readonly #storage: MiaixzKeyValueStorage | undefined;
  readonly #migrations: readonly MiaixzStorageMigration[] | undefined;
  readonly #events: MiaixzEventBus<MiaixzSdkEventMap> | undefined;
  readonly #translate: MiaixzTranslator;
  readonly #listeners = new Set<(appearance: Readonly<MiaixzAppearanceSettings>) => void>();
  #tenantId: string | undefined;
  #appearance: MiaixzAppearanceSettings;
  #stopEventListener: (() => void) | undefined;
  #destroyed = false;
  #publishingEvent = false;

  /**
   * Creates a validated appearance manager for one application and tenant scope.
   *
   * @param options - Required application identity and optional runtime adapters.
   * @throws MiaixzSdkError When scope, migrations, initial settings, or contrast are invalid.
   */
  constructor(options: Readonly<MiaixzAppearanceManagerOptions>) {
    this.#appId = options.appId;
    this.#tenantId = options.tenantId;
    this.#storage = options.storage ?? getMiaixzBrowserStorage();
    this.#migrations = options.migrations;
    this.#events = options.events;
    this.#translate = options.translate ?? translateMiaixzDefaultMessage;

    const scope = this.#createScope(this.#tenantId);
    this.#validateStorageConfiguration(scope);
    const initial =
      options.initialAppearance === undefined
        ? undefined
        : parseAppearanceSettings(options.initialAppearance, this.#translate);
    const persisted = this.#read(scope);
    this.#appearance = parseAppearanceSettings(
      {
        ...miaixzDefaultAppearance,
        ...persisted,
        ...initial,
      },
      this.#translate,
    );
    this.#stopEventListener = this.#events?.on("appearance:changed", (payload) => {
      if (this.#publishingEvent) return;
      const appearance = parseAppearancePayload(payload, this.#translate);
      if (appearance !== undefined) this.#commit(appearance, false);
    });
  }

  /**
   * Returns the current deeply frozen appearance snapshot.
   *
   * @returns Current normalized appearance settings.
   */
  getSnapshot(): Readonly<MiaixzAppearanceSettings> {
    return this.#appearance;
  }

  /**
   * Replaces the complete appearance after atomic validation.
   *
   * @param appearance - Complete appearance settings to commit.
   * @throws MiaixzSdkError When settings, colors, or contrast are invalid.
   */
  set(appearance: MiaixzAppearanceSettings): void {
    this.#commit(parseAppearanceSettings(appearance, this.#translate), true);
  }

  /**
   * Shallowly merges and commits a partial appearance update.
   *
   * @param appearance - Top-level settings fields to replace.
   * @throws MiaixzSdkError When merged settings, colors, or contrast are invalid.
   */
  patch(appearance: Partial<MiaixzAppearanceSettings>): void {
    this.set({ ...this.#appearance, ...appearance });
  }

  /**
   * Reloads appearance state from a new validated tenant scope.
   *
   * @param tenantId - Optional tenant identifier, or undefined for global scope.
   * @throws MiaixzSdkError When the new scope or migration configuration is invalid.
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
   * Registers a listener for committed appearance snapshots.
   *
   * @param listener - Callback invoked synchronously after each committed change.
   * @returns An idempotent function that removes the listener.
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
   * Releases the event subscription and all local appearance listeners.
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
   * Validates scope, schema, and migrations before reading physical storage.
   *
   * @param scope - Candidate appearance persistence scope.
   * @throws MiaixzSdkError When scope or migrations are invalid.
   */
  #validateStorageConfiguration(scope: Readonly<MiaixzStorageScope>): void {
    readMiaixzVersionedValue({
      scope,
      kind: "appearance",
      schemaVersion: miaixzAppearanceSchemaVersion,
      ...(this.#migrations === undefined ? {} : { migrations: this.#migrations }),
      parse: (value) => parseAppearanceSettings(value, this.#translate),
    });
  }

  /**
   * Reads and normalizes one tenant-scoped appearance value.
   *
   * @param scope - Validated appearance persistence scope.
   * @returns Persisted normalized appearance, or undefined when absent or unusable.
   */
  #read(scope: Readonly<MiaixzStorageScope>): MiaixzAppearanceSettings | undefined {
    return readMiaixzVersionedValue({
      ...(this.#storage === undefined ? {} : { storage: this.#storage }),
      scope,
      kind: "appearance",
      schemaVersion: miaixzAppearanceSchemaVersion,
      ...(this.#migrations === undefined ? {} : { migrations: this.#migrations }),
      parse: (value) => parseAppearanceSettings(value, this.#translate),
    });
  }

  /**
   * Commits one already-normalized appearance and optionally broadcasts it.
   *
   * @param appearance - Deeply frozen settings to commit.
   * @param broadcast - Whether to emit the versioned appearance event.
   */
  #commit(appearance: MiaixzAppearanceSettings, broadcast: boolean): void {
    this.#appearance = appearance;
    const scope = this.#createScope(this.#tenantId);
    writeMiaixzVersionedValue(
      {
        ...(this.#storage === undefined ? {} : { storage: this.#storage }),
        scope,
        kind: "appearance",
        schemaVersion: miaixzAppearanceSchemaVersion,
      },
      appearance,
    );
    this.#notify();
    if (broadcast) {
      const payload: MiaixzAppearancePayload = Object.freeze({
        schemaVersion: miaixzAppearanceSchemaVersion,
        value: appearance,
      });
      this.#publishingEvent = true;
      try {
        this.#events?.emit("appearance:changed", payload);
      } finally {
        this.#publishingEvent = false;
      }
    }
  }

  /**
   * Delivers the current immutable snapshot to all local listeners.
   */
  #notify(): void {
    for (const listener of this.#listeners) listener(this.#appearance);
  }
}

/**
 * Creates a tenant-aware appearance manager without DOM side effects.
 *
 * @param options - Required application identity and optional runtime adapters.
 * @returns Configured appearance manager.
 * @throws MiaixzSdkError When scope, migrations, initial settings, or contrast are invalid.
 * @public
 */
export function createMiaixzAppearanceManager(
  options: Readonly<MiaixzAppearanceManagerOptions>,
): MiaixzAppearanceManager {
  return new MiaixzAppearanceManager(options);
}

/**
 * Parses appearance settings using the supplied translator.
 *
 * @param value - Untrusted appearance settings.
 * @param translate - Translator used for validation errors.
 * @returns Deeply frozen normalized settings.
 * @throws MiaixzSdkError When syntax, colors, or contrast are invalid.
 */
function parseAppearanceSettings(
  value: unknown,
  translate: MiaixzTranslator,
): MiaixzAppearanceSettings {
  const normalized = normalizeAppearanceSettings(value, translate);
  validateNormalizedThemeContrast(normalized, translate);
  return normalized;
}

/**
 * Parses a versioned event payload without surfacing untrusted event failures.
 *
 * @param value - Untrusted event payload.
 * @param translate - Translator used internally by the parser.
 * @returns Normalized settings, or undefined when the payload is invalid.
 */
function parseAppearancePayload(
  value: unknown,
  translate: MiaixzTranslator,
): MiaixzAppearanceSettings | undefined {
  const record = readPlainDataObject(value);
  if (!record || !hasExactKeys(record, ["schemaVersion", "value"])) return undefined;
  if (record.schemaVersion !== miaixzAppearanceSchemaVersion) return undefined;
  try {
    return parseAppearanceSettings(record.value, translate);
  } catch {
    return undefined;
  }
}

/**
 * Normalizes appearance structure and custom color syntax.
 *
 * @param value - Untrusted appearance settings.
 * @param translate - Translator used for syntax errors.
 * @returns Deeply frozen normalized settings without contrast evaluation.
 * @throws MiaixzSdkError When object shape, values, tokens, or color syntax are invalid.
 */
function normalizeAppearanceSettings(
  value: unknown,
  translate: MiaixzTranslator,
): MiaixzAppearanceSettings {
  const record = readPlainDataObject(value);
  if (
    !record ||
    !Object.keys(record).every((key) => miaixzAppearanceKeys.has(key)) ||
    !Object.hasOwn(record, "colorMode") ||
    !Object.hasOwn(record, "density") ||
    !isMiaixzColorMode(record.colorMode) ||
    !isMiaixzDensity(record.density)
  ) {
    throw createAppearanceColorError(translate);
  }

  let colors: MiaixzThemeColors | undefined;
  if (Object.hasOwn(record, "colors")) {
    const colorRecord = readPlainDataObject(record.colors);
    if (!colorRecord) throw createAppearanceColorError(translate);
    const normalizedColors: Partial<Record<MiaixzThemeColorToken, string>> = {};
    for (const [token, color] of Object.entries(colorRecord)) {
      if (
        !miaixzThemeColorTokenSet.has(token) ||
        typeof color !== "string" ||
        !isValidThemeHex(token as MiaixzThemeColorToken, color)
      ) {
        throw createAppearanceColorError(translate, { token });
      }
      normalizedColors[token as MiaixzThemeColorToken] = color.toUpperCase();
    }
    colors = Object.freeze(normalizedColors);
  }

  return Object.freeze({
    colorMode: record.colorMode,
    density: record.density,
    ...(colors === undefined ? {} : { colors }),
  });
}

/**
 * Validates contrast against every applicable built-in theme.
 *
 * @param appearance - Normalized settings to validate.
 * @param translate - Translator used for contrast errors.
 * @throws MiaixzSdkError When any frozen contrast pair misses its threshold.
 */
function validateNormalizedThemeContrast(
  appearance: Readonly<MiaixzAppearanceSettings>,
  translate: MiaixzTranslator,
): void {
  const themes =
    appearance.colorMode === "light"
      ? [["light", miaixzLightThemeColors] as const]
      : appearance.colorMode === "dark"
        ? [["dark", miaixzDarkThemeColors] as const]
        : ([
            ["light", miaixzLightThemeColors],
            ["dark", miaixzDarkThemeColors],
          ] as const);

  for (const [mode, defaults] of themes) {
    const colors = { ...defaults, ...appearance.colors };
    assertContrastPairs(colors, miaixzNormalContrastPairs, 4.5, mode, translate);
    assertContrastPairs(colors, miaixzGraphicalContrastPairs, 3, mode, translate);
  }
}

/**
 * Validates a collection of contrast pairs against one threshold.
 *
 * @param colors - Complete merged theme color map.
 * @param pairs - Foreground and background token pairs.
 * @param minimum - Minimum accepted WCAG contrast ratio.
 * @param mode - Theme mode used for safe diagnostic details.
 * @param translate - Translator used for contrast errors.
 * @throws MiaixzSdkError When a pair misses the minimum ratio.
 */
function assertContrastPairs(
  colors: Readonly<Record<MiaixzThemeColorToken, string>>,
  pairs: readonly (readonly [MiaixzThemeColorToken, MiaixzThemeColorToken])[],
  minimum: number,
  mode: "light" | "dark",
  translate: MiaixzTranslator,
): void {
  for (const [foreground, background] of pairs) {
    const ratio = calculateContrastRatio(colors[foreground], colors[background]);
    if (ratio < minimum) {
      throw createAppearanceContrastError(translate, {
        mode,
        foreground,
        background,
        minimum,
        ratio: Number(ratio.toFixed(2)),
      });
    }
  }
}

/**
 * Calculates the WCAG contrast ratio between two opaque hexadecimal colors.
 *
 * @param foreground - Foreground color in hexadecimal notation.
 * @param background - Background color in hexadecimal notation.
 * @returns Contrast ratio from one through twenty-one.
 */
function calculateContrastRatio(foreground: string, background: string): number {
  const foregroundLuminance = calculateRelativeLuminance(foreground);
  const backgroundLuminance = calculateRelativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Calculates WCAG relative luminance for an opaque hexadecimal color.
 *
 * @param color - Six-digit hexadecimal color.
 * @returns Relative luminance from zero through one.
 */
function calculateRelativeLuminance(color: string): number {
  const channels = [color.slice(1, 3), color.slice(3, 5), color.slice(5, 7)].map((channel) => {
    const value = Number.parseInt(channel, 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * (channels[0] ?? 0) + 0.7152 * (channels[1] ?? 0) + 0.0722 * (channels[2] ?? 0);
}

/**
 * Determines whether a custom token uses its permitted hexadecimal syntax.
 *
 * @param token - Theme token receiving the value.
 * @param value - Color value to inspect.
 * @returns Whether the color has the exact permitted length and character set.
 */
function isValidThemeHex(token: MiaixzThemeColorToken, value: string): boolean {
  if (/^#[0-9A-Fa-f]{6}$/.test(value)) return true;
  return miaixzAlphaThemeColorTokens.has(token) && /^#[0-9A-Fa-f]{8}$/.test(value);
}

/**
 * Reads an object without invoking accessors or accepting exotic prototypes.
 *
 * @param value - Runtime value to inspect.
 * @returns A plain data record, or undefined when the value is unsafe.
 */
function readPlainDataObject(value: unknown): Record<string, unknown> | undefined {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return undefined;
  try {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) return undefined;
    const descriptors = Object.getOwnPropertyDescriptors(value);
    const record: Record<string, unknown> = {};
    for (const key of Object.keys(descriptors)) {
      const descriptor = descriptors[key];
      if (!descriptor?.enumerable) continue;
      if (!("value" in descriptor)) return undefined;
      record[key] = descriptor.value;
    }
    return record;
  } catch {
    return undefined;
  }
}

/**
 * Determines whether a record has exactly the supplied enumerable keys.
 *
 * @param record - Plain data record to inspect.
 * @param expected - Exact key set required by the contract.
 * @returns Whether every and only expected key is present.
 */
function hasExactKeys(
  record: Readonly<Record<string, unknown>>,
  expected: readonly string[],
): boolean {
  const keys = Object.keys(record);
  return keys.length === expected.length && expected.every((key) => Object.hasOwn(record, key));
}

/**
 * Creates a localized appearance syntax or color error.
 *
 * @param translate - Translator used to resolve the public message.
 * @param details - Optional safe token diagnostics.
 * @returns Stable SDK color-validation error.
 */
function createAppearanceColorError(
  translate: MiaixzTranslator,
  details?: Readonly<{
    /**
     * Identifies the rejected theme token.
     */
    token: string;
  }>,
): MiaixzSdkError {
  return new MiaixzSdkError(translate("sdk.error.appearance.colorInvalid"), {
    code: "APPEARANCE_COLOR_INVALID",
    ...(details === undefined ? {} : { details }),
  });
}

/**
 * Creates a localized appearance contrast error.
 *
 * @param translate - Translator used to resolve the public message.
 * @param details - Safe theme and ratio diagnostics.
 * @returns Stable SDK contrast-validation error.
 */
function createAppearanceContrastError(
  translate: MiaixzTranslator,
  details: Readonly<{
    /**
     * Identifies the theme mode that failed validation.
     */
    mode: "light" | "dark";
    /**
     * Identifies the foreground token in the failed pair.
     */
    foreground: MiaixzThemeColorToken;
    /**
     * Identifies the background token in the failed pair.
     */
    background: MiaixzThemeColorToken;
    /**
     * Identifies the minimum required contrast ratio.
     */
    minimum: number;
    /**
     * Contains the measured contrast ratio.
     */
    ratio: number;
  }>,
): MiaixzSdkError {
  return new MiaixzSdkError(translate("sdk.error.appearance.contrastInvalid"), {
    code: "APPEARANCE_CONTRAST_INVALID",
    details: Object.freeze({ ...details }),
  });
}
