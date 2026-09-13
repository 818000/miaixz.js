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

import { MiaixzUiError } from "../../errors/ui-error.js";
import {
  findMiaixzCollectionTypeaheadMatch,
  getMiaixzCollectionKeyboardResult,
  getMiaixzEnabledCollectionItems,
  isMiaixzCollectionTypeaheadKey,
} from "./keyboard.js";
import type {
  MiaixzCollectionItem,
  MiaixzCollectionKeyboardOptions,
  MiaixzCollectionKeyboardResult,
} from "./types.js";

const typeaheadTimeout = 500;

/**
 * Validates stable ids, optional values, and focusable typeahead text.
 *
 * @param items - Collection items to validate.
 */
export function validateMiaixzCollectionItems(items: readonly MiaixzCollectionItem[]): void {
  const ids = new Set<string>();
  const values = new Set<string>();
  for (const item of items) {
    if (ids.has(item.id)) {
      throw new MiaixzUiError({
        code: "UI_COLLECTION_DUPLICATE_ID",
      });
    }
    ids.add(item.id);
    if (item.value !== undefined) {
      if (values.has(item.value)) {
        throw new MiaixzUiError({
          code: "UI_COLLECTION_DUPLICATE_VALUE",
        });
      }
      values.add(item.value);
    }
    if (item.disabled !== true && item.textValue.trim().length === 0) {
      throw new MiaixzUiError({
        code: "UI_COLLECTION_TEXT_VALUE_INVALID",
      });
    }
  }
}

/**
 * Owns active identity and typeahead across synchronous and asynchronous item updates.
 */
export class MiaixzCollectionController {
  private items: readonly MiaixzCollectionItem[] = [];
  private currentActiveId: string | null = null;
  private typeahead = "";
  private typeaheadAt = 0;

  /**
   * Creates a validated collection with an optional initial active identity.
   *
   * @param items - Initial collection items.
   * @param activeId - Preferred initial active identity.
   */
  constructor(items: readonly MiaixzCollectionItem[], activeId: string | null = null) {
    this.updateItems(items);
    this.setActiveId(activeId);
  }

  /**
   * Returns the retained active identity.
   *
   * @returns Current enabled active identity.
   */
  get activeId(): string | null {
    return this.currentActiveId;
  }

  /**
   * Returns the current validated item sequence.
   *
   * @returns Current immutable item sequence.
   */
  get collectionItems(): readonly MiaixzCollectionItem[] {
    return this.items;
  }

  /**
   * Replaces items while retaining an enabled active id across asynchronous updates.
   *
   * @param items - Next complete item sequence.
   */
  updateItems(items: readonly MiaixzCollectionItem[]): void {
    validateMiaixzCollectionItems(items);
    const previousItems = this.items;
    const previousId = this.currentActiveId;
    this.items = items;
    if (previousId !== null && items.some((item) => item.id === previousId && !item.disabled))
      return;
    const previousIndex = previousItems.findIndex((item) => item.id === previousId);
    const enabled = getMiaixzEnabledCollectionItems(items);
    this.currentActiveId =
      items.slice(Math.max(previousIndex, 0)).find((item) => !item.disabled)?.id ??
      [...items.slice(0, Math.max(previousIndex, 0))].reverse().find((item) => !item.disabled)
        ?.id ??
      enabled[0]?.id ??
      null;
  }

  /**
   * Sets an enabled active id, or selects the first enabled item for null or invalid ids.
   *
   * @param activeId - Requested active identity.
   */
  setActiveId(activeId: string | null): void {
    const requested = this.items.find((item) => item.id === activeId && !item.disabled);
    this.currentActiveId =
      requested?.id ?? getMiaixzEnabledCollectionItems(this.items)[0]?.id ?? null;
  }

  /**
   * Applies one key command and updates the retained active identity.
   *
   * @param key - Keyboard key to process.
   * @param options - Orientation, direction, and wrapping configuration.
   * @param timestamp - Event time used to expire typeahead.
   * @returns Resolved navigation or activation result.
   */
  handleKey(
    key: string,
    options: MiaixzCollectionKeyboardOptions,
    timestamp = Date.now(),
  ): MiaixzCollectionKeyboardResult {
    if (isMiaixzCollectionTypeaheadKey(key)) {
      const normalized = key.toLocaleLowerCase();
      this.typeahead =
        timestamp - this.typeaheadAt > typeaheadTimeout ? normalized : this.typeahead + normalized;
      this.typeaheadAt = timestamp;
      if ([...this.typeahead].every((character) => character === normalized)) {
        this.typeahead = normalized;
      }
      this.currentActiveId = findMiaixzCollectionTypeaheadMatch(
        this.items,
        this.currentActiveId,
        this.typeahead,
      );
      return { handled: true, activeId: this.currentActiveId, activate: false };
    }
    this.typeahead = "";
    const result = getMiaixzCollectionKeyboardResult(
      this.items,
      this.currentActiveId,
      key,
      options,
    );
    if (result.handled) this.currentActiveId = result.activeId;
    return result;
  }
}
