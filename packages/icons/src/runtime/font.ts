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
 * Owns the font-only icon lookup and subset loading state.
 */

import { ICON_CODEPOINTS } from "../autogen/codepoints.js";
import { ICON_NAME_LIST, type IconName } from "../autogen/names.js";

export type IconVariant = "outline" | "filled";
export type IconSubset = "core" | "extended";
export type IconDirection = "none" | "mirror";

export interface MiaixzIconRecord {
  readonly name: IconName;
  readonly codepoint: number;
  readonly glyph: string;
  readonly subset: IconSubset;
  readonly rtl: IconDirection;
}

interface PendingSubset {
  readonly status: "pending";
  readonly promise: Promise<void>;
}

interface ResolvedSubset {
  readonly status: "resolved";
}

interface FailedSubset {
  readonly status: "failed";
  readonly error: unknown;
}

type SubsetState = PendingSubset | ResolvedSubset | FailedSubset;

const iconNames = new Set<string>(ICON_NAME_LIST);
const iconRecords = new Map<IconName, MiaixzIconRecord>(
  ICON_CODEPOINTS.map((entry) => [
    entry.name,
    Object.freeze({
      name: entry.name,
      codepoint: entry.codepoint,
      glyph: String.fromCodePoint(entry.codepoint),
      subset: entry.subset,
      rtl: entry.rtl,
    }),
  ]),
);
const subsetStates = new Map<IconSubset, SubsetState>();

/**
 * Returns whether a string is one of the 1024 font-backed names.
 *
 * @param value - Candidate public name.
 * @returns Whether the name is font-backed.
 */
export function isIconName(value: string): value is IconName {
  return iconNames.has(value);
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
 * @returns Immutable codepoint and subset metadata.
 */
export function resolveMiaixzIcon(name: IconName): MiaixzIconRecord {
  const record = iconRecords.get(name);
  if (record === undefined) throw new TypeError(`[miaixz] Missing font record for "${name}".`);
  return record;
}

/**
 * Loads exactly one font subset. Concurrent requests share one promise and
 * failures remain isolated by subset.
 *
 * @param subset - Core or Extended subset.
 * @param glyph - Representative glyph from that subset.
 * @returns Promise completed when the browser font is available.
 */
export function loadMiaixzIconSubset(subset: IconSubset, glyph: string): Promise<void> {
  if (typeof document === "undefined" || document.fonts === undefined) return Promise.resolve();
  const current = subsetStates.get(subset);
  if (current?.status === "resolved") return Promise.resolve();
  if (current?.status === "pending") return current.promise;
  if (current?.status === "failed") return Promise.reject(current.error);

  const promise = document.fonts.load('16px "Miaixz Icons"', glyph).then(
    (faces) => {
      if (faces.length === 0) throw new Error(`[miaixz] Unable to load the ${subset} icon font.`);
      subsetStates.set(subset, { status: "resolved" });
    },
    (error: unknown) => {
      subsetStates.set(subset, { status: "failed", error });
      throw error;
    },
  );
  subsetStates.set(subset, { status: "pending", promise });
  void promise.catch((error: unknown) => {
    subsetStates.set(subset, { status: "failed", error });
  });
  return promise;
}

/**
 * Reads a font record for React rendering, suspending while its subset loads
 * and returning null after a controlled load failure.
 *
 * @param name - Font-backed icon name.
 * @returns Resolved record or null after a font failure.
 */
export function readMiaixzIcon(name: IconName): MiaixzIconRecord | null {
  const record = resolveMiaixzIcon(name);
  if (typeof document === "undefined" || document.fonts === undefined) return record;
  const current = subsetStates.get(record.subset);
  if (current?.status === "resolved") return record;
  if (current?.status === "failed") return null;
  const pending = current?.promise ?? loadMiaixzIconSubset(record.subset, record.glyph);
  throw pending.catch(() => undefined);
}

/**
 * Preloads only the 64-glyph Core font.
 *
 * @returns Promise completed when Core is ready, or immediately during SSR.
 */
export function preloadMiaixzIconFont(): Promise<void> {
  return loadMiaixzIconSubset("core", String.fromCodePoint(0xf0000));
}

/**
 * Clears browser subset state for isolated tests and controlled retries.
 *
 * @internal
 */
export function resetMiaixzIconFontLoads(): void {
  subsetStates.clear();
}
