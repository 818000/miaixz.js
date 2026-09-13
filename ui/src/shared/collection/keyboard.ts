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

import type {
  MiaixzCollectionItem,
  MiaixzCollectionKeyboardOptions,
  MiaixzCollectionKeyboardResult,
} from "./types.js";

/**
 * Returns enabled collection items without changing their order.
 *
 * @param items - Ordered collection items.
 * @returns Enabled items in their original order.
 */
export function getMiaixzEnabledCollectionItems(
  items: readonly MiaixzCollectionItem[],
): readonly MiaixzCollectionItem[] {
  return items.filter((item) => item.disabled !== true);
}

/**
 * Finds a typeahead match after the active item and wraps once.
 *
 * @param items - Ordered collection items.
 * @param activeId - Current active identity.
 * @param query - Accumulated printable-key query.
 * @returns Matching enabled identity or the previous identity.
 */
export function findMiaixzCollectionTypeaheadMatch(
  items: readonly MiaixzCollectionItem[],
  activeId: string | null,
  query: string,
): string | null {
  const enabled = getMiaixzEnabledCollectionItems(items);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (enabled.length === 0 || normalizedQuery.length === 0) return activeId;
  const activeIndex = enabled.findIndex((item) => item.id === activeId);
  for (let offset = 1; offset <= enabled.length; offset += 1) {
    const index = (Math.max(activeIndex, -1) + offset) % enabled.length;
    const item = enabled[index];
    if (item?.textValue.toLocaleLowerCase().startsWith(normalizedQuery)) return item.id;
  }
  return activeId;
}

/**
 * Resolves Home, End, arrows, and activation against enabled items.
 *
 * @param items - Ordered collection items.
 * @param activeId - Current active identity.
 * @param key - Keyboard key to resolve.
 * @param options - Orientation, direction, and wrapping configuration.
 * @returns Deterministic keyboard command result.
 */
export function getMiaixzCollectionKeyboardResult(
  items: readonly MiaixzCollectionItem[],
  activeId: string | null,
  key: string,
  options: MiaixzCollectionKeyboardOptions,
): MiaixzCollectionKeyboardResult {
  const enabled = getMiaixzEnabledCollectionItems(items);
  if (key === "Enter" || key === " ") {
    return { handled: activeId !== null, activeId, activate: activeId !== null };
  }
  if (enabled.length === 0) return { handled: false, activeId: null, activate: false };
  if (key === "Home") return { handled: true, activeId: enabled[0]?.id ?? null, activate: false };
  if (key === "End") {
    return { handled: true, activeId: enabled.at(-1)?.id ?? null, activate: false };
  }

  let movement = 0;
  if (options.orientation !== "horizontal" && key === "ArrowDown") movement = 1;
  if (options.orientation !== "horizontal" && key === "ArrowUp") movement = -1;
  if (options.orientation !== "vertical" && key === "ArrowRight") {
    movement = options.direction === "rtl" ? -1 : 1;
  }
  if (options.orientation !== "vertical" && key === "ArrowLeft") {
    movement = options.direction === "rtl" ? 1 : -1;
  }
  if (movement === 0) return { handled: false, activeId, activate: false };

  const activeIndex = enabled.findIndex((item) => item.id === activeId);
  const fallbackIndex = movement > 0 ? 0 : enabled.length - 1;
  if (activeIndex < 0) {
    return { handled: true, activeId: enabled[fallbackIndex]?.id ?? null, activate: false };
  }
  const candidateIndex = activeIndex + movement;
  if (candidateIndex >= 0 && candidateIndex < enabled.length) {
    return { handled: true, activeId: enabled[candidateIndex]?.id ?? null, activate: false };
  }
  if (!options.loop) return { handled: true, activeId, activate: false };
  return { handled: true, activeId: enabled[fallbackIndex]?.id ?? null, activate: false };
}

/**
 * Reports whether a key can extend the typeahead buffer.
 *
 * @param key - Keyboard key to inspect.
 * @returns Whether the key is one printable non-whitespace character.
 */
export function isMiaixzCollectionTypeaheadKey(key: string): boolean {
  return [...key].length === 1 && key.trim().length > 0;
}
