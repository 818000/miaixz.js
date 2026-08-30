import type { MiaixzTranslator } from "@miaixz/sdk/i18n";

const miaixzUiSensitiveDetailKeys = new Set([
  "accesstoken",
  "account",
  "address",
  "apikey",
  "authorization",
  "body",
  "content",
  "cookie",
  "csrf",
  "data",
  "email",
  "filecontent",
  "filename",
  "filepath",
  "fullname",
  "idcard",
  "key",
  "mobile",
  "name",
  "password",
  "phone",
  "proxyauthorization",
  "realname",
  "refreshtoken",
  "secret",
  "setcookie",
  "token",
  "user",
  "userid",
  "username",
  "xapikey",
  "xcsrftoken",
]);
const miaixzUiErrorMaximumDepth = 8;
const miaixzUiErrorMaximumCollectionSize = 100;
const miaixzUiErrorMaximumStringLength = 1_024;
const miaixzUiRedactedValue = "[REDACTED]";
const miaixzUiTruncatedValue = "[TRUNCATED]";
const miaixzUiCircularValue = "[CIRCULAR]";

/**
 * Describes a non-JSON diagnostic value without retaining its content.
 */
interface MiaixzUiErrorValueSummary {
  /**
   * Contains the safe runtime value category.
   */
  readonly type: string;

  /**
   * Contains the measurable byte size when it can be obtained without reading content.
   */
  readonly bytes?: number;
}

/**
 * Configures a stable UI runtime error.
 *
 * @public
 */
export interface MiaixzUiErrorOptions {
  /**
   * Supplies the stable machine-readable error code.
   */
  readonly code: string;

  /**
   * Supplies the stable translation key used for the public message.
   */
  readonly messageKey: string;

  /**
   * Supplies optional diagnostic metadata that will be bounded and sanitized.
   */
  readonly details?: unknown;

  /**
   * Supplies the original failure for local diagnostics.
   */
  readonly cause?: unknown;
}

/**
 * Reports whether an object is safe to traverse as inert JSON-like metadata.
 *
 * @param value - Object candidate to inspect.
 * @returns Whether the value is an object literal or null-prototype record.
 */
