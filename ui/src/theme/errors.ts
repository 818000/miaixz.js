import { MiaixzUiError } from "../errors/index.js";
import type { MiaixzThemeErrorCode } from "./theme.types.js";

const miaixzThemeErrorMessages: Readonly<Record<MiaixzThemeErrorCode, string>> = Object.freeze({
  UI_THEME_NOT_FOUND: "The requested theme was not found",
  UI_THEME_LOAD_FAILED: "The theme could not be loaded",
  UI_THEME_LOAD_ABORTED: "The theme load was cancelled",
  UI_THEME_INVALID: "The theme definition is invalid",
  UI_THEME_TOKEN_UNKNOWN: "The theme contains an unknown token",
  UI_THEME_TOKEN_MISSING: "The theme is missing a required token",
  UI_THEME_GEOMETRY_INVALID: "The theme geometry is invalid",
  UI_THEME_SURFACE_INVALID: "The theme surface mapping is invalid",
  UI_THEME_CONTRAST_INVALID: "The theme color contrast is insufficient",
  UI_THEME_INHERITANCE_INVALID: "The theme inheritance chain is invalid",
  UI_THEME_SCHEMA_UNSUPPORTED: "The theme schema version is unsupported",
  UI_THEME_DUPLICATE: "The theme identifier is already registered",
  UI_THEME_FALLBACK_INVALID: "The fallback theme is invalid",
  UI_THEME_GLOBAL_DUPLICATE: "Only one global Theme instance is allowed",
  UI_THEME_APPLY_FAILED: "The theme could not be applied",
  UI_THEME_PERSIST_FAILED: "The theme preference could not be persisted",
});

/**
 * Configures one structured theme runtime error.
 */
export interface MiaixzThemeErrorOptions {
  /**
   * Identifies the related theme without exposing its source data.
   */
  readonly theme?: string;
  /**
   * Supplies bounded diagnostic metadata.
   */
  readonly details?: unknown;
  /**
   * Supplies the original local failure.
   */
  readonly cause?: unknown;
}

/**
 * Represents a stable theme validation, loading, application, or persistence failure.
 *
 * @public
 */
export class MiaixzThemeError extends MiaixzUiError {
  /**
   * Contains the narrowed stable theme error code.
   */
  override readonly code: MiaixzThemeErrorCode;

  /**
   * Contains the sanitized related theme identifier when available.
   */
  readonly theme?: string;

  /**
   * Creates one structured theme error.
   *
   * @param code - Stable theme error code.
   * @param options - Optional safe theme, details, and cause metadata.
   */
  constructor(code: MiaixzThemeErrorCode, options: MiaixzThemeErrorOptions = {}) {
    const messageKey = themeErrorMessageKey(code);
    super(miaixzThemeErrorMessages[code], {
      code,
      messageKey,
      ...(options.details === undefined && options.theme === undefined
        ? {}
        : {
            details: {
              ...asDetails(options.details),
              ...(options.theme ? { theme: options.theme } : {}),
            },
          }),
      ...(options.cause === undefined ? {} : { cause: options.cause }),
    });
    this.name = "MiaixzThemeError";
    this.code = code;
    if (options.theme !== undefined) this.theme = options.theme;
  }
}

/**
 * Converts optional diagnostic data to a safe object merge boundary.
 *
 * @param details - Optional diagnostic value.
 * @returns Plain diagnostic record.
 */
function asDetails(details: unknown): Record<string, unknown> {
  return details !== null && typeof details === "object" && !Array.isArray(details)
    ? { ...(details as Record<string, unknown>) }
    : details === undefined
      ? {}
      : { value: details };
}

/**
 * Converts a theme error code to its fixed lower-camel message key.
 *
 * @param code - Stable theme error code.
 * @returns Registered theme message key.
 */
function themeErrorMessageKey(code: MiaixzThemeErrorCode): string {
  const words = code.slice("UI_THEME_".length).toLowerCase().split("_");
  const suffix = words
    .map((word, index) =>
      index === 0 ? word : `${word.slice(0, 1).toUpperCase()}${word.slice(1)}`,
    )
    .join("");
  return `ui.theme.${suffix}`;
}
