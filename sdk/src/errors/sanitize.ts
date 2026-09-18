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

const sensitiveKeys = new Set([
  "accesstoken",
  "apikey",
  "authorization",
  "body",
  "content",
  "cookie",
  "csrf",
  "data",
  "email",
  "filecontent",
  "password",
  "refreshtoken",
  "secret",
  "setcookie",
  "token",
  "user",
  "userid",
]);
const maximumDepth = 8;
const maximumCollectionSize = 100;
const maximumStringLength = 1_024;

/**
 * Normalizes a diagnostic key before matching it against the redaction set.
 *
 * @param value - Diagnostic key.
 * @returns Lowercase alphanumeric key.
 */
function normalizeKey(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
}

/**
 * Reports whether an object can be traversed without invoking custom behavior.
 *
 * @param value - Object candidate.
 * @returns Whether the object is a plain record.
 */
function isPlainObject(value: object): value is Record<string, unknown> {
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

/**
 * Recursively sanitizes one diagnostic value.
 *
 * @param value - Diagnostic value.
 * @param depth - Current traversal depth.
 * @param seen - Objects already visited in this branch.
 * @returns A bounded immutable diagnostic representation.
 */
function sanitize(value: unknown, depth: number, seen: WeakSet<object>): unknown {
  if (value === null || typeof value === "boolean" || typeof value === "number") return value;
  if (typeof value === "string") {
    const characters = Array.from(value);
    return characters.length <= maximumStringLength
      ? value
      : `${characters.slice(0, maximumStringLength).join("")}[TRUNCATED]`;
  }
  if (typeof value !== "object") return Object.freeze({ type: typeof value });
  if (depth >= maximumDepth) return "[TRUNCATED]";
  if (seen.has(value)) return "[CIRCULAR]";
  if (!Array.isArray(value) && !isPlainObject(value)) {
    return Object.freeze({
      type: value instanceof Error ? value.name || "Error" : value.constructor?.name || "object",
      ...(typeof Blob !== "undefined" && value instanceof Blob ? { bytes: value.size } : {}),
    });
  }
  seen.add(value);
  if (Array.isArray(value)) {
    const result = value
      .slice(0, maximumCollectionSize)
      .map((entry) => sanitize(entry, depth + 1, seen));
    seen.delete(value);
    return Object.freeze(result);
  }
  const result: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value).slice(0, maximumCollectionSize)) {
    result[key] = sensitiveKeys.has(normalizeKey(key))
      ? "[REDACTED]"
      : sanitize(entry, depth + 1, seen);
  }
  seen.delete(value);
  return Object.freeze(result);
}

/**
 * Bounds and redacts inert diagnostic details.
 *
 * @param value - Untrusted diagnostic details.
 * @returns Sanitized immutable details.
 */
export function sanitizeMiaixzErrorDetails(value: unknown): unknown {
  return sanitize(value, 0, new WeakSet());
}

/**
 * Removes content from an arbitrary thrown value before attaching it as Error.cause.
 *
 * @param value - Untrusted thrown value.
 * @returns Content-free immutable cause metadata.
 */
export function sanitizeMiaixzErrorCause(value: unknown): unknown {
  if (value === undefined) return undefined;
  return Object.freeze({ type: value instanceof Error ? value.name || "Error" : typeof value });
}

/**
 * Applies the sole server-message normalization used by MiaixzApiError.
 *
 * @param value - Untrusted backend message.
 * @returns Bounded normalized text, or undefined when empty.
 */
export function sanitizeMiaixzServerMessage(value: string): string | undefined {
  const sanitized = Array.from(
    value
      .trim()
      .replace(/\p{Cc}+/gu, " ")
      .replace(/\s+/gu, " "),
  )
    .slice(0, 512)
    .join("");
  return sanitized.length === 0 ? undefined : sanitized;
}
