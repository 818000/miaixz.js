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
 * Owns the font-only icon lookup and single-font loading state.
 */

import {
  INTERNAL_ICON_BY_NAME,
  INTERNAL_ICON_NAMES,
  INTERNAL_ICON_RECORDS,
  type IconName,
  type InternalIconRecord,
} from "../autogen/icons.js";

interface PendingFont {
  readonly status: "pending";
  readonly promise: Promise<void>;
}

interface ResolvedFont {
  readonly status: "resolved";
}

interface FailedFont {
  readonly status: "failed";
  readonly error: unknown;
}

type FontState = PendingFont | ResolvedFont | FailedFont;

let fontState: FontState | undefined;
const representativeGlyph = INTERNAL_ICON_RECORDS[0]?.glyph;
if (representativeGlyph === undefined) throw new Error("[miaixz] Icon font contains no glyphs.");

/**
 * Returns whether a string is one of the generated stable font-backed names.
 *
 * @param value - Candidate public name.
 * @returns Whether the name is font-backed.
 */
export function isIconName(value: string): value is IconName {
  return INTERNAL_ICON_NAMES.has(value);
}

/**
 * Validates and narrows one public icon name.
 *
 * @param value - Candidate name.
 * @returns Valid public name.
 */
export function parseIconName(value: string): IconName {
  if (!isIconName(value)) throw new TypeError(`[miaixz] Unknown icon name "${value}".`);
  return value;
}

/**
 * Resolves the immutable font record for one public name.
 *
 * @param name - Font-backed icon name.
 * @returns Immutable codepoint and direction metadata.
 */
function resolveIcon(name: IconName): Readonly<InternalIconRecord> {
  const record = INTERNAL_ICON_BY_NAME.get(name);
  if (record === undefined) throw new TypeError(`[miaixz] Missing font record for "${name}".`);
  return record;
}

/**
 * Loads the complete icon font. Concurrent requests share one promise.
 *
 * @param glyph - Representative glyph from the complete font.
 * @returns Promise completed when the browser font is available.
 */
function loadIconFont(glyph = representativeGlyph): Promise<void> {
  if (typeof document === "undefined" || document.fonts === undefined) return Promise.resolve();
  const current = fontState;
  if (current?.status === "resolved") return Promise.resolve();
  if (current?.status === "pending") return current.promise;
  if (current?.status === "failed") return Promise.reject(current.error);

  const promise = document.fonts.load('16px "Miaixz Icons"', glyph).then(
    (faces) => {
      if (faces.length === 0) throw new Error("[miaixz] Unable to load the icon font.");
      fontState = { status: "resolved" };
    },
    (error: unknown) => {
      fontState = { status: "failed", error };
      throw error;
    },
  );
  fontState = { status: "pending", promise };
  void promise.catch((error: unknown) => {
    fontState = { status: "failed", error };
  });
  return promise;
}

/**
 * Reads a font record for React rendering, suspending while the font loads
 * and returning null after a controlled load failure.
 *
 * @param name - Font-backed icon name.
 * @returns Resolved record or null after a font failure.
 */
export function readIcon(name: IconName): Readonly<InternalIconRecord> | null {
  const record = resolveIcon(name);
  if (typeof document === "undefined" || document.fonts === undefined) return record;
  const current = fontState;
  if (current?.status === "resolved") return record;
  if (current?.status === "failed") return null;
  const pending = current?.promise ?? loadIconFont(record.glyph);
  throw pending.catch(() => undefined);
}

/**
 * Preloads the complete stable icon font.
 *
 * @returns Promise completed when Core is ready, or immediately during SSR.
 */
export function preloadIconFont(): Promise<void> {
  return loadIconFont();
}

/**
 * Clears browser font state for isolated tests and controlled retries.
 *
 * @internal
 */
export function resetIconFontLoads(): void {
  fontState = undefined;
}
