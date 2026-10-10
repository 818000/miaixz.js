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

import { ICON_NAMES, type IconName } from "../values/icons.js";
import { FONT_FAMILY, ICON_SIZES } from "../values/design.js";

/**
 * Immutable glyph record constructed from the canonical name-to-codepoint mapping.
 */
interface InternalIconRecord {
  readonly name: IconName;
  readonly codepoint: number;
  readonly glyph: string;
  readonly rtl: "none" | "mirror";
}

/**
 * Font-load state retaining the promise shared by concurrent icon requests.
 */
interface PendingFont {
  readonly status: "pending";
  readonly promise: Promise<void>;
}

/**
 * Terminal state indicating the complete icon font is available.
 */
interface ResolvedFont {
  readonly status: "resolved";
}

/**
 * Terminal font-load state retaining the error until an explicit reset.
 */
interface FailedFont {
  readonly status: "failed";
  readonly error: unknown;
}

/**
 * Discriminated pending, resolved, or failed state of the shared font loader.
 */
type FontState = PendingFont | ResolvedFont | FailedFont;

let fontState: FontState | undefined;
const firstTuple = Object.values(ICON_NAMES)[0];
if (firstTuple === undefined) throw new Error("[miaixz] Icon font contains no glyphs.");
const representativeGlyph = String.fromCodePoint(firstTuple[0]);

/**
 * Returns whether a string is one of the generated stable font-backed names.
 *
 * @param value - Candidate public name.
 * @returns Whether the name is font-backed.
 */
export function isIconName(value: string): value is IconName {
  return Object.hasOwn(ICON_NAMES, value);
}

/**
 * Validates and narrows one public icon name.
 *
 * @param value - Candidate name.
 * @returns Valid public name.
 * @throws TypeError when the name is absent from the generated mapping.
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
  if (!isIconName(name)) throw new TypeError(`[miaixz] Missing font record for "${name}".`);
  const [codepoint, rtlFlag] = ICON_NAMES[name];
  return Object.freeze({
    name,
    codepoint,
    glyph: String.fromCodePoint(codepoint),
    rtl: rtlFlag === 1 ? "mirror" : "none",
  });
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

  const promise = document.fonts
    .load(`${String(ICON_SIZES.inline.pixels)}px ${JSON.stringify(FONT_FAMILY)}`, glyph)
    .then(
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
 * @throws TypeError when the name is invalid, or a Promise while font loading is pending.
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
 * @returns Promise resolving when the font is ready or during SSR, rejecting on font-load failure.
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