function isPlainUiErrorObject(value: object): value is Record<string, unknown> {
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

/**
 * Normalizes a detail key before comparing it with the sensitive-key registry.
 *
 * @param value - Detail key to normalize.
 * @returns Lowercase alphanumeric key without separators.
 */
function normalizeUiErrorDetailKey(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
}

/**
 * Truncates diagnostic strings by Unicode code point.
 *
 * @param value - Diagnostic string to constrain.
 * @returns Original string or a safely truncated representation.
 */
function truncateUiErrorString(value: string): string {
  const characters = [...value];
  if (characters.length <= miaixzUiErrorMaximumStringLength) return value;
  return `${characters.slice(0, miaixzUiErrorMaximumStringLength).join("")}${miaixzUiTruncatedValue}`;
}

/**
 * Creates a content-free summary for a non-JSON diagnostic value.
 *
 * @param value - Runtime value whose content must not be retained.
 * @returns Frozen type and optional byte-size metadata.
 */
function summarizeUiErrorValue(value: unknown): Readonly<MiaixzUiErrorValueSummary> {
  let type: string = typeof value;
  let bytes: number | undefined;
  if (typeof Blob !== "undefined" && value instanceof Blob) {
    type = typeof File !== "undefined" && value instanceof File ? "File" : "Blob";
    bytes = value.size;
  } else if (value instanceof ArrayBuffer) {
    type = "ArrayBuffer";
    bytes = value.byteLength;
  } else if (ArrayBuffer.isView(value)) {
    type = "TypedArray";
    bytes = value.byteLength;
  } else if (typeof FormData !== "undefined" && value instanceof FormData) {
    type = "FormData";
  } else if (typeof URLSearchParams !== "undefined" && value instanceof URLSearchParams) {
    type = "URLSearchParams";
    bytes = new TextEncoder().encode(value.toString()).byteLength;
  } else if (typeof ReadableStream !== "undefined" && value instanceof ReadableStream) {
    type = "ReadableStream";
  } else if (value !== null && typeof value === "object") {
    type = "Object";
  }
  return Object.freeze(bytes === undefined ? { type } : { type, bytes });
}

/**
 * Recursively creates bounded, immutable, getter-safe UI error details.
 *
 * @param value - Runtime value to sanitize.
 * @param depth - Current recursive depth.
 * @param ancestors - Objects in the active traversal path.
 * @returns Frozen metadata without recognized sensitive values or file content.
 */
function sanitizeUiErrorDetails(
  value: unknown,
  depth = 0,
  ancestors: ReadonlySet<object> = new Set(),
): unknown {
  if (typeof value === "string") return truncateUiErrorString(value);
  if (
    value === null ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "undefined"
  ) {
    return value;
  }
  if (typeof value !== "object") return summarizeUiErrorValue(value);
  if (ancestors.has(value)) return miaixzUiCircularValue;
  if (depth >= miaixzUiErrorMaximumDepth) return miaixzUiTruncatedValue;
  if (!Array.isArray(value) && !isPlainUiErrorObject(value)) {
    return summarizeUiErrorValue(value);
  }

  const nextAncestors = new Set(ancestors);
  nextAncestors.add(value);
  if (Array.isArray(value)) {
    const limit = Math.min(value.length, miaixzUiErrorMaximumCollectionSize);
    const result: unknown[] = [];
    for (let index = 0; index < limit; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
      result.push(
        descriptor && "value" in descriptor
          ? sanitizeUiErrorDetails(descriptor.value, depth + 1, nextAncestors)
          : miaixzUiTruncatedValue,
      );
    }
    if (value.length > miaixzUiErrorMaximumCollectionSize) {
      result[miaixzUiErrorMaximumCollectionSize - 1] = miaixzUiTruncatedValue;
    }
    return Object.freeze(result);
  }

  const result: Record<string, unknown> = {};
  const keys = Object.keys(value);
  const limit = Math.min(keys.length, miaixzUiErrorMaximumCollectionSize);
  for (let index = 0; index < limit; index += 1) {
    const key = keys[index];
    if (key === undefined) continue;
    if (miaixzUiSensitiveDetailKeys.has(normalizeUiErrorDetailKey(key))) {
      result[key] = miaixzUiRedactedValue;
      continue;
    }
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    result[key] =
      descriptor && "value" in descriptor
        ? sanitizeUiErrorDetails(descriptor.value, depth + 1, nextAncestors)
        : miaixzUiTruncatedValue;
  }
  if (keys.length > miaixzUiErrorMaximumCollectionSize) {
    const lastKey = keys[miaixzUiErrorMaximumCollectionSize - 1];
    if (lastKey !== undefined) result[lastKey] = miaixzUiTruncatedValue;
  }
  return Object.freeze(result);
}

/**
 * Error created by UI runtime contract validation.
 *
 * @public
 */
export class MiaixzUiError extends Error {
  /**
   * Contains the stable machine-readable error code.
   */
  readonly code: string;

  /**
   * Contains the stable translation key for the public message.
   */
  readonly messageKey: string;

  /**
   * Contains optional immutable and sanitized diagnostic metadata.
   */
  readonly details?: unknown;

  /**
   * Creates a stable localized UI error.
   *
   * @param message - Localized public message.
   * @param options - Stable error metadata and optional cause.
   */
  constructor(message: string, options: MiaixzUiErrorOptions) {
    const safeCause = options.cause instanceof Error ? options.cause : undefined;
    super(message, safeCause === undefined ? undefined : { cause: safeCause });
    this.name = "MiaixzUiError";
    this.code = options.code;
    this.messageKey = options.messageKey;
    if (options.details !== undefined) this.details = sanitizeUiErrorDetails(options.details);
  }
}

/**
 * Creates a UI error whose public message is resolved by the supplied translator.
 *
 * @param translate - Translator that resolves the registered message key.
 * @param options - Stable error metadata and optional cause.
 * @returns Localized UI runtime error.
 * @public
 */
export function createMiaixzUiError(
  translate: MiaixzTranslator,
  options: MiaixzUiErrorOptions,
): MiaixzUiError {
  return new MiaixzUiError(translate(options.messageKey), options);
}
